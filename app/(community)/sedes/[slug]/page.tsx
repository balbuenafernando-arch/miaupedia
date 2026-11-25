import { BranchDetail } from "@/components/community/community-pages";
export default async function BranchPage({params}: {params:Promise<{slug:string}>}) {
  const {slug}=await params;
  return <BranchDetail slug={slug}/>;
}
