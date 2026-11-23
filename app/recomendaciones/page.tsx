import { ProductList } from "@/components/recommendations/product-list";
import { parseCategory } from "@/lib/product-catalog";

export default async function RecommendationsPage({ searchParams }: {
  searchParams: Promise<{ categoria?: string | string[] }>;
}) {
  const { categoria } = await searchParams;
  return <ProductList initialCategory={parseCategory(typeof categoria === "string" ? categoria : "")} />;
}
