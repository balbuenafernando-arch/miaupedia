"use client";

import Link from "next/link";
import { Bookmark, Flag, MapPin, MessageCircle, ThumbsUp } from "lucide-react";
import { useCallback,useEffect,useRef,useState, type FormEvent } from "react";
import {
  addCommunityComment,findFija,getCommunityMarks,loadFijaActivity,reportCommunity,
  reportLabels,setCommunityMark,type Fija,type ReportReason,
} from "@/lib/community";
import { validateCommunityContent } from "@/lib/content-filter";
import { useCatalogResource } from "@/components/recommendations/use-catalog-resource";
import { useCommunityAccess } from "./community-shell";
import { CommunityShare } from "./community-share";
import { CommunityNotice } from "./community-notice";
import { AuthorLink, PostPhoto } from "./community-post-meta";
import { formatDate,formatPrice } from "./community-format";

type ReportTarget = {kind:"comment";id:string};

export function FijaDetail({id}: {id:string}) {
  const load=useCallback((signal:AbortSignal)=>findFija(id,signal),[id]);
  const {resource,refresh}=useCatalogResource(load);
  if (resource.status==="loading") return <p role="status">Cargando fija…</p>;
  if (resource.status!=="ready") return <button className="community-secondary" onClick={refresh}>Reintentar</button>;
  if (!resource.data) return <h1>Esta fija no está disponible</h1>;
  return <CommunityNotice><FijaContent key={id} item={resource.data}/></CommunityNotice>;
}

