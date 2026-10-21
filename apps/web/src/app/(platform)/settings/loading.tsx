import { PageLoading, SettingsSkeleton } from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <SettingsSkeleton />
    </PageLoading>
  );
}
