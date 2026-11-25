import { CommunityCompose } from "@/components/community/community-compose";

export default async function SharePage({searchParams}: {searchParams: Promise<{sede?:string}>}) {
  const {sede} = await searchParams;
  return <CommunityCompose slug={typeof sede === "string" ? sede : undefined}/>;
}
