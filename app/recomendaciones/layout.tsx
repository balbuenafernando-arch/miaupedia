import type { Metadata } from "next";
import Link from "next/link";
import { MiaupediaLogo } from "@/components/miaupedia-logo";
import "./recommendations.css";

export const metadata: Metadata = {
  title: "Recomendaciones para gatos | Miaupedia",
  description: "Explora productos para gatos y lee las reseñas de la comunidad de Miaupedia.",
};

export default function RecommendationsLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link href="/" className="brand-button" aria-label="Inicio de Miaupedia"><MiaupediaLogo /></Link>
      <Link href="/">Volver a Miaupedia</Link>
    </header>
    <main className="page content-width catalog-page">{children}</main>
  </div>;
}
