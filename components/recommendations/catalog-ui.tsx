import Image from "next/image";
import { Package } from "lucide-react";
import type { Product } from "@/lib/product-catalog";

export function ProductImage({ product }: { product: Product }) {
  if (product.imagen?.startsWith("https://")) {
    return <Image className="catalog-image" src={product.imagen} alt="" width={600} height={360}
      unoptimized referrerPolicy="no-referrer" />;
  }
  return <div className="catalog-image catalog-placeholder"><Package aria-hidden="true" /></div>;
}

export function LoadError({ retry }: { retry: () => void }) {
  return <div className="catalog-panel">
    <p role="alert">No pudimos cargar la información.</p>
    <button className="primary" onClick={retry}>Reintentar</button>
  </div>;
}

export function Pagination({ page, hasNext, setPage }: {
  page: number;
  hasNext: boolean;
  setPage: (page: number) => void;
}) {
  if (!page && !hasNext) return null;
  return <nav className="catalog-pagination" aria-label="Paginación">
    <button disabled={!page} onClick={() => setPage(page - 1)}>Anterior</button>
    <span>Página {page + 1}</span>
    <button disabled={!hasNext} onClick={() => setPage(page + 1)}>Siguiente</button>
  </nav>;
}
