import { CommunityShell } from "@/components/community/community-shell";
import "./community.css";

export default function CommunityLayout({children}: {children: React.ReactNode}) {
  return <CommunityShell>{children}</CommunityShell>;
}
