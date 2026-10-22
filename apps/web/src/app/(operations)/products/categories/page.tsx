import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { productCategoryPages } from "@/views/product-categories";

const page = productCategoryPages.list;

export const metadata = createMetadata({ ...page, path: "/products/categories" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
