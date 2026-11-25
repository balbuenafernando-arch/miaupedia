import type { Metadata } from "next";

export const canonicalOrigin = "https://miaupedia.vercel.app";
const defaultDescription="Descubre y comparte recomendaciones para cuidar mejor a tus gatos.";
const brandImage="/icons/miaupedia-compartir.png";

export function shareMetadata(path:string,title="MIAUPEDIA",description=defaultDescription,image=brandImage):Metadata {
  return {
    title,description,
    alternates:{canonical:path},
    openGraph:{type:"website",locale:"es_PE",siteName:"MIAUPEDIA",title,description,url:path,
      images:[{url:image,alt:image===brandImage?"MIAUPEDIA":title}]},
    twitter:{card:"summary_large_image",title,description,images:[image]},
  };
}
