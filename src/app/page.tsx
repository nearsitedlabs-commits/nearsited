"use client";

import { useRouter } from "next/navigation";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { TrustBar } from "@/components/landing/TrustBar";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { WhyNearsitedSection } from "@/components/landing/WhyNearsitedSection";
import { SampleReportSection } from "@/components/landing/SampleReportSection";
import { SamplePitchSection } from "@/components/landing/SamplePitchSection";
import { AgencyUseCasesSection } from "@/components/landing/AgencyUseCasesSection";
import { FounderStorySection } from "@/components/landing/FounderStorySection";
import { ObjectionsSection } from "@/components/landing/ObjectionsSection";
import { ProofBlocksSection } from "@/components/landing/ProofBlocksSection";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import Pricing from "@/components/landing/Pricing";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  const router = useRouter();
  const navigate = router.push.bind(router);

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <LandingNav navigate={navigate} />
      <main className="pt-20">
        <LandingHero navigate={navigate} />
        <TrustBar />
        <HowItWorksSection />
        <WhyNearsitedSection />
        <SampleReportSection navigate={navigate} />
        <SamplePitchSection navigate={navigate} />
        <AgencyUseCasesSection navigate={navigate} />
        <FounderStorySection />
        <ObjectionsSection navigate={navigate} />
        <ProofBlocksSection navigate={navigate} />
        <LandingFAQ />
        <Pricing navigate={navigate} />
        <CTASection navigate={navigate} />
        <LandingFooter />
      </main>
    </div>
  );
}
