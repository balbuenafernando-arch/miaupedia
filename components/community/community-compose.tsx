"use client";

import Link from "next/link";
import { MessageCircleHeart } from "lucide-react";
import { GoogleAccess } from "./community-auth";
import { useRouter } from "next/navigation";
import { useCallback,useRef,useState, type FormEvent } from "react";
import { findBranch,findBranches,publishCommunity, type Branch, type BranchType } from "@/lib/community";
import { validateCommunityContent } from "@/lib/content-filter";
import { useCatalogResource } from "@/components/recommendations/use-catalog-resource";
import { useCommunityAccess } from "./community-shell";

export function CommunityCompose({slug}: {slug?:string}) {
  const {userId} = useCommunityAccess();
  if (userId === undefined) return <p className="community-status" role="status">Cargando acceso…</p>;
  if (!userId) return <section className="community-invitation community-narrow">
    <span className="community-illustration"><MessageCircleHeart size={32} aria-hidden="true"/></span>
    <h1>¿Tienes una buena fija?</h1>
    <p>Compártela con quienes también quieren lo mejor para sus gatos.</p>
    <GoogleAccess/>
  </section>;
  return <section className="community-narrow community-compose">
    <h1>Pasar la voz</h1>
    <p className="community-lead">Cuenta qué encontraste o cómo fue la atención. Empieza con lo que le dirías a un amigo.</p>
    <ComposeForm key={userId} slug={slug}/>
  </section>;
}

