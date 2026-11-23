import { AdminPreviewSection } from "./admin-preview-section";
import { AnalyticsPreviewSection } from "./analytics-preview-section";
import { DemoCredentialsSection } from "./demo-credentials-section";
import { DeviceShowcaseSection } from "./device-showcase-section";
import { ExperienceSection } from "./experience-section";
import { FaqSection } from "./faq-section";
import { FeaturesSection } from "./features-section";
import { FinalCtaSection } from "./final-cta-section";
import { Footer } from "./footer";
import { Header } from "./header";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { SecuritySection } from "./security-section";
import { StatsSection } from "./stats-section";
import { TopBar } from "./top-bar";
import { TransferPipelineSection } from "./transfer-pipeline-section";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-landing-bg text-landing-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[8px] focus:bg-landing-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-landing-primary-foreground"
      >
        Skip to content
      </a>
      <TopBar />
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSection />
        <StatsSection />
        <ExperienceSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AdminPreviewSection />
        <SecuritySection />
        <TransferPipelineSection />
        <AnalyticsPreviewSection />
        <DeviceShowcaseSection />
        <DemoCredentialsSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
