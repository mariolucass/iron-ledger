import {
  FiltersSkeleton,
  HeaderSkeleton,
  PageLoading,
  TableSkeleton,
} from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <HeaderSkeleton />
      <FiltersSkeleton />
      <TableSkeleton columns={6} rows={8} />
    </PageLoading>
  );
}
