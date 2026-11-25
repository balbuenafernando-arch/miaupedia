"use client";

import Link from "next/link";
import { Bookmark,CalendarDays,Cat,ChevronRight,LogOut } from "lucide-react";
import { useCallback,useState } from "react";
import { createClient } from "@/lib/supabase";
import { branchExperiences, findBranch, listSavedFijas } from "@/lib/community";
import { useCatalogResource } from "@/components/recommendations/use-catalog-resource";
import { DirectoryCard } from "./community-feed";
import { useCommunityAccess } from "./community-shell";
import { formatDate } from "./community-format";

export function CommunitySaved() {
  const {userId,requireAccount}=useCommunityAccess();
  return <section>
    <h1>Guardados</h1>
    {userId ? <SavedList key={userId}/> : <div className="community-empty">
      <Bookmark aria-hidden="true"/><p>Inicia sesión para volver a tus fijas guardadas.</p>
      <button className="community-primary" disabled={userId===undefined} onClick={()=>requireAccount(()=>undefined)}>Ingresar</button>
    </div>}
  </section>;
}

function SavedList() {
  const {resource,refresh}=useCatalogResource(listSavedFijas);
  if (resource.status==="loading") return <p role="status">Cargando guardados…</p>;
  if (resource.status==="error") return <button className="community-secondary" onClick={refresh}>Reintentar</button>;
  if (resource.status!=="ready") return null;
  const items=resource.data;
  return items.length ? <ul className="community-list">{items.map(item=><li key={item.id}>
    <DirectoryCard item={{...item,kind:"fija",slug:null,business_type:null,average_rating:null,experience_count:null}}/>
  </li>)}</ul> : <p>Aún no has guardado fijas. <Link href="/">Explorar la comunidad</Link></p>;
}

export function CommunityProfile() {
  const {userId,requireAccount}=useCommunityAccess();
  const [message,setMessage]=useState("");
  return <section className="community-narrow">
    <h1>Perfil</h1>
    {userId ? <button className="community-secondary" onClick={async()=>{
      const result=await createClient()?.auth.signOut({scope:"local"});
      setMessage(result && !result.error ? "Sesión cerrada." : "No pudimos cerrar la sesión.");
    }}><LogOut size={17}/> Cerrar sesión</button>
      : <button className="community-primary" disabled={userId===undefined} onClick={()=>requireAccount(()=>undefined)}>Ingresar</button>}
    {message && <p role="status">{message}</p>}
    <div className="community-profile-links">
      <Link href="/espacio-personal/mis-gatos"><Cat size={21} aria-hidden="true"/> Mis gatos <ChevronRight size={17} aria-hidden="true"/></Link>
      <Link href="/espacio-personal/agenda"><CalendarDays size={21} aria-hidden="true"/> Agenda <ChevronRight size={17} aria-hidden="true"/></Link>
    </div>
  </section>;
}

export function BranchDetail({slug}: {slug:string}) {
  const load=useCallback((signal:AbortSignal)=>findBranch(slug,signal),[slug]);
  const {resource,refresh}=useCatalogResource(load);
  if (resource.status==="loading") return <p role="status">Cargando sede…</p>;
  if (resource.status!=="ready") return <button className="community-secondary" onClick={refresh}>Reintentar</button>;
  if (!resource.data) return <h1>Sede no disponible</h1>;
  const b=resource.data;
  return <section className="community-narrow">
    <Link className="community-back" href="/">← Explorar sedes</Link>
    <p className="community-meta">{b.tipo==="Pet Shop"?"Tienda":"Veterinaria"}</p>
    <h1>{b.nombre}</h1><p>{b.direccion} · {b.distrito}</p>
    <Link className="community-primary" href={`/pasar-la-voz?sede=${encodeURIComponent(b.slug)}`}>Contar mi experiencia</Link>
    <BranchExperiences key={b.id} id={b.id}/>
  </section>;
}

function BranchExperiences({id}: {id:string}) {
  const [page,setPage]=useState(0);
  const load=useCallback((signal:AbortSignal)=>branchExperiences(id,page,signal),[id,page]);
  const {resource,refresh}=useCatalogResource(load);
  return <section>
    <h2>Experiencias en esta sede</h2>
    {resource.status==="loading" && <p role="status">Cargando experiencias…</p>}
    {resource.status==="error" && <button className="community-secondary" onClick={refresh}>Reintentar</button>}
    {resource.status==="ready" && <>
      {resource.data.items.length || resource.data.legacy.length ? <ul className="community-list">
        {resource.data.items.map(item=><li key={item.id} className="community-card">
          <p className="community-meta"><span className="community-rating">★ {item.rating} de 5</span><time dateTime={item.created_at}>{formatDate(item.created_at)}</time></p>
          <h3><Link href={`/fijas/${item.id}`}>{item.title}</Link></h3><p className="community-card-body">{item.body}</p>
        </li>)}
        {page===0 && resource.data.legacy.map(item=><li key={item.id} className="community-card">
          <p className="community-meta"><span className="community-rating">★ {item.puntuacion} de 5</span><time dateTime={item.created_at}>{formatDate(item.created_at)}</time></p>
          {item.comentario && <p>{item.comentario}</p>}
        </li>)}
      </ul> : <p>Aún no hay experiencias publicadas.</p>}
      {(page>0 || resource.data.more) && <nav className="community-actions" aria-label="Paginación de experiencias">
        <button className="community-secondary" disabled={!page} onClick={()=>setPage(page-1)}>Anterior</button>
        <button className="community-secondary" disabled={!resource.data.more} onClick={()=>setPage(page+1)}>Siguiente</button>
      </nav>}
    </>}
  </section>;
}
