"use client";

import Link from "next/link";
import { ThumbsUp, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { useCatalogResource } from "@/components/recommendations/use-catalog-resource";
import { loadPublicAuthor } from "@/lib/community";
import { DirectoryCard } from "./community-feed";
import { formatDate } from "./community-format";

export function PublicAuthorProfile({slug}: {slug:string}) {
  const [page,setPage]=useState(0);
  const load=useCallback((signal:AbortSignal)=>loadPublicAuthor(slug,page,signal),[slug,page]);
  const {resource,refresh}=useCatalogResource(load);
  if (resource.status==="loading") return <p role="status">Cargando perfil…</p>;
  if (resource.status!=="ready") return <button className="community-secondary" onClick={refresh}>Reintentar</button>;
  const {author,items,more}=resource.data;
  if (!author) return <h1>Perfil público no disponible</h1>;

  return <section className="community-narrow">
    <Link className="community-back" href="/">← Explorar</Link>
    <div className="community-profile">
      <span className="community-avatar"><UserRound size={32} aria-hidden="true"/></span>
      <h1>{author.alias}</h1>
      <p>En MIAUPEDIA desde <time dateTime={author.joined_at}>{formatDate(author.joined_at)}</time></p>
      <span className="community-tag"><ThumbsUp size={16} aria-hidden="true"/> {author.useful_votes} votos útiles recibidos</span>
    </div>
    <section aria-labelledby="fijas-autor">
      <h2 id="fijas-autor">Fijas publicadas</h2>
      <ul className="community-list">{items.map(item=><li key={item.id}>
        <DirectoryCard item={{...item,kind:"fija",slug:null,business_type:null,average_rating:null,experience_count:null}}/>
      </li>)}</ul>
      {(page>0 || more) && <nav className="community-actions" aria-label="Paginación de fijas del autor">
        <button className="community-secondary" disabled={!page} onClick={()=>setPage(page-1)}>Anterior</button>
        <button className="community-secondary" disabled={!more} onClick={()=>setPage(page+1)}>Siguiente</button>
      </nav>}
    </section>
  </section>;
}
