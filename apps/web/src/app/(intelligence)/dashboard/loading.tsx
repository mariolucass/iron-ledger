import {
  ChartSkeleton,
  HeaderSkeleton,
  KpiSkeleton,
  PageLoading,
} from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <HeaderSkeleton action={false} />
      <KpiSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </PageLoading>
  );
}