function ComposeForm({slug}: {slug?:string}) {
  const router=useRouter();
  const {requireParticipation}=useCommunityAccess();
  const [kind,setKind]=useState<"free"|"business">(slug ? "business" : "free");
  const [selected,setSelected]=useState<Branch|null>(null);
  const [pending,setPending]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [proposal,setProposal]=useState(false);
  const [name,setName]=useState("");
  const [district,setDistrict]=useState("");
  const [address,setAddress]=useState("");
  const [branchType,setBranchType]=useState<BranchType>("Veterinaria");
  const [query,setQuery]=useState<{name:string;district:string;address:string}|null>(null);
  const id=useRef<string>(null);
  const loadMatches=useCallback((signal:AbortSignal)=>{
    return query ? findBranches(query.name,query.district,query.address,signal) : Promise.resolve([]);
  },[query]);
  const matches=useCatalogResource(loadMatches);
  const loadBranch=useCallback((signal:AbortSignal)=>slug ? findBranch(slug,signal) : Promise.resolve(null),[slug]);
  const initial=useCatalogResource(loadBranch);
  const branch=selected ?? (initial.resource.status==="ready" ? initial.resource.data : null);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const form=new FormData(event.currentTarget);
    const title=String(form.get("title") ?? "").trim();
    const body=String(form.get("body") ?? "").trim();
    const location=String(form.get("location") ?? "").trim();
    const priceText=String(form.get("price") ?? "");
    const validation=validateCommunityContent(title,3) || validateCommunityContent(body,5) ||
      validateCommunityContent(location,0);
    if (validation) return setError(validation);
    if (kind==="business" && !branch && !proposal) return setError("Busca la sede y selecciónala o propón una nueva.");
    if (kind==="business" && proposal) {
      const branchValidation=validateCommunityContent(name,2) || validateCommunityContent(district,2) ||
        validateCommunityContent(address,4);
      if (branchValidation) return setError(branchValidation);
    }
    requireParticipation(()=>{
      setBusy(true);
      id.current ??= crypto.randomUUID();
      void publishCommunity({id:id.current,title,body,location,price:priceText ? Number(priceText) : null,
        branch:kind==="business" && !proposal ? branch : null,
        rating:kind==="business" ? Number(form.get("rating")) : null,
        proposal:kind==="business" && proposal ? {type:branchType,name:name.trim(),district:district.trim(),address:address.trim()} : null,
      }).then(postId=>{
        if (kind==="business" && proposal) setPending(true);
        else router.push(`/fijas/${postId}`);
      }).catch(cause=>setError(cause instanceof Error ? cause.message : "No pudimos publicar."))
        .finally(()=>setBusy(false));
    });
  }

  if (pending) return <div className="community-card" role="status">
    <h2>Tu sede está en revisión</h2><p>Guardamos tu experiencia. Aparecerá cuando la sede se apruebe.</p>
    <Link className="community-primary" href="/">Volver a explorar</Link>
  </div>;

  return <form className="community-form" onSubmit={submit}>
    <fieldset className="community-kind">
      <legend>¿Qué quieres compartir?</legend>
      <label><input type="radio" name="kind" checked={kind==="free"} onChange={()=>setKind("free")}/> Una fija</label>
      <label><input type="radio" name="kind" checked={kind==="business"} onChange={()=>setKind("business")}/> Atención en una sede</label>
    </fieldset>
    {kind==="business" && <fieldset className="community-form community-panel">
      <legend>Veterinaria o tienda</legend>
      {branch && !proposal ? <p><strong>{branch.nombre}</strong> · {branch.distrito}, {branch.direccion}</p> : <>
        <label>Nombre de la sede<input value={name} maxLength={120} onChange={event=>{setName(event.target.value);setQuery(null);setProposal(false);}} required={proposal}/></label>
        <label>Distrito<input value={district} maxLength={80} onChange={event=>{setDistrict(event.target.value);setQuery(null);setProposal(false);}} required={proposal}/></label>
        <label>Dirección<input value={address} maxLength={180} onChange={event=>{setAddress(event.target.value);setQuery(null);setProposal(false);}} required={proposal}/></label>
        <button type="button" className="community-secondary" disabled={name.trim().length<2} onClick={()=>setQuery({name,district,address})}>Buscar sedes</button>
        {query && matches.resource.status==="loading" && <p role="status">Buscando sedes…</p>}
        {query && matches.resource.status==="error" && <button type="button" className="community-secondary" onClick={matches.refresh}>Reintentar búsqueda</button>}
        {query && matches.resource.status==="ready" && <>
          {matches.resource.data.length ? matches.resource.data.map(item=><button
            key={item.id} type="button" className="community-secondary" onClick={()=>{setSelected(item);setProposal(false);}}>
            {item.nombre} · {item.distrito}, {item.direccion}
          </button>) : <p>No encontramos una sede con esos datos.</p>}
          <button type="button" className="community-link-button" onClick={()=>setProposal(true)}>Proponer esta sede</button>
        </>}
        {proposal && <label>Tipo de sede<select value={branchType} onChange={event=>setBranchType(event.target.value==="Pet Shop"?"Pet Shop":"Veterinaria")}>
          <option value="Veterinaria">Veterinaria</option><option value="Pet Shop">Tienda</option>
        </select></label>}
      </>}
      <label>Estrellas<select name="rating" defaultValue="" required>
        <option value="" disabled>Selecciona de 1 a 5</option>
        {[1,2,3,4,5].map(value=><option key={value} value={value}>{value} ★</option>)}
      </select></label>
    </fieldset>}
    <label>Título<input name="title" placeholder="Ej. Arena económica en el mercado" required minLength={3} maxLength={100}/></label>
    <label>{kind==="business" ? "¿Cómo fue la atención?" : "¿Cuál es la fija?"}
      <textarea name="body" required minLength={5} maxLength={2000} rows={4}/>
    </label>
    {kind==="free" && <label>Ubicación (opcional)<input name="location" maxLength={120} placeholder="Ej. Magdalena del Mar"/></label>}
    <label>Precio en soles (opcional)<input name="price" type="number" min="0" max="99999999.99" step="0.01" inputMode="decimal"/></label>
    {error && <p role="alert" className="community-error">{error}</p>}
    <button className="community-primary" disabled={busy}>{busy?"Enviando…":"Compartir fija"}</button>
  </form>;
}
