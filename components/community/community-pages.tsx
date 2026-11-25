"use client";

import Link from "next/link";
import { Bookmark, LogOut, MessageCircle, UserRound } from "lucide-react";
import Image from "next/image";
import { MiaupediaMark } from "@/components/miaupedia-logo";
import { GoogleAccess } from "./community-auth";
import { useCallback,useState } from "react";
import { createClient } from "@/lib/supabase";
import { branchExperiences, findBranch, listOwnFijas, listSavedFijas } from "@/lib/community";
import { useCatalogResource } from "@/components/recommendations/use-catalog-resource";
import { DirectoryCard } from "./community-feed";
import { useCommunityAccess } from "./community-shell";
import { formatDate } from "./community-format";

export function CommunitySaved() {
  const {userId}=useCommunityAccess();
  return <section>
    <h1>Guardados</h1>
    {userId ? <SavedList key={userId}/> : <div className="community-empty">
      <Bookmark aria-hidden="true"/><p>Inicia sesión para volver a tus fijas guardadas.</p>
      <GoogleAccess disabled={userId===undefined}/>
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
  </li>)}</ul> : <div className="community-empty"><Bookmark aria-hidden="true"/><p>Aún no has guardado fijas.</p><Link className="community-secondary" href="/">Explorar la comunidad</Link></div>;
}

function googleAvatar(value:unknown) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.hostname.endsWith(".googleusercontent.com") && !url.username && !url.password) return url.href;
  } catch {}
  return undefined;
}

export function CommunityProfile() {
  const {user}=useCommunityAccess();
  const [message,setMessage]=useState("");
  const [signingOut,setSigningOut]=useState(false);

  if (user === undefined) return <p className="community-status" role="status">Cargando perfil…</p>;
  if (!user) return <section className="community-invitation community-narrow">
    <span className="community-illustration"><MiaupediaMark/></span>
    <h1>Bienvenido a MIAUPEDIA</h1>
    <p>Únete para compartir tus fijas y guardar las que te sirvan.</p>
    <GoogleAccess/>
    {message && <p role="status">{message}</p>}
  </section>;

  const name = [user.user_metadata.full_name,user.user_metadata.name,user.user_metadata.display_name]
    .find((value): value is string => typeof value === "string" && !!value.trim()) ?? "Miauamigo";
  const avatar = googleAvatar(user.user_metadata.avatar_url ?? user.user_metadata.picture);
  return <section className="community-narrow">
    <div className="community-profile">
      <span className="community-avatar">{avatar ? <Image src={avatar} alt="" width={72} height={72}
        unoptimized referrerPolicy="no-referrer"/> : <UserRound size={34} aria-hidden="true"/>}</span>
      <h1>{name}</h1>
      {user.email && <p>{user.email}</p>}
      <button type="button" className="community-secondary" disabled={signingOut} onClick={async () => {
        setSigningOut(true);
        try {
          const client = createClient();
          if (!client) throw new Error("Sin acceso");
          const {error} = await client.auth.signOut({scope:"local"});
          if (error) throw error;
          setMessage("Sesión cerrada.");
        } catch {
          setMessage("No pudimos cerrar la sesión.");
        } finally { setSigningOut(false); }
      }}><LogOut size={17} aria-hidden="true"/> Cerrar sesión</button>
      {message && <p role="status">{message}</p>}
    </div>
    <OwnPosts key={user.id}/>
  </section>;
}

function OwnPosts() {
  const [page,setPage]=useState(0);
  const load=useCallback((signal:AbortSignal)=>listOwnFijas(page,signal),[page]);
  const {resource,refresh}=useCatalogResource(load);
  return <section aria-labelledby="own-fijas">
    <h2 id="own-fijas">Tus publicaciones</h2>
    {resource.status === "loading" && <p className="community-status" role="status">Cargando publicaciones…</p>}
    {resource.status === "error" && <div className="community-empty">
      <p>No pudimos cargar tus publicaciones.</p><button className="community-secondary" onClick={refresh}>Reintentar</button>
    </div>}
    {resource.status === "ready" && <>
      {resource.data.items.length ? <ul className="community-list">{resource.data.items.map(item=>
        <li key={item.id}>
          {item.pending ? <article className="community-card">
            <span className="community-tag">Sede en revisión</span><h3>{item.title}</h3>
          </article> : <DirectoryCard item={{...item,kind:"fija",slug:null,business_type:null,average_rating:null,experience_count:null}}/>}
        </li>)}</ul> : <div className="community-empty">
          <MessageCircle aria-hidden="true"/><p>Aún no has publicado fijas.</p>
          <Link className="community-primary" href="/pasar-la-voz">Compartir una fija</Link>
        </div>}
      {(page > 0 || resource.data.more) && <nav className="community-actions" aria-label="Paginación de tus publicaciones">
        <button className="community-secondary" disabled={!page} onClick={()=>setPage(page-1)}>Anterior</button>
        <button className="community-secondary" disabled={!resource.data.more} onClick={()=>setPage(page+1)}>Siguiente</button>
      </nav>}
    </>}
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
