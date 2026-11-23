"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { catalogConfigured, categoryLabels, listProducts, parseCategory, type CategoryFilter } from "@/lib/product-catalog";
import { LoadError, Pagination, ProductImage } from "./catalog-ui";
import { useCatalogResource } from "./use-catalog-resource";

export function ProductList({ initialCategory }: { initialCategory: CategoryFilter | "" }) {
  return <section>
    <div className="page-title">
      <h1>Recomendaciones para gatos</h1>
      <p>Encuentra productos y lee las experiencias de la comunidad.</p>
    </div>
    {catalogConfigured
      ? <CatalogSearch key={initialCategory} initialCategory={initialCategory} />
      : <p className="catalog-panel" role="status">El catálogo todavía no está disponible.</p>}
  </section>;
}

function CatalogSearch({ initialCategory }: { initialCategory: CategoryFilter | "" }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(0);
  const load = useCallback(
    (signal: AbortSignal) => listProducts(search, category, page, signal),
    [search, category, page],
  );
  const { resource: result, refresh } = useCatalogResource(load);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(input.trim());
    setPage(0);
  }

  return <>
    <form className="catalog-search stack-form" role="search" onSubmit={submit}>
      <label>Nombre del producto
        <input type="search" value={input} onChange={event => setInput(event.target.value)} maxLength={100} />
      </label>
      <label>Categoría
        <select value={category} onChange={event => {
          setCategory(parseCategory(event.target.value));
          setPage(0);
        }}>
          <option value="">Todas</option>
          {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <button className="primary">Buscar</button>
    </form>
    {result.status === "loading" && <p role="status">Cargando productos…</p>}
    {result.status === "error" && <LoadError retry={refresh} />}
    {result.status === "ready" && <>
      {result.data.products.length ? <ul className="catalog-grid">
        {result.data.products.map(product => <li key={product.id}>
          <Link className="catalog-card" href={`/recomendaciones/${encodeURIComponent(product.slug)}`}>
            <ProductImage product={product} />
            <div>
              <span className="kicker">{product.categoria}</span>
              <h2>{product.nombre}</h2>
            </div>
          </Link>
        </li>)}
      </ul> : <p className="catalog-panel" role="status">
        {search || category ? "No encontramos productos con estos filtros." : "Aún no hay productos en el catálogo."}
      </p>}
      <Pagination page={page} hasNext={result.data.hasNext} setPage={setPage} />
    </>}
  </>;
}
