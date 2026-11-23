import { redirect } from "next/navigation";
import { parseCategory } from "@/lib/product-catalog";

export default async function ProductCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const filter = parseCategory(category);
  redirect(filter ? `/recomendaciones?categoria=${filter}` : "/recomendaciones");
}
