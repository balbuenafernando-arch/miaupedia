"use client";

import { useRef,useState } from "react";
import { locate,radii,type Point,type Radius } from "@/lib/fija-geolocation";
import { PinPicker } from "./fija-location";

export function NearbyFilter({enabled,onEnabled,point,setPoint,radius,setRadius}: {
  enabled:boolean;onEnabled:(value:boolean)=>void;point:Point|null;setPoint:(value:Point)=>void;
  radius:Radius;setRadius:(value:Radius)=>void;
}) {
  const [manual,setManual]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const attempt=useRef(0);
  async function requestLocation() {
    const current=++attempt.current;
    setBusy(true);setMessage("");
    try {
      const value=await locate();
      if(attempt.current===current) {setPoint(value);setManual(false);}
    } catch {
      if(attempt.current===current) {setMessage("No pudimos acceder al GPS. Elige una zona o un punto de referencia.");setManual(true);}
    } finally {if(attempt.current===current) setBusy(false);}
  }
  return <fieldset className="community-location community-nearby">
    <label><input type="checkbox" checked={enabled} onChange={event=>{
      const next=event.target.checked;
      onEnabled(next);
      if(next && !point) void requestLocation();
      if(!next) {++attempt.current;setBusy(false);setManual(false);setMessage("");}
    }}/> Cerca de mí</label>
    {enabled && <>
      <label>Radio<select value={radius} onChange={event=>{
        const selected=radii.find(value=>value===Number(event.target.value));
        if(selected) setRadius(selected);
      }}>{radii.map(value=><option key={value} value={value}>{value} km</option>)}</select></label>
      <button type="button" className="community-link-button" onClick={()=>{++attempt.current;setBusy(false);setManual(!manual);}}>
        {manual?"Cerrar selección":"Elegir zona manualmente"}
      </button>
      {busy && <p role="status">Buscando tu ubicación…</p>}
      {message && <p role="status">{message}</p>}
      {manual && <PinPicker initial={null} publicPin={false}
        select={candidate=>{setPoint({lat:candidate.lat,lon:candidate.lon});setManual(false);setMessage("");}}
        cancel={()=>setManual(false)}/>}
    </>}
  </fieldset>;
}
