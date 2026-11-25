"use client";

import Link from "next/link";
import Image from "next/image";
import { CommunityShare } from "./community-share";
import { NearbyFilter } from "./nearby-filter";
import type { Point,Radius } from "@/lib/fija-geolocation";
import { AuthorLink, PostPhoto } from "./community-post-meta";
import { MapPin, PawPrint, Search, Star, ThumbsUp } from "lucide-react";
import { useCallback,useState } from "react";
import { searchCommunity, searchNearby, type DirectoryItem, type Sort } from "@/lib/community";
import { useCatalogResource } from "@/components/recommendations/use-catalog-resource";
import { formatDate, formatPrice } from "./community-format";

export function CommunityFeed({initialQuery=""}: {initialQuery?:string}) {
  const [input,setInput] = useState(initialQuery);
  const [query,setQuery] = useState(initialQuery);
  const [sort,setSort] = useState<Sort>("relevantes");
  const [page,setPage] = useState(0);
  const [nearby,setNearby]=useState(false);
  const [point,setPoint]=useState<Point|null>(null);
  const [radius,setRadius]=useState<Radius>(5);
  const load = useCallback((signal:AbortSignal) => nearby
    ? point ? searchNearby(query,point,radius,page,signal) : Promise.resolve({items:[],more:false})
    : searchCommunity(query,sort,page,signal),[query,sort,page,nearby,point,radius]);
  const {resource,refresh} = useCatalogResource(load);

  return <>
    <section className="community-intro">
      <div className="community-banner-copy">
        <div><h1>¿Qué fija estás buscando?</h1>
        <p>Encuentra precios, lugares y experiencias de personas que también cuidan gatos.</p></div>
        <Image src="/icons/gato-banner.png" alt="" width={234} height={213} priority unoptimized/>
      </div>
      <form className="community-search" role="search" onSubmit={event => {
        event.preventDefault();
        setQuery(input.trim()); setPage(0);
      }}>
        <label className="community-search-field">
          <Search size={20} aria-hidden="true"/>
          <input type="search" aria-label="Buscar en la comunidad" placeholder="Arena barata, Magdalena…" maxLength={120}
            value={input} onChange={event=>setInput(event.target.value)} />
        </label>
        <button className="community-primary">Buscar</button>
      </form>
    </section>
    <div className="community-results-bar">
      <h2>{query ? `Resultados para “${query}”` : "De la comunidad"}</h2>
      {!nearby && <select aria-label="Ordenar resultados" value={sort} onChange={event=>{
        const value=event.target.value;
        if (value==="relevantes" || value==="recientes" || value==="utiles") setSort(value);
        setPage(0);
      }}>
        <option value="relevantes">Más relevantes</option><option value="recientes">Más recientes</option><option value="utiles">Más útiles</option>
      </select>}
    </div>
    <NearbyFilter enabled={nearby} onEnabled={value=>{setNearby(value);setPage(0);}} point={point}
      setPoint={value=>{setPoint(value);setPage(0);}} radius={radius} setRadius={value=>{setRadius(value);setPage(0);}}/>
    {resource.status==="loading" && <p role="status">Buscando fijas…</p>}
    {resource.status==="error" && <button className="community-secondary" onClick={refresh}>Reintentar búsqueda</button>}
    {resource.status==="ready" && (!nearby || point) && <>
      {resource.data.items.length ? <ul className="community-list">
        {resource.data.items.map(item=><li key={`${item.kind}-${item.id}`}><DirectoryCard item={item}/></li>)}
      </ul> : <div className="community-empty">
        <PawPrint aria-hidden="true" size={25}/>
        <p>{nearby ? "No encontramos fijas en este radio." : query ? "No encontramos coincidencias." : "Aún no hay fijas publicadas."}</p>
        {nearby ? null : query ? <button className="community-link-button" onClick={()=>{setInput("");setQuery("");setPage(0);}}>Limpiar búsqueda</button>
          : <Link className="community-primary" href="/pasar-la-voz">Compartir la primera fija</Link>}
      </div>}
      {(page>0 || resource.data.more) && <nav className="community-actions" aria-label="Paginación de resultados">
        <button className="community-secondary" disabled={!page} onClick={()=>setPage(page-1)}>Anterior</button>
        <button className="community-secondary" disabled={!resource.data.more} onClick={()=>setPage(page+1)}>Siguiente</button>
      </nav>}
    </>}
  </>;
}

export function DirectoryCard({item}: {item:DirectoryItem}) {
  const business = item.kind==="business";
  return <article className="community-card">
    <div className="community-meta">
      {business && <span className="community-tag">{item.business_type==="Pet Shop" ? "Tienda" : "Veterinaria"}</span>}
      {!business && item.autor && <AuthorLink alias={item.autor} slug={item.author_slug}/>}
      {item.created_at && <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>}
    </div>
    <div className="community-card-copy"><div><h3><Link href={business ? `/sedes/${item.slug}` : `/fijas/${item.id}`}>{item.title}</Link></h3>
    <p className="community-card-body">{item.body}</p></div>
      {!business && <PostPhoto source={item.image_url}/>}
    </div>
    <div className="community-meta">
      {typeof item.distance_km==="number" && <span>{item.distance_km<1 ? `${Math.round(item.distance_km*1000)} m` : `${item.distance_km.toLocaleString("es-PE",{maximumFractionDigits:1})} km`}</span>}
      {item.location && <span><MapPin size={15} aria-hidden="true"/>{item.location}</span>}
      {item.price !== null && <span>{formatPrice(item.price)}</span>}
      {business ? <span><Star size={15} aria-hidden="true"/>{item.average_rating ?? "Sin valoración"} · {item.experience_count} experiencias</span>
        : <span><ThumbsUp size={15} aria-hidden="true"/>{item.utiles} útiles</span>}
    </div>
    {!business && <CommunityShare path={`/fijas/${item.id}`} title={item.title}/>}
  </article>;
}
