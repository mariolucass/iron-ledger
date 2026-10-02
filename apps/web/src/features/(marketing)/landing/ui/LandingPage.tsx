import { FeaturesSection } from "./components/FeaturesSection";
import { FinalCta } from "./components/FinalCta";
import { HeroSection } from "./components/HeroSection";
import { LandingFooter } from "./components/LandingFooter";
import { LandingHeader } from "./components/LandingHeader";
import { ProductShowcase } from "./components/ProductShowcase";
import { StatsSection } from "./components/StatsSection";
import { TechSection } from "./components/TechSection";
import { TestimonialsSection } from "./components/TestimonialsSection";

function AmbientBackground() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:72px_72px] opacity-15" />
    <div className="absolute -top-[10%] left-[20%] size-[700px] rounded-full bg-primary/[0.06] blur-[100px]" />
    <div className="absolute top-[30%] -right-[5%] size-[500px] rounded-full bg-purple/[0.06] blur-[100px]" />
    <div className="absolute bottom-[10%] left-[10%] size-[400px] rounded-full bg-info/[0.05] blur-[100px]" />
  </div>;
}

export function LandingPage() {
  return <div className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground">
    <AmbientBackground />
    <LandingHeader />
    <main>
      <HeroSection />
      <StatsSection />
      <ProductShowcase />
      <FeaturesSection />
      <TechSection />
      <TestimonialsSection />
      <FinalCta />
    </main>
    <LandingFooter />
  </div>;
}
