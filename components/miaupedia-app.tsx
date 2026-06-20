"use client";

import { useMemo, useState } from "react";
import { Bell, Bookmark, CalendarDays, Cat, ChevronDown, ChevronRight, CircleUserRound, Clock3, Heart, Home, MapPin, Menu, MessageCircle, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Store, X } from "lucide-react";
import { places, reviews, type Place } from "@/lib/data";

type Tab = "Inicio" | "Explorar" | "Mi gato" | "Agenda";

function Logo() {
  return <div className="logo"><span className="logo-mark"><Cat size={20} strokeWidth={2.4}/></span><span>Miau<span>pedia</span></span></div>;
}

function Stars({ rating }: { rating: number }) {
  return <span className="stars"><Star size={15} fill="currentColor"/> <b>{rating.toFixed(1)}</b></span>;
}

function PlaceCard({ place, saved, onSave, onOpen }: { place: Place; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return <article className="place-card" onClick={onOpen}>
    <div className="place-image" style={{backgroundImage:`url(${place.image})`}}>
      {place.sponsored && <span className="sponsored">Patrocinado</span>}
      <button className={`save ${saved ? "active" : ""}`} onClick={e => { e.stopPropagation(); onSave(); }} aria-label="Guardar"><Heart size={18} fill={saved ? "currentColor" : "none"}/></button>
    </div>
    <div className="place-copy">
      <div className="place-meta"><span>{place.category}</span><Stars rating={place.rating}/></div>
      <h3>{place.name}</h3>
      <p><MapPin size={14}/> {place.district} <i>·</i> {place.reviews} reseñas</p>
      <div className="tags">{place.tags.map(t => <span key={t}>{t}</span>)}</div>
      <div className="price-row"><strong>{place.price}</strong>{place.open && <span className="open">Abierto ahora</span>}</div>
    </div>
  </article>;
}

export function MiaupediaApp() {
  const [tab, setTab] = useState<Tab>("Inicio");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [saved, setSaved] = useState<number[]>([1]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [compare, setCompare] = useState<number[]>([4, 6]);
  const [showFilters, setShowFilters] = useState(false);
  const [notice, setNotice] = useState("");

  const results = useMemo(() => places.filter(p => (category === "Todos" || p.category === category) && `${p.name} ${p.category} ${p.district}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const flash = (message: string) => { setNotice(message); setTimeout(() => setNotice(""), 2600); };
  const toggleSaved = (id: number) => { setSaved(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]); flash(saved.includes(id) ? "Eliminado de favoritos" : "Guardado en Favoritos"); };

  const navigate = (next: Tab) => { setTab(next); window.scrollTo({top:0, behavior:"smooth"}); };

  return <div className="app-shell">
    <header className="topbar">
      <Logo/>
      <nav className="desktop-nav">
        {(["Inicio","Explorar","Mi gato","Agenda"] as Tab[]).map(item => <button key={item} className={tab===item?"active":""} onClick={()=>navigate(item)}>{item}</button>)}
      </nav>
      <div className="header-actions"><button className="icon-button" aria-label="Notificaciones"><Bell size={20}/><span className="dot"/></button><button className="profile-pill"><span>AP</span><b>Andrea</b><ChevronDown size={15}/></button><button className="mobile-menu"><Menu/></button></div>
    </header>

    <main>
      {tab === "Inicio" && <>
        <section className="hero">
          <div className="hero-copy"><span className="eyebrow"><Sparkles size={15}/> La comunidad felina del Perú</span><h1>Mejores decisiones<br/>para <em>tu gato.</em></h1><p>Descubre productos, servicios y veterinarias recomendadas por personas con gatos como el tuyo.</p>
            <div className="search-box"><Search size={21}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&navigate("Explorar")} placeholder="¿Qué estás buscando para tu gato?"/><button onClick={()=>navigate("Explorar")}>Buscar</button></div>
            <div className="popular"><span>Popular:</span>{["Veterinarias", "Arena", "Alimento", "Hoteles felinos"].map(x=><button key={x} onClick={()=>{setQuery(x);navigate("Explorar")}}>{x}</button>)}</div>
          </div>
          <div className="hero-visual">
            <div className="cat-photo"/>
            <div className="floating-card score"><span><ShieldCheck/></span><div><b>4.9 de 5</b><small>Opiniones verificadas</small></div></div>
            <div className="floating-card people"><div className="faces"><i>AM</i><i>JR</i><i>LC</i></div><div><b>+12 mil</b><small>cat lovers en Perú</small></div></div>
          </div>
        </section>

        <section className="quick-section content-width"><div className="section-heading"><div><span className="kicker">EXPLORA MIAUPEDIA</span><h2>Todo lo que tu gato necesita</h2></div><button onClick={()=>navigate("Explorar")}>Ver todo <ChevronRight size={17}/></button></div>
          <div className="category-grid">{[
            ["Veterinarias","Especialistas cerca de ti","🏥","lilac"],["Pet Shops","Todo para consentirlo","🛍️","mint"],["Productos","Probados por la comunidad","📦","peach"],["Hoteles felinos","Un segundo hogar","🏡","blue"],["Cuidadores","Personas de confianza","🤝","yellow"]
          ].map(([a,b,c,d])=><button className="category-card" key={a} onClick={()=>{setCategory(a==="Productos"?"Producto":a==="Veterinarias"?"Veterinaria":a==="Hoteles felinos"?"Hotel felino":a==="Cuidadores"?"Cuidador":a);navigate("Explorar")}}><span className={d}>{c}</span><div><b>{a}</b><small>{b}</small></div><ChevronRight size={18}/></button>)}</div>
        </section>

        <section className="recommend-section"><div className="content-width"><div className="section-heading"><div><span className="kicker">RECOMENDADOS PARA TI</span><h2>Los favoritos de la comunidad</h2></div><button onClick={()=>navigate("Explorar")}>Explorar todos <ChevronRight size={17}/></button></div><div className="card-grid">{places.slice(0,3).map(p=><PlaceCard key={p.id} place={p} saved={saved.includes(p.id)} onSave={()=>toggleSaved(p.id)} onOpen={()=>setSelected(p)}/>)}</div></div></section>

        <section className="trust-band"><div className="content-width"><div><span className="trust-icon"><ShieldCheck/></span><div><h2>Experiencias reales.<br/>Decisiones con confianza.</h2><p>Cada opinión viene de personas reales. Nuestro sistema de confianza destaca las voces más útiles de la comunidad.</p></div></div><div className="trust-stats"><span><b>12K+</b><small>Miembros</small></span><span><b>8.5K</b><small>Reseñas</small></span><span><b>1.2K</b><small>Lugares y productos</small></span></div></div></section>
      </>}

      {tab === "Explorar" && <section className="page content-width">
        <div className="page-title"><span className="kicker">DIRECTORIO FELINO</span><h1>Encuentra lo mejor para tu gato</h1><p>Opiniones reales de la comunidad, sin recomendaciones médicas.</p></div>
        <div className="explore-search"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca veterinarias, productos o servicios"/><button onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={18}/> Filtros</button></div>
        {showFilters && <div className="filter-panel"><label>Distrito<select><option>Todos los distritos</option><option>Miraflores</option><option>Surco</option><option>San Borja</option></select></label><label>Calificación<select><option>Cualquiera</option><option>4.5 o más</option><option>4.0 o más</option></select></label><label>Precio<select><option>Cualquier precio</option><option>S/</option><option>S/ S/</option></select></label></div>}
        <div className="chips">{["Todos","Veterinaria","Pet Shop","Producto","Hotel felino","Cuidador"].map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="result-line"><b>{results.length} resultados</b><span>Ordenar: Mejor valorados <ChevronDown size={15}/></span></div>
        <div className="card-grid explore-grid">{results.map(p=><PlaceCard key={p.id} place={p} saved={saved.includes(p.id)} onSave={()=>toggleSaved(p.id)} onOpen={()=>setSelected(p)}/>)}</div>
        {!results.length && <div className="empty"><Search/><h3>No encontramos coincidencias</h3><p>Prueba con otra palabra o quita algún filtro.</p><button onClick={()=>{setQuery("");setCategory("Todos")}}>Limpiar búsqueda</button></div>}
        {category === "Producto" && compare.length > 0 && <div className="compare-bar"><div><b>{compare.length} productos seleccionados</b><small>Compáralos lado a lado</small></div><div className="mini-products">{compare.map(id=><span key={id} style={{backgroundImage:`url(${places.find(p=>p.id===id)?.image})`}}><button onClick={()=>setCompare(compare.filter(x=>x!==id))}><X size={12}/></button></span>)}</div><button onClick={()=>flash("Comparador preparado con precio, valoración y tiendas")}>Comparar ahora</button></div>}
      </section>}

      {tab === "Mi gato" && <section className="page content-width profile-page">
        <div className="page-title row-title"><div><span className="kicker">MI FAMILIA FELINA</span><h1>Mis gatos</h1><p>Sus perfiles ayudan a personalizar tus recomendaciones.</p></div><button className="primary" onClick={()=>flash("Formulario para añadir un nuevo gato") }><Plus size={18}/> Añadir gato</button></div>
        <div className="cat-profile">
          <div className="cat-avatar"/><div className="cat-info"><div><span>Mi perfil principal</span><h2>Luna</h2><p>Europeo de pelo corto · Hembra · 3 años</p></div><button>Editar perfil</button><div className="cat-stats"><span><b>4.2 kg</b><small>Peso</small></span><span><b>Sí</b><small>Esterilizada</small></span><span><b>18</b><small>Recomendaciones</small></span></div></div>
        </div>
        <div className="profile-columns"><div className="panel"><div className="panel-head"><h3>Sus favoritos</h3><button>Editar</button></div>{[["🍗","Alimento","Salmón y pollo"],["✨","Arena","Aglutinante sin aroma"],["🧶","Juguete","Varitas y pelotas"]].map(x=><div className="preference" key={x[1]}><span>{x[0]}</span><div><small>{x[1]}</small><b>{x[2]}</b></div><ChevronRight/></div>)}</div><div className="panel"><div className="panel-head"><h3>Recomendado para Luna</h3><button onClick={()=>navigate("Explorar")}>Ver todo</button></div><p className="panel-intro">Basado en gatos de edad y perfil similares.</p>{places.slice(3,5).map(p=><button className="mini-place" key={p.id} onClick={()=>setSelected(p)}><span style={{backgroundImage:`url(${p.image})`}}/><div><small>{p.category}</small><b>{p.name}</b><Stars rating={p.rating}/></div><ChevronRight/></button>)}</div></div>
      </section>}

      {tab === "Agenda" && <section className="page content-width agenda-page">
        <div className="page-title row-title"><div><span className="kicker">CUIDADOS AL DÍA</span><h1>Agenda de Luna</h1><p>Recordatorios sencillos para que nada se te pase.</p></div><button className="primary" onClick={()=>flash("Nuevo recordatorio listo para configurar")}><Plus size={18}/> Nuevo recordatorio</button></div>
        <div className="agenda-layout"><div className="agenda-main"><div className="next-event"><div className="calendar-badge"><b>24</b><small>JUN</small></div><div><span>PRÓXIMO RECORDATORIO</span><h2>Desparasitación</h2><p><Clock3 size={15}/> En 5 días · Luna</p></div><button>Marcar como listo</button></div><h3>Próximos</h3>{[["12","AGO","Vacuna anual","Luna · En 54 días","violet"],["03","NOV","Cumpleaños de Luna","¡Cumple 4 años!","peach"]].map(e=><div className="event" key={e[2]}><div className={`date ${e[4]}`}><b>{e[0]}</b><small>{e[1]}</small></div><div><b>{e[2]}</b><span>{e[3]}</span></div><button>•••</button></div>)}</div><aside className="panel calendar-panel"><div className="panel-head"><h3>Junio 2026</h3><span>‹ &nbsp; ›</span></div><div className="calendar"><small>L</small><small>M</small><small>M</small><small>J</small><small>V</small><small>S</small><small>D</small>{Array.from({length:30},(_,i)=><span className={i+1===19?"today":i+1===24?"marked":""} key={i}>{i+1}</span>)}</div><div className="legend"><span><i/> Hoy</span><span><i/> Recordatorio</span></div></aside></div>
        <div className="disclaimer"><ShieldCheck/><p><b>Una agenda para organizarte, no para diagnosticar.</b><br/>Los recordatorios no reemplazan las indicaciones de un profesional veterinario.</p></div>
      </section>}
    </main>

    <footer><div className="content-width"><Logo/><p>Miaupedia es una plataforma de información y experiencias compartidas por la comunidad. No reemplaza la atención veterinaria profesional ni proporciona diagnósticos, tratamientos o recomendaciones médicas.</p><span>Hecho con cariño para los gatos del Perú 🇵🇪</span></div></footer>

    <nav className="bottom-nav">{[["Inicio",Home],["Explorar",Search],["Mi gato",Cat],["Agenda",CalendarDays]] .map(([name,Icon])=>{const I=Icon as typeof Home; return <button key={name as string} className={tab===name?"active":""} onClick={()=>navigate(name as Tab)}><I size={21}/><span>{name as string}</span></button>})}<button onClick={()=>flash("Tienes 3 notificaciones nuevas")}><Bell size={21}/><span>Alertas</span><i/></button></nav>

    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="detail-modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button><div className="detail-photo" style={{backgroundImage:`url(${selected.image})`}}/><div className="detail-body"><span className="kicker">{selected.category} · {selected.district}</span><h2>{selected.name}</h2><div className="detail-rating"><Stars rating={selected.rating}/><span>{selected.reviews} reseñas</span><span className="open">Abierto ahora</span></div><p>Una de las opciones mejor valoradas por la comunidad felina. Información verificada y experiencias compartidas por dueños de gatos.</p><div className="tags">{selected.tags.map(t=><span key={t}>{t}</span>)}</div><div className="detail-actions"><button className="primary" onClick={()=>toggleSaved(selected.id)}><Bookmark size={17}/> {saved.includes(selected.id)?"Guardado":"Seguir"}</button><button><MessageCircle size={17}/> Contactar</button></div><hr/><h3>Lo que dice la comunidad</h3>{reviews.map(r=><div className="review" key={r.user}><span className="review-avatar">{r.avatar}</span><div><div className="review-head"><b>{r.user}</b><Stars rating={r.rating}/></div><small>{r.cat} · Nivel {r.level}</small><p>{r.text}</p><span>{r.date} · 👍 Útil ({r.helpful})</span></div></div>)}</div></div></div>}
    {notice && <div className="toast"><ShieldCheck size={18}/>{notice}</div>}
  </div>;
}
