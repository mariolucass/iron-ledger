import Image from "next/image";

/** Both variants stay mounted and swap from the root data-theme, so SSR and first paint never flicker. */
export function BrandMark({ width, height, priority }: { width: number; height: number; priority?: boolean }) {
  const size = { width, height, priority, alt: "", style: { width, height } };
  return (
    <>
      <Image src="/brand/logo-symbol-dark.svg" {...size} className="in-data-[theme=light]:hidden" />
      <Image src="/brand/logo-symbol.svg" {...size} className="hidden in-data-[theme=light]:block" />
    </>
  );
}
