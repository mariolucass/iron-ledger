import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { productCategoryPages } from "@/views/product-categories";

const page = productCategoryPages.create;

export const metadata = createMetadata({ ...page, path: "/products/categories/new" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
