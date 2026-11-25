import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Miaupedia",
    short_name: "Miaupedia",
    description: "Descubre y comparte recomendaciones para cuidar mejor a tus gatos.",
    lang: "es-PE",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff9f2",
    theme_color: "#192747",
    icons: [
      { src: "/icons/beta4-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/beta4-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/beta4-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
