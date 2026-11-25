import { CommunityShell } from "@/components/community/community-shell";
import "leaflet/dist/leaflet.css";
import "./community.css";

export default function CommunityLayout({children}: {children: React.ReactNode}) {
  return <CommunityShell>{children}</CommunityShell>;
}
