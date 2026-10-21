import { createMetadata } from "@/shared/config/metadata";
import { LandingPage } from "@/views/landing";

export const metadata = createMetadata({
  path: "/",
  index: true,
});

export default function Page() {
  return <LandingPage />;
}
