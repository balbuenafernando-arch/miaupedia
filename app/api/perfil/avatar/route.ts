import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { googleAvatarSources } from "@/lib/google-avatar";

const headers = {"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};

export async function GET() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response(null,{status:404,headers});
  const jar=await cookies();
  const client=createServerClient(url,key,{cookies:{getAll:()=>jar.getAll(),setAll(items: {name:string;value:string;options:CookieOptions}[]){
    items.forEach(({name,value,options})=>jar.set(name,value,options));
  }}});
  const {data:{user}}=await client.auth.getUser();
  if (!user || user.is_anonymous) return new Response(null,{status:404,headers});
  for (const source of googleAvatarSources(user)) {
    try {
      const upstream=await fetch(source,{redirect:"error",cache:"no-store",signal:AbortSignal.timeout(2200)});
      const type=upstream.headers.get("content-type")?.split(";")[0];
      if (!upstream.ok || !type || !["image/jpeg","image/png","image/webp","image/gif"].includes(type)) continue;
      const reader=upstream.body?.getReader();
      if (!reader) continue;
      const chunks:BlobPart[]=[];
      let bytes=0;
      for (;;) {
        const {done,value}=await reader.read();
        if (done) break;
        bytes+=value.byteLength;
        if (bytes>512*1024) { await reader.cancel(); break; }
        chunks.push(new Uint8Array(value));
      }
      if (!bytes || bytes>512*1024) continue;
      return new Response(new Blob(chunks,{type}),{headers});
    } catch {}
  }
  return new Response(null,{status:404,headers});
}
