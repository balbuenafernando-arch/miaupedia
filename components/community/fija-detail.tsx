"use client";

import Link from "next/link";
import { Bookmark, Flag, MapPin, MessageCircle, ThumbsUp } from "lucide-react";
import { useCallback,useRef,useState, type FormEvent } from "react";
import {
  addCommunityComment,addCommunityUpdate,findFija,getCommunityMarks,loadFijaActivity,reportCommunity,
  reportLabels,setCommunityMark,updateLabels,type Fija,type ReportReason,type UpdateKind,
} from "@/lib/community";
import { validateCommunityContent } from "@/lib/content-filter";
import { useCatalogResource } from "@/components/recommendations/use-catalog-resource";
import { useCommunityAccess } from "./community-shell";
import { formatDate,formatPrice,freshnessLabel } from "./community-format";

type ReportTarget = {kind:"comment"|"update";id:string};

export function FijaDetail({id}: {id:string}) {
  const load=useCallback((signal:AbortSignal)=>findFija(id,signal),[id]);
  const {resource,refresh}=useCatalogResource(load);
  if (resource.status==="loading") return <p role="status">Cargando fija…</p>;
  if (resource.status!=="ready") return <button className="community-secondary" onClick={refresh}>Reintentar</button>;
  if (!resource.data) return <h1>Esta fija no está disponible</h1>;
  return <FijaContent key={id} item={resource.data}/>;
}

