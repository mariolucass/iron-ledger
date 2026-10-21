import {
  ChartSkeleton,
  DetailHeaderSkeleton,
  PageLoading,
  PanelSkeleton,
  StatGridSkeleton,
} from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <DetailHeaderSkeleton />
      <StatGridSkeleton />
      <div className="grid max-w-[960px] gap-6">
        <PanelSkeleton rows={4} />
        <ChartSkeleton className="h-48" />
      </div>
    </PageLoading>
  );
}
