import { createMetadata } from "@/shared/config/metadata";
import { PlatformPage } from "@/views/platform/platform-data";
import { outboxEventPages } from "@/views/platform/outbox-events";

const page = outboxEventPages.detail;

export const metadata = createMetadata({ ...page });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlatformPage section="outboxDetail" id={id} />;
}
