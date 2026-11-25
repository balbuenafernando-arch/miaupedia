import Image from "next/image";
import Link from "next/link";

export function AuthorLink({alias,slug}: {alias:string;slug?:string|null}) {
  return slug ? <Link className="community-author-link" href={`/autores/${slug}`}>{alias}</Link> : <span>{alias}</span>;
}

export function PostPhoto({source}: {source?:string|null}) {
  if (!source?.startsWith("https://rwgrntazljuyznzzvfgf.supabase.co/storage/v1/object/public/community-photos/")) return null;
  return <Image className="community-post-photo" src={source} alt="Imagen de la publicación" width={180} height={150}
    referrerPolicy="no-referrer" unoptimized/>;
}
