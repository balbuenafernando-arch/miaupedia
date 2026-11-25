import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";
import "./functional.css";
import "./refinement.css";
import "./testing-fixes.css";
import "./dashboard.css";
import "./profile-completion.css";

export const metadata: Metadata = {
  title: "Miaupedia — Mejores decisiones para tu gato",
  description: "Descubre y comparte recomendaciones para cuidar mejor a tus gatos.",
  icons: { icon: { url: "/icons/miaupedia-favicon.png", sizes: "32x32", type: "image/png" } }
};

export const viewport: Viewport = { themeColor: "#192747", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}<PwaRegistration /></body></html>;
}
