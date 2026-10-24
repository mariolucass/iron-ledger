import { DetailHeaderSkeleton, PanelSkeleton, PageLoading, StatGridSkeleton } from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <DetailHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2"><PanelSkeleton rows={1} /><StatGridSkeleton count={4} /></div>
    </PageLoading>
  );
}
