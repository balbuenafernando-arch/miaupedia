import { CommunityFeed } from "@/components/community/community-feed";

export default async function Home({searchParams}: {searchParams:Promise<{q?:string}>}) {
  const {q} = await searchParams;
  return <CommunityFeed initialQuery={typeof q === "string" ? q.slice(0,120) : ""} />;
}
