import { createClient } from "@/lib/supabase";

export const categoryFilters = {
  alimentos: ["Alimentos"],
  arenas: ["Arenas"],
  accesorios: ["Accesorios", "Juguetes", "Rascadores", "Transportadoras", "Fuentes de agua"],
} as const;

export type CategoryFilter = keyof typeof categoryFilters;

export const categoryLabels: Record<CategoryFilter, string> = {
  alimentos: "Alimentos",
  arenas: "Arenas",
  accesorios: "Accesorios",
};

export function parseCategory(value: string): CategoryFilter | "" {
  const key = value.toLowerCase();
  if (key === "alimentos" || key === "arenas" || key === "accesorios") return key;
  return categoryFilters.accesorios.some(category => category.toLowerCase() === key)
    ? "accesorios"
    : "";
}

export type Product = {
  id: string;
  slug: string;
  nombre: string;
  categoria: (typeof categoryFilters)[CategoryFilter][number];
  descripcion: string | null;
  imagen: string | null;
  precio_referencia: number | null;
};

export type ProductReview = {
  id: string;
  puntuacion: number;
  comentario: string;
  ventajas: string | null;
  desventajas: string | null;
  created_at: string;
};

const productColumns = "id,slug,nombre,categoria,descripcion,imagen,precio_referencia";
const reviewColumns = "id,puntuacion,comentario,ventajas,desventajas,created_at";
export const catalogConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function database() {
  const client = createClient();
  if (!client) throw new Error("El catálogo todavía no está disponible.");
  return client;
}

export async function listProducts(search: string, category: CategoryFilter | "", page: number, signal: AbortSignal) {
  const pageSize = 12;
  const start = page * pageSize;
  let query = database().from("products").select(productColumns)
    .order("nombre").order("id").range(start, start + pageSize);
  if (category) query = query.in("categoria", categoryFilters[category]);
  if (search) {
    // PostgREST uses * as an alias for % and PostgreSQL treats _ as a wildcard.
    const literal = search.replace(/[\\%_*]/g, character => "\\" + (character === "*" ? "%" : character));
    query = query.ilike("nombre", `%${literal}%`);
  }
  const { data, error } = await query.abortSignal(signal).returns<Product[]>();
  if (error) throw error;
  return { products: data.slice(0, pageSize), hasNext: data.length > pageSize };
}

export async function findProduct(slug: string, signal: AbortSignal) {
  const { data, error } = await database().from("products").select(productColumns)
    .eq("slug", slug).abortSignal(signal).maybeSingle<Product>();
  if (error) throw error;
  return data;
}

export async function listProductReviews(productId: string, page: number, signal: AbortSignal) {
  const pageSize = 10;
  const start = page * pageSize;
  const { data, error } = await database().from("reviews").select(reviewColumns)
    .eq("product_id", productId).eq("moderation_state", "approved")
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(start, start + pageSize).abortSignal(signal).returns<ProductReview[]>();
  if (error) throw error;
  return { reviews: data.slice(0, pageSize), hasNext: data.length > pageSize };
}

export type ReviewDraft = {
  id: string;
  rating: number;
  comment: string;
  pros: string;
  cons: string;
  pending: boolean;
};

export async function submitProductReview(productId: string, expectedUserId: string, draft: ReviewDraft) {
  const db = database();
  const { data, error: authError } = await db.auth.getUser();
  if (authError || !data.user || data.user.is_anonymous || data.user.id !== expectedUserId) {
    throw new Error("Inicia sesión con tu cuenta para publicar la reseña.");
  }
  const { error } = await db.from("reviews").upsert({
    id: draft.id,
    product_id: productId,
    user_id: data.user.id,
    puntuacion: draft.rating,
    comentario: draft.comment,
    ventajas: draft.pros || null,
    desventajas: draft.cons || null,
    estado: draft.pending ? "En revisión" : "Publicada",
    moderation_state: draft.pending ? "pending" : "approved",
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error("No pudimos guardar la reseña. Inténtalo de nuevo.");
}
