import { DetailHeaderSkeleton, FormSkeleton, PageLoading } from "@/shared/ui/page-skeletons";

export default function Loading() {
  return (
    <PageLoading>
      <DetailHeaderSkeleton />
      <FormSkeleton />
    </PageLoading>
  );
}
