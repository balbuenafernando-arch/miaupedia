"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthModal } from "@/components/functional-modals";
import { createClient } from "@/lib/supabase";
import { catalogConfigured, findProduct, listProductReviews } from "@/lib/product-catalog";
import { LoadError, Pagination, ProductImage } from "./catalog-ui";
import { ProductReviewForm } from "./product-review-form";
import { useCatalogResource } from "./use-catalog-resource";

const price = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const date = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "America/Lima" });

export function ProductDetail({ slug }: { slug: string }) {
  return <>
    <Link className="catalog-back" href="/recomendaciones">← Volver al catálogo</Link>
    {catalogConfigured
      ? <ProductListing slug={slug} />
      : <p className="catalog-panel" role="status">El catálogo todavía no está disponible.</p>}
  </>;
}

function ProductListing({ slug }: { slug: string }) {
  const load = useCallback((signal: AbortSignal) => findProduct(slug, signal), [slug]);
  const { resource, refresh } = useCatalogResource(load);
  if (resource.status === "loading") return <p role="status">Cargando ficha…</p>;
  if (resource.status !== "ready") return <LoadError retry={refresh} />;
  const product = resource.data;
  if (!product) return <h1>Producto no encontrado</h1>;

  return <>
    <article className="catalog-panel catalog-detail">
      <ProductImage product={product} />
      <div>
        <span className="kicker">{product.categoria}</span>
        <h1>{product.nombre}</h1>
        {product.descripcion && <p>{product.descripcion}</p>}
        {product.precio_referencia !== null && <p>Precio de referencia · {price.format(product.precio_referencia)}</p>}
      </div>
    </article>
    <ProductReviews key={product.id} productId={product.id} />
  </>;
}

function ProductReviews({ productId }: { productId: string }) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [authOpen, setAuthOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const load = useCallback(
    (signal: AbortSignal) => listProductReviews(productId, page, signal),
    [productId, page],
  );
  const { resource, refresh } = useCatalogResource(load);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUserId(session && !session.user.is_anonymous ? session.user.id : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <section className="catalog-reviews">
    <h2>Reseñas de la comunidad</h2>
    {resource.status === "loading" && <p role="status">Cargando reseñas…</p>}
    {resource.status === "error" && <LoadError retry={refresh} />}
    {resource.status === "ready" && <>
      {resource.data.reviews.length ? <ul className="catalog-review-list">
        {resource.data.reviews.map(review => <li className="catalog-panel" key={review.id}>
          <div className="catalog-review-heading">
            <strong className="stars">★ {review.puntuacion} de 5</strong>
            <time dateTime={review.created_at}>{date.format(new Date(review.created_at))}</time>
          </div>
          <p>{review.comentario}</p>
          {(review.ventajas || review.desventajas) && <dl>
            {review.ventajas && <><dt>Ventajas</dt><dd>{review.ventajas}</dd></>}
            {review.desventajas && <><dt>Desventajas</dt><dd>{review.desventajas}</dd></>}
          </dl>}
        </li>)}
      </ul> : <p className="catalog-panel">Aún no hay reseñas publicadas.</p>}
      <Pagination page={page} hasNext={resource.data.hasNext} setPage={setPage} />
    </>}
    <p role="status">{message}</p>
    {userId && <ProductReviewForm key={userId} productId={productId} userId={userId} onSaved={pending => {
      setMessage(pending ? "Recibimos tu reseña. Está en revisión." : "Tu reseña se publicó.");
      if (!pending) {
        setPage(0);
        refresh();
      }
    }} />}
    {userId === null && <button className="primary" onClick={() => setAuthOpen(true)}>
      Inicia sesión para escribir una reseña
    </button>}
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={() => setAuthOpen(false)} />}
  </section>;
}
