import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { detectLeadWorkflow } from "@/lib/lead-types";
import LeadDetailClient from "./lead-detail-client";
import SocialOpportunityPage from "./components/social-opportunity-page";
import NoDigitalPresencePage from "./components/no-digital-presence-page";
import type { BusinessRow, AuditRow, DesignAnalysisRow } from "@/lib/db-types";


type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; analyze?: string }>;
};

export default async function LeadDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { from, analyze } = await searchParams;
  const fromSource = from || "leads";
  const autoAnalyze = analyze === "1";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all data in parallel — business, audits, design analyses, pipeline, pitch
  const [bizResult, auditsResult, designResult, pipelineResult, pitchResult] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("audits").select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(2),
    supabase.from("design_analyses").select("*").eq("business_id", id).order("analyzed_at", { ascending: false }).limit(2),
    supabase.from("pipeline").select("status").eq("business_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("pitches").select("id, subject, body, tone").eq("business_id", id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
  ]);

  const business = bizResult.data;
  const bizErr = bizResult.error;
  if (bizErr || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-400">
          Lead not found
        </div>
      </div>
    );
  }

  // Detect lead workflow from website_status
  const workflow = detectLeadWorkflow(business as { website_status: string; website: string | null });

  const audits = auditsResult.data;
  const designRows = designResult.data;
  const pipelineRow = pipelineResult.data;
  const pitchRows = pitchResult.data;

  const savedPitch = pitchRows?.[0] ?? null;

  // Route to the appropriate workflow page
  switch (workflow) {
    case "social_only":
      return (
        <SocialOpportunityPage
          business={business as BusinessRow}
          pipelineStatus={pipelineRow?.status ?? null}
          savedPitch={savedPitch as { id: string; subject: string; body: string; tone: string } | null}
          backTo={fromSource}
        />
      );
    case "no_digital_presence":
      return (
        <NoDigitalPresencePage
          business={business as BusinessRow}
          pipelineStatus={pipelineRow?.status ?? null}
          savedPitch={savedPitch as { id: string; subject: string; body: string; tone: string } | null}
          backTo={fromSource}
        />
      );
    case "website":
    default:
      return (
        <LeadDetailClient
          business={business as BusinessRow}
          audits={(audits ?? []) as AuditRow[]}
          designAnalyses={(designRows ?? []) as DesignAnalysisRow[]}
          pipelineStatus={pipelineRow?.status ?? null}
          savedPitch={savedPitch as { id: string; subject: string; body: string; tone: string } | null}
          backTo={fromSource}
          autoAnalyze={autoAnalyze}
        />
      );
  }
}
