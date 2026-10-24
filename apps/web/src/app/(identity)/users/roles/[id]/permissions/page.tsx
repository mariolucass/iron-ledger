import { createMetadata } from "@/shared/config/metadata";
import { RolePage, rolePages } from "@/views/identity/roles";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(rolePages.permissions(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <RolePage id={id} section="permissions" />;
}
