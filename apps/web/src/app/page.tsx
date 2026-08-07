import FeaturesSection from "@/components/landing/FeaturesSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import PortfolioGallerySection from "@/components/landing/PortfolioGallerySection";
import RebalancingDemoSection from "@/components/landing/RebalancingDemoSection";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import TradeJournalSection from "@/components/landing/TradeJournalSection";

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
