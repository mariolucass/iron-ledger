import { createMetadata } from "@/shared/config/metadata";
import { UserDetailPage, userDetailPages } from "@/views/identity/user-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(userDetailPages.auditLog(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <UserDetailPage id={id} section="auditLog" />;
}
