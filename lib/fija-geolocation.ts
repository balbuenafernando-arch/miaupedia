import { createClient } from "@/lib/supabase";

export type Point={lat:number;lon:number};
export type FijaPin=Point & {label:string;district:string;province:string;region:string;country:string};
export type Radius=1|5|10|25;
export const lima:Point={lat:-12.0464,lon:-77.0428};
export const radii:Radius[]=[1,5,10,25];
export function isPoint(point:Point) {
  return Number.isFinite(point.lat) && Number.isFinite(point.lon) && Math.abs(point.lat)<=90 && Math.abs(point.lon)<=180;
}
export function geoClient() {
  const client=createClient();
  if(!client) throw new Error("La ubicación aún no está disponible.");
  return client;
}
export async function readPin(id:string,signal:AbortSignal) {
  const {data,error}=await geoClient().from("fija_locations").select("lat,lon,label,district,province,region,country")
    .eq("fija_id",id).abortSignal(signal).maybeSingle<FijaPin>();
  if(error) throw new Error("No pudimos cargar la ubicación.");
  return data;
}
export async function canEditPin(id:string,signal:AbortSignal) {
  const {data,error}=await geoClient().rpc("owns_fija",{target:id}).abortSignal(signal);
  if(error) throw new Error("No pudimos comprobar los permisos.");
  return data===true;
}
export async function savePin(id:string,pin:FijaPin|null,legacy:string|null) {
  const {error}=await geoClient().rpc("save_fija_location",{target:id,pin,text_location:legacy});
  if(error) throw new Error("No pudimos guardar la ubicación.");
}
export function locate():Promise<Point> {
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation) {reject(new Error("Ubicación no disponible."));return;}
    navigator.geolocation.getCurrentPosition(({coords})=>resolve({lat:coords.latitude,lon:coords.longitude}),reject,
      {timeout:10000,maximumAge:120000});
  });
}
export async function searchPlaces(query:string,signal:AbortSignal):Promise<FijaPin[]> {
  const response=await fetch("/api/lugares",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query}),signal});
  if(!response.ok) throw new Error("La búsqueda de lugares no está disponible. Puedes elegir en el mapa.");
  return response.json();
}
export async function describePin(point:Point):Promise<FijaPin|null> {
  // Reverse lookup uses a coarse point and only for a publisher's selected pin.
  const response=await fetch("/api/lugares",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({point:{lat:Number(point.lat.toFixed(3)),lon:Number(point.lon.toFixed(3))}})});
  if(!response.ok) return null;
  const results:FijaPin[]=await response.json();
  return results[0] ?? null;
}
