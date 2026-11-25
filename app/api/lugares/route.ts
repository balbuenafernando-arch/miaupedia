import type { FijaPin } from "@/lib/fija-geolocation";
import { isPoint } from "@/lib/fija-geolocation";

type PhotonFeature={geometry?:{coordinates?:number[]};properties?:Record<string,unknown>};

export async function POST(request:Request) {
  let payload:{query?:unknown;point?:{lat:number;lon:number}}|null;
  try {payload=await request.json();} catch {return Response.json([],{status:400});}
  const query=typeof payload?.query==="string" ? payload.query.trim() : "";
  const point=payload?.point;
  const reverse=!!point && isPoint(point);
  if (!reverse && (query.length<3 || query.length>120)) return Response.json([],{status:400});
  const url=new URL(reverse?"/reverse":"/api",process.env.PHOTON_ORIGIN || "https://photon.komoot.io");
  url.searchParams.set("limit",reverse?"1":"6");
  if(reverse && point) {
    url.searchParams.set("lat",String(point.lat));url.searchParams.set("lon",String(point.lon));
  } else {
    url.searchParams.set("q",query);
    url.searchParams.set("bbox","-81.4,-18.5,-68.6,0.1");
  }
  try {
    const response=await fetch(url,{signal:AbortSignal.timeout(4500),next:{revalidate:86400},
      headers:{"User-Agent":"MIAUPEDIA (+https://miaupedia.vercel.app)"}});
    if(!response.ok) return Response.json([],{status:503});
    const {features=[]}:{features?:PhotonFeature[]}=await response.json();
    return Response.json(features.flatMap((feature):FijaPin[]=>{
      const [lon,lat]=feature.geometry?.coordinates ?? [];
      if(!isPoint({lat,lon})) return [];
      const prop=(name:string,length=80)=>{
        const value=feature.properties?.[name];return typeof value==="string"?value.trim().slice(0,length):"";
      };
      const district=prop("district")||prop("locality")||prop("city");
      const address=[prop("street"),prop("housenumber")].filter(Boolean).join(" ");
      const label=(prop("name",120)||address||district||prop("county")||"Punto seleccionado").slice(0,120);
      return [{lat,lon,label,district,province:prop("county")||prop("city"),region:prop("state"),country:prop("country")}];
    }));
  } catch {return Response.json([],{status:503});}
}
