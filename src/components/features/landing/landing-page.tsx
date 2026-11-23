import { AdminPreviewSection } from "./admin-preview-section";
import { ExperienceSection } from "./experience-section";
import { Header } from "./header";
import { HeroSection } from "./hero-section";
import { StatsSection } from "./stats-section";
import { TopBar } from "./top-bar";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-landing-bg text-landing-ink">
      <TopBar />
      <Header />
      <main id="main-content">
        <HeroSection />
        <StatsSection />
        <ExperienceSection />
        <AdminPreviewSection />
      </main>
    </div>
  );
}
