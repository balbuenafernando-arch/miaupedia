import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { shareMetadata } from "@/lib/share-metadata";
import { notFound } from "next/navigation";
import { FijaDetail } from "@/components/community/fija-detail";

const validId=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function generateMetadata({params}: {params:Promise<{id:string}>}):Promise<Metadata> {
  const {id}=await params;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!validId.test(id) || !url || !key) return {title:"MIAUPEDIA",robots:{index:false}};
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data}=await client.from("public_community_posts").select("title,body,image_url").eq("id",id)
    .maybeSingle<{title:string;body:string;image_url:string|null}>();
  if (!data) return {title:"Fija no disponible · MIAUPEDIA",robots:{index:false},
    openGraph:null,twitter:null,alternates:null,description:null};
  const plain=data.body.replace(/\s+/g," ").trim();
  const image=data.image_url?.startsWith(
    "https://rwgrntazljuyznzzvfgf.supabase.co/storage/v1/object/public/community-photos/"
  ) ? data.image_url : undefined;
  return shareMetadata(`/fijas/${id}`,data.title,plain.length>175 ? `${plain.slice(0,174)}…` : plain,image);
}

export default async function FijaPage({params}: {params:Promise<{id:string}>}) {
  const {id}=await params;
  if (!validId.test(id)) notFound();
  return <FijaDetail id={id}/>;
}
