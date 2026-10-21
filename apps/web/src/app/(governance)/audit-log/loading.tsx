import {
  FiltersSkeleton,
  HeaderSkeleton,
  PageLoading,
  TableSkeleton,
} from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <HeaderSkeleton action={false} />
      <FiltersSkeleton />
      <TableSkeleton columns={5} rows={10} />
    </PageLoading>
  );
}
