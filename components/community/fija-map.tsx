"use client";

import { useEffect,useRef } from "react";
import L from "leaflet";
import type { Point } from "@/lib/fija-geolocation";

export default function FijaMap({point,change}: {point:Point;change?:(point:Point)=>void}) {
  const container=useRef<HTMLDivElement>(null);
  const marker=useRef<L.Marker|null>(null);
  const instance=useRef<L.Map|null>(null);
  const latest=useRef(change);
  const initial=useRef(point);
  useEffect(()=>{latest.current=change;},[change]);
  useEffect(()=>{
    if(!container.current) return;
    const center=initial.current;
    const map=L.map(container.current,{scrollWheelZoom:false}).setView([center.lat,center.lon],14);
    instance.current=map;
    L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILES || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom:19,
    }).addTo(map);
    const pin=L.marker([center.lat,center.lon],{draggable:!!latest.current,alt:"Pin de ubicación",
      icon:L.divIcon({className:"community-map-pin",iconSize:[20,20],iconAnchor:[10,20]})}).addTo(map);
    marker.current=pin;
    if(latest.current) {
      map.on("click",event=>latest.current?.({lat:event.latlng.lat,lon:event.latlng.wrap().lng}));
      pin.on("dragend",()=>{const next=pin.getLatLng().wrap();latest.current?.({lat:next.lat,lon:next.lng});});
    }
    return ()=>{map.remove();instance.current=null;marker.current=null;};
  },[]);
  useEffect(()=>{
    marker.current?.setLatLng([point.lat,point.lon]);
    if(instance.current && !instance.current.getBounds().contains([point.lat,point.lon])) {
      instance.current.panTo([point.lat,point.lon],{animate:false});
    }
  },[point.lat,point.lon]);
  return <>
    <div className="community-map" ref={container} aria-label="Mapa de ubicación"/>
    {change && <button type="button" className="community-link-button" onClick={()=>{
      const center=instance.current?.getCenter().wrap();
      if(center) change({lat:center.lat,lon:center.lng});
    }}>Usar el centro del mapa</button>}
  </>;
}
