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
    <div className="min-h-screen bg-landing-bg text-landing-ink">
      <TopBar />
      <Header />
      <main id="main-content">
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