function FijaContent({item}: {item:Fija}) {
  const {userId,requireParticipation}=useCommunityAccess();
  const [panel,setPanel]=useState<"comment"|"update"|"report"|null>(null);
  const [target,setTarget]=useState<ReportTarget>();
  const [change,setChange]=useState<UpdateKind>("other");
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
  const [fresh,setFresh]=useState<typeof item.freshness|null>(null);

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

  function startReport(reportTarget?:ReportTarget) {
    requireParticipation(()=>{setTarget(reportTarget);setPanel("report");});
  }

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const value=String(data.get("text") ?? "").trim();
    const price=Number(data.get("price"));
    const reason=String(data.get("reason"));
    const validation=validateCommunityContent(value,0);
    if (validation) {setError(validation);return;}
    if (panel==="comment") action(()=>addCommunityComment(crypto.randomUUID(),item.id,value),()=>{
      setPanel(null);activity.refresh();setStatus("Comentario publicado.");
    });
    if (panel==="update") action(()=>addCommunityUpdate(crypto.randomUUID(),item.id,change,value,change==="price"?price:null),()=>{
      setPanel(null);setFresh("changed");activity.refresh();setStatus("Cambio registrado.");
    });
    if (panel==="report" && Object.hasOwn(reportLabels,reason)) action(()=>reportCommunity(item.id,reason as ReportReason,target),()=>{
      setPanel(null);setStatus("Reporte enviado a moderación.");
    });
  }

  return <section className="community-narrow">
    <Link className="community-back" href="/">← Explorar fijas</Link>
    <article className="community-card">
      <div className="community-meta"><span className="community-tag">{freshnessLabel[fresh ?? item.freshness]}</span>
        <time dateTime={item.created_at}>{formatDate(item.created_at)}</time><span>{item.autor}</span></div>
      <h1>{item.title}</h1>
      {item.rating && <p className="community-rating">★ {item.rating} de 5</p>}
      <p className="community-prose">{item.body}</p>
      <div className="community-meta">
        {item.location && <span><MapPin size={15} aria-hidden="true"/>{item.location}</span>}
        {item.price !== null && <span>Precio publicado · {formatPrice(item.price)}</span>}
      </div>
      <div className="community-actions">
        <button className="community-secondary" disabled={busy || marks.resource.status==="loading"}
          aria-pressed={current.vote} onClick={()=>toggle("vote")}><ThumbsUp size={16}/> Me sirvió · {actionCount?.count ?? item.utiles}</button>
        <button className="community-secondary" disabled={busy || marks.resource.status==="loading"}
          aria-pressed={current.save} onClick={()=>toggle("save")}><Bookmark size={16}/> {current.save?"Quitar guardado":"Guardar"}</button>
        <button className="community-link-button" onClick={()=>startReport()}><Flag size={15}/> Reportar</button>
      </div>
    </article>
    <div className="community-actions community-freshness">
      <button className="community-secondary" disabled={busy} onClick={()=>action(
        ()=>addCommunityUpdate(crypto.randomUUID(),item.id,"confirmed","",null),
        ()=>{setFresh("confirmed");activity.refresh();setStatus("Gracias por confirmar que sigue vigente.");},
      )}>Sigue vigente</button>
      <button className="community-secondary" onClick={()=>requireParticipation(()=>setPanel("update"))}>Ya cambió</button>
      <button className="community-secondary" onClick={()=>requireParticipation(()=>setPanel("comment"))}><MessageCircle size={16}/> Comentar o preguntar</button>
    </div>
    {status && <p role="status">{status}</p>}
    {error && <p role="alert" className="community-error">{error}</p>}
    {panel && <form className="community-form community-panel" onSubmit={submit} key={panel}>
      {panel==="comment" && <label>Comentario o pregunta<textarea name="text" minLength={2} maxLength={1000} rows={3} required/></label>}
      {panel==="update" && <>
        <label>¿Qué cambió?<select name="kind" value={change} onChange={event=>setChange(event.target.value as UpdateKind)}>
          {Object.entries(updateLabels).filter(([key])=>key!=="confirmed").map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select></label>
        {change==="price" && <label>Nuevo precio en soles<input name="price" type="number" min="0" max="99999999.99" step="0.01" required/></label>}
        <label>Detalle (opcional)<textarea name="text" maxLength={400} rows={2}/></label>
      </>}
      {panel==="report" && <label>Motivo del reporte<select name="reason" required defaultValue="">
        <option value="" disabled>Selecciona un motivo</option>
        {Object.entries(reportLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
      </select></label>}
      <div className="community-actions">
        <button className="community-primary" disabled={busy}>{panel==="report"?"Enviar reporte":panel==="comment"?"Publicar comentario":"Guardar cambio"}</button>
        <button className="community-link-button" type="button" onClick={()=>setPanel(null)}>Cancelar</button>
      </div>
    </form>}
    {activity.resource.status==="loading" && <p role="status">Cargando actividad…</p>}
    {activity.resource.status==="error" && <button className="community-secondary" onClick={activity.refresh}>Reintentar actividad</button>}
    {activity.resource.status==="ready" && <>
      {activity.resource.data.updates.length>0 && <section>
        <h2>Actualizaciones</h2>
        <ul className="community-list">{activity.resource.data.updates.map(update=><li className="community-card community-compact" key={update.id}>
          <div className="community-meta"><strong>{updateLabels[update.kind]}</strong><time dateTime={update.created_at}>{formatDate(update.created_at)}</time></div>
          {update.price !== null && <p>{formatPrice(update.price)}</p>}{update.note && <p>{update.note}</p>}
          <button className="community-link-button" onClick={()=>startReport({kind:"update",id:update.id})}>Reportar actualización</button>
        </li>)}</ul>
      </section>}
      <section>
        <h2>Comentarios y preguntas</h2>
        {activity.resource.data.comments.length ? <ul className="community-list">{activity.resource.data.comments.map(comment=>
          <li className="community-card community-compact" key={comment.id}>
            <div className="community-meta"><strong>{comment.autor}</strong><time dateTime={comment.created_at}>{formatDate(comment.created_at)}</time></div>
            <p className="community-prose">{comment.body}</p>
            <button className="community-link-button" onClick={()=>startReport({kind:"comment",id:comment.id})}>Reportar comentario</button>
          </li>)}</ul> : <p>Aún no hay comentarios.</p>}
      </section>
    </>}
  </section>;
}
