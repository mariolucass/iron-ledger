import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { userDetailPages } from "@/views/user-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(userDetailPages.security(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ComingSoonPage {...userDetailPages.security(id)} />;
}
