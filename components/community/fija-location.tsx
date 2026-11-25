"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useRef,useState } from "react";
import { describePin, isPoint, lima, locate, searchPlaces, type FijaPin,type Point } from "@/lib/fija-geolocation";

const Map = dynamic(()=>import("./fija-map"),{ssr:false,loading:()=> <p role="status">Cargando mapa…</p>});
const emptyPin=(point:Point):FijaPin=>({...point,label:"",district:"",province:"",region:"",country:""});
export type LocationValue={pin:FijaPin|null;legacy:string|null;pending?:boolean};

export function PlaceSearch({select}: {select:(pin:FijaPin)=>void}) {
  const [query,setQuery]=useState("");
  const [results,setResults]=useState<FijaPin[]>();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const request=useRef<AbortController|null>(null);
  async function search() {
    request.current?.abort();
    const controller=new AbortController();
    request.current=controller;
    setError("");setResults(undefined);setBusy(true);
    try {setResults(await searchPlaces(query.trim(),controller.signal));}
    catch(error) {if(!controller.signal.aborted) setError(error instanceof Error?error.message:"No pudimos buscar.");}
    finally {if(!controller.signal.aborted) setBusy(false);}
  }
  return <>
    <label>Buscar lugar o dirección<input value={query} maxLength={120} onChange={event=>setQuery(event.target.value)}
      onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();if(query.trim().length>=3 && !busy) void search();}}}/></label>
    <button type="button" className="community-secondary" disabled={query.trim().length<3 || busy} onClick={()=>void search()}>
      {busy?"Buscando…":"Buscar lugar"}
    </button>
    {error && <p role="alert">{error}</p>}
    {results?.length===0 && <p role="status">No encontramos coincidencias. Puedes elegir el punto en el mapa.</p>}
    {!!results?.length && <ul className="community-location-results">{results.map(({lat,lon,label,...place})=><li key={`${lat}:${lon}:${label}`}>
      <button type="button" onClick={()=>{select({lat,lon,label,...place});setResults(undefined);}}>{label} {[place.district,place.region].filter(Boolean).join(" · ")}</button>
    </li>)}</ul>}
  </>;
}

export function PinPicker({initial,select,cancel,publicPin=true,mapped=false}:{
  initial:FijaPin|null;select:(pin:FijaPin)=>void;cancel:()=>void;publicPin?:boolean;mapped?:boolean;
}) {
  const [draft,setDraft]=useState(initial ?? emptyPin(lima));
  const [showMap,setShowMap]=useState(mapped);
  const [chosen,setChosen]=useState(Boolean(initial));
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  function pickPoint(point:Point) {setDraft(emptyPin(point));setChosen(true);setError("");}
  return <div className="community-form community-location-picker">
    <PlaceSearch select={place=>{setDraft(place);setChosen(true);setError("");}}/>
    <div className="community-actions">
      <button type="button" className="community-secondary" onClick={()=>setShowMap(!showMap)}>
        {showMap?"Ocultar mapa":"Elegir en el mapa"}
      </button>
      {publicPin && <button type="button" className="community-secondary" disabled={busy} onClick={async()=>{
        setBusy(true);setError("");
        try {pickPoint(await locate());}
        catch {setError("No pudimos usar tu ubicación. Busca un lugar o elige un punto en el mapa.");}
        finally {setBusy(false);}
      }}>Usar mi ubicación</button>}
    </div>
    {showMap && <>
      <Map point={draft} change={pickPoint}/>
      <p className="community-meta">Toca el mapa o arrastra el pin para moverlo.</p>
    </>}
    {chosen && <div className="community-form">
      <label>Distrito<input value={draft.district} maxLength={80} onChange={event=>setDraft({...draft,district:event.target.value})}/></label>
      {publicPin && !draft.label && <p>Si la búsqueda no identifica el lugar, el distrito sirve como referencia.</p>}
    </div>}
    {error && <p className="community-error" role="alert">{error}</p>}
    {publicPin && <p className="community-meta">El pin confirmado será público. Evita señalar tu domicilio.</p>}
    <div className="community-actions">
      <button type="button" className="community-primary" disabled={!chosen || busy || !isPoint(draft)} onClick={async()=>{
        setBusy(true);setError("");
        try {
          let found:FijaPin|null=null;
          if(publicPin && !draft.label) {
            try {found=await describePin(draft);} catch {}
          }
          select({...draft, label:draft.label || found?.label || draft.district.trim() || "Punto en el mapa",
            district:draft.district.trim() || found?.district || "",province:draft.province || found?.province || "",
            region:draft.region || found?.region || "",country:draft.country || found?.country || ""});
        } finally {setBusy(false);}
      }}>{busy?"Confirmando…":"Confirmar ubicación"}</button>
      <button type="button" className="community-link-button" disabled={busy} onClick={cancel}>Cancelar</button>
    </div>
  </div>;
}

export function LocationField({value,onChange}: {value:LocationValue;onChange:(value:LocationValue)=>void}) {
  const [editing,setEditing]=useState(false);
  const enabled=editing || !!(value.pin || value.legacy);
  function remove(){setEditing(false);onChange({pin:null,legacy:null});}
  return <fieldset className="community-location">
    <label className="community-location-toggle">
      <MapPin size={18} aria-hidden="true"/> Añadir ubicación (opcional)
      <input type="checkbox" checked={enabled} onChange={event=>{
        if(event.target.checked){setEditing(true);onChange({...value,pending:true});}
        else remove();
      }}/>
    </label>
    {editing ? <PinPicker initial={value.pin} select={pin=>{setEditing(false);onChange({pin,legacy:null});}}
      cancel={()=>{setEditing(false);onChange({...value,pending:false});}}/>
      : enabled && <div className="community-location-summary">
        <strong>{value.pin ? [value.pin.label,value.pin.district,value.pin.region].filter(Boolean).join(" · ") : value.legacy}</strong>
        <button type="button" className="community-link-button" onClick={()=>{setEditing(true);onChange({...value,pending:true});}}>Cambiar</button>
        <button type="button" className="community-link-button" onClick={remove}>Quitar ubicación</button>
      </div>}
  </fieldset>;
}

export function PublicPin({pin,legacy}: {pin:FijaPin|null;legacy:string|null}) {
  const [show,setShow]=useState(false);
  if(!pin && !legacy) return null;
  const coords=pin?`${pin.lat},${pin.lon}`:"";
  return <section className="community-location community-public-pin" aria-label="Ubicación">
    <p><MapPin size={17} aria-hidden="true"/> <strong>Ubicación:</strong> {pin?[pin.district,pin.region].filter(Boolean).join(", ")||pin.label:legacy}</p>
    {pin && <>
      <button type="button" className="community-secondary" aria-expanded={show} onClick={()=>setShow(!show)}>
        {show?"Cerrar mapa":"Ver ubicación en el mapa"}
      </button>
      {show && <>
        <Map point={pin}/>
        <div className="community-actions">
          <a className="community-secondary" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`}>Google Maps</a>
          <a className="community-secondary" target="_blank" rel="noopener noreferrer" href={`https://waze.com/ul?ll=${encodeURIComponent(coords)}&navigate=yes`}>Waze</a>
        </div>
      </>}
    </>}
  </section>;
}
