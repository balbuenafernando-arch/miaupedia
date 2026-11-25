import { notFound } from "next/navigation";
import { PublicAuthorProfile } from "@/components/community/community-author";

export default async function AuthorPage({params}: {params:Promise<{slug:string}>}) {
  const {slug}=await params;
  if (!/^[a-f0-9]{64}$/.test(slug)) notFound();
  return <PublicAuthorProfile slug={slug}/>;
}
