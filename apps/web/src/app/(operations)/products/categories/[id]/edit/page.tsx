import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { productCategoryPages } from "@/views/operations/product-categories";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(productCategoryPages.edit(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ComingSoonPage {...productCategoryPages.edit(id)} />;
}