function FijaContent({item}: {item:Fija}) {
  const {userId,requireParticipation}=useCommunityAccess();
  const [panel,setPanel]=useState<"comment"|"report"|null>(null);
  const [target,setTarget]=useState<ReportTarget>();
  const formRef=useRef<HTMLFormElement>(null);
  const opener=useRef<HTMLButtonElement>(null);
  const [status,setStatus]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const locked=useRef(false);
  const loadActivity=useCallback((signal:AbortSignal)=>loadFijaActivity(item.id,signal),[item.id]);
  const activity=useCatalogResource(loadActivity);
  const loadMarks=useCallback((signal:AbortSignal)=>userId?getCommunityMarks(item.id,signal):Promise.resolve({vote:false,save:false}),[userId,item.id]);
  const marks=useCatalogResource(loadMarks);
  const current=marks.resource.status==="ready" ? marks.resource.data : {vote:false,save:false};
  const [actionCount,setActionCount]=useState<{id:string;count:number}|null>(null);
  useEffect(()=>{
    const form=formRef.current;
    if (!panel || !form) return;
    const frame=requestAnimationFrame(()=>{
      form.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",block:"center"});
      form.querySelector<HTMLElement>("textarea, select")?.focus({preventScroll:true});
    });
    return ()=>cancelAnimationFrame(frame);
  },[panel,target]);

  function closePanel() {
    setPanel(null);
    requestAnimationFrame(()=>opener.current?.focus());
  }

  function action(work:()=>Promise<void>, after:()=>void) {
    requireParticipation(()=>{
      if (locked.current) return;
      locked.current=true;setBusy(true);setError("");setStatus("");
      void work().then(after).catch(cause=>setError(cause instanceof Error?cause.message:"No pudimos guardar el cambio."))
        .finally(()=>{locked.current=false;setBusy(false);});
    });
  }

  function toggle(kind:"vote"|"save") {
    const enabled=!current[kind];
    action(async()=>{
      await setCommunityMark(kind,item.id,enabled);
      if (kind==="vote") {
        const updated=await findFija(item.id,new AbortController().signal);
        if (updated) setActionCount({id:item.id,count:updated.utiles});
      }
    },()=>{
      marks.refresh();
      setStatus(kind==="save" ? (enabled?"Fija guardada.":"Fija quitada de Guardados.") : (enabled?"Voto registrado.":"Voto retirado."));
    });
  }

  function startReport(button:HTMLButtonElement, reportTarget?:ReportTarget) {
    requireParticipation(()=>{opener.current=button;setError("");setTarget(reportTarget);setPanel("report");});
  }

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const value=String(data.get("text") ?? "").trim();
    const reason=String(data.get("reason"));
    const validation=validateCommunityContent(value,0);
    if (validation) {setError(validation);return;}
    if (panel==="comment") action(()=>addCommunityComment(crypto.randomUUID(),item.id,value),()=>{
      closePanel();activity.refresh();setStatus("Comentario publicado.");
    });
    if (panel==="report" && Object.hasOwn(reportLabels,reason)) action(()=>reportCommunity(item.id,reason as ReportReason,target),()=>{
      closePanel();setStatus("Reporte enviado a moderación.");
    });
  }

  return <section className="community-narrow">
    <Link className="community-back" href="/">← Explorar fijas</Link>
    <article className="community-card">
      <div className="community-meta">
        <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
        <AuthorLink alias={item.autor} slug={item.author_slug}/>
      </div>
      <h1>{item.title}</h1>
      {item.rating && <p className="community-rating">★ {item.rating} de 5</p>}
      <p className="community-prose">{item.body}</p>
      <PostPhoto source={item.image_url}/>
      <div className="community-meta">
        {item.location && <span><MapPin size={15} aria-hidden="true"/>{item.location}</span>}
        {item.price !== null && <span>Precio publicado · {formatPrice(item.price)}</span>}
      </div>
      <div className="community-actions">
        <button className="community-secondary" disabled={busy || marks.resource.status==="loading"}
          aria-pressed={current.vote} onClick={()=>toggle("vote")}><ThumbsUp size={16}/> Me sirvió · {actionCount?.count ?? item.utiles}</button>
        <button className="community-secondary" disabled={busy || marks.resource.status==="loading"}
          aria-pressed={current.save} onClick={()=>toggle("save")}><Bookmark size={16}/> {current.save?"Quitar guardado":"Guardar"}</button>
        <CommunityShare path={`/fijas/${item.id}`} title={item.title}/>
        <button className="community-link-button" onClick={event=>startReport(event.currentTarget)}><Flag size={15}/> Reportar</button>
      </div>
    </article>
    <div className="community-actions">
      <button className="community-secondary" onClick={event=>{
        const button=event.currentTarget;
        requireParticipation(()=>{opener.current=button;setError("");setTarget(undefined);setPanel("comment");});
      }}><MessageCircle size={16}/> Comentar o preguntar</button>
    </div>
    {status && <p role="status">{status}</p>}
    {error && <p role="alert" className="community-error">{error}</p>}
    {panel && <form ref={formRef} className="community-form community-panel community-action-form" onSubmit={submit} key={panel} aria-label={panel==="comment"?"Escribir comentario":"Reportar contenido"}>
      {panel==="comment" && <label>Comentario o pregunta<textarea name="text" minLength={2} maxLength={1000} rows={3} required/></label>}
      {panel==="report" && <label>Motivo del reporte<select name="reason" required defaultValue="">
        <option value="" disabled>Selecciona un motivo</option>
        {Object.entries(reportLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
      </select></label>}
      <div className="community-actions">
        <button className="community-primary" disabled={busy}>{panel==="report"?"Enviar reporte":"Publicar comentario"}</button>
        <button className="community-link-button" type="button" onClick={closePanel}>Cancelar</button>
      </div>
    </form>}
    {activity.resource.status==="loading" && <p role="status">Cargando actividad…</p>}
    {activity.resource.status==="error" && <button className="community-secondary" onClick={activity.refresh}>Reintentar actividad</button>}
    {activity.resource.status==="ready" && <>
      <section>
        <h2>Comentarios y preguntas</h2>
        {activity.resource.data.length ? <ul className="community-list">{activity.resource.data.map(comment=>
          <li className="community-card community-compact" key={comment.id}>
            <div className="community-meta"><strong>{comment.autor}</strong><time dateTime={comment.created_at}>{formatDate(comment.created_at)}</time></div>
            <p className="community-prose">{comment.body}</p>
            <button className="community-link-button" onClick={event=>startReport(event.currentTarget,{kind:"comment",id:comment.id})}>Reportar comentario</button>
          </li>)}</ul> : <p>Aún no hay comentarios.</p>}
      </section>
    </>}
  </section>;
}
