import { ProductDetail } from "@/components/recommendations/product-detail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetail key={slug} slug={slug} />;
}
