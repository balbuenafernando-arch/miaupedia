import type { Metadata } from "next";
import "./globals.css";
import "./functional.css";

export const metadata: Metadata = {
  title: "Miaupedia — Mejores decisiones para tu gato",
  description: "Descubre productos, servicios y veterinarias recomendadas por personas con gatos como el tuyo."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
