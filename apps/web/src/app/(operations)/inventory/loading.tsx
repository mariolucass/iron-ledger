import {
  FiltersSkeleton,
  HeaderSkeleton,
  KpiSkeleton,
  PageLoading,
  TableSkeleton,
} from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <HeaderSkeleton />
      <KpiSkeleton />
      <FiltersSkeleton />
      <TableSkeleton columns={7} rows={8} />
    </PageLoading>
  );
}
