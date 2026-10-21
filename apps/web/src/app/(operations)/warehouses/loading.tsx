import {
  CardGridSkeleton,
  FiltersSkeleton,
  HeaderSkeleton,
  KpiSkeleton,
  PageLoading,
} from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <HeaderSkeleton />
      <KpiSkeleton />
      <FiltersSkeleton />
      <CardGridSkeleton />
    </PageLoading>
  );
}
