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
      <HeaderSkeleton action={false} />
      <KpiSkeleton />
      <FiltersSkeleton count={2} />
      <CardGridSkeleton count={4} />
    </PageLoading>
  );
}
