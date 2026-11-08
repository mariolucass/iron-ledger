import { PublicThemeSync } from "@/shared/lib/public-theme";
import { FeaturesSection } from "./components/FeaturesSection";
import { FinalCta } from "./components/FinalCta";
import { HeroSection } from "./components/HeroSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { LandingFooter } from "./components/LandingFooter";
import { LandingHeader } from "./components/LandingHeader";
import { Orb } from "@/shared/ui/orbs";
import { ProductShowcase } from "./components/ProductShowcase";
import { TechSection } from "./components/TechSection";

/** Luz de fundo fixa: dois orbes bem suaves e uma malha que some nas bordas. */
function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[var(--orb-opacity)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgb(var(--ink-rgb)/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--ink-rgb)/0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.12] [mask-image:radial-gradient(ellipse_at_50%_0%,black_20%,transparent_75%)]" />
      <Orb
        color="green"
        position="-top-[12%] left-[14%] size-[640px]"
        opacity={0.1}
        motion={0}
        blur={110}
      />
      <Orb
        color="violet"
        position="top-[40%] -right-[6%] size-[520px]"
        opacity={0.1}
        motion={2}
        blur={110}
      />
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground">
      <PublicThemeSync />
      <AmbientBackground />
      <LandingHeader />
      <main>
        <HeroSection />
        <ProductShowcase />
        <FeaturesSection />
        <TechSection />
        <HowItWorksSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
