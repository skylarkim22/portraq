import { FeaturesSection } from "@/features/landing/components/FeaturesSection";
import { FinalCtaSection } from "@/features/landing/components/FinalCtaSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { LandingNav } from "@/features/landing/components/LandingNav";
import { PortfolioGallerySection } from "@/features/landing/components/PortfolioGallerySection";
import { RebalancingDemoSection } from "@/features/landing/components/RebalancingDemoSection";
import { RevealOnScroll } from "@/features/landing/components/RevealOnScroll";
import { TradeJournalSection } from "@/features/landing/components/TradeJournalSection";

export default function Home() {
  return (
    <>
      <div className="noise" />
      <RevealOnScroll />
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <PortfolioGallerySection />
      <HowItWorksSection />
      <RebalancingDemoSection />
      <TradeJournalSection />
      <FinalCtaSection />
      <LandingFooter />
    </>
  );
}
