import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { detectLeadWorkflow } from "@/lib/lead-types";
import LeadDetailClient from "./lead-detail-client";
import SocialOpportunityPage from "./components/social-opportunity-page";
import NoDigitalPresencePage from "./components/no-digital-presence-page";


type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch business
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

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

  // Fetch latest audits
  const { data: audits } = await supabase
    .from("audits")
    .select("*")
    .eq("business_id", id)
    .order("created_at", { ascending: false })
    .limit(2);

  // Fetch latest design analyses
  const { data: designRows } = await supabase
    .from("design_analyses")
    .select("*")
    .eq("business_id", id)
    .order("analyzed_at", { ascending: false })
    .limit(2);

  // Fetch pipeline status + latest saved pitch in parallel
  const [{ data: pipelineRow }, { data: pitchRows }] = await Promise.all([
    supabase.from("pipeline").select("status").eq("business_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("pitches").select("id, subject, body, tone").eq("business_id", id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
  ]);

  const savedPitch = pitchRows?.[0] ?? null;

  // Route to the appropriate workflow page
  switch (workflow) {
    case "social_only":
      return (
        <SocialOpportunityPage
          business={business as Record<string, unknown>}
          pipelineStatus={pipelineRow?.status ?? null}
          savedPitch={savedPitch as { id: string; subject: string; body: string; tone: string } | null}
        />
      );
    case "no_digital_presence":
      return (
        <NoDigitalPresencePage
          business={business as Record<string, unknown>}
          pipelineStatus={pipelineRow?.status ?? null}
          savedPitch={savedPitch as { id: string; subject: string; body: string; tone: string } | null}
        />
      );
    case "website":
    default:
      return (
        <LeadDetailClient
          business={business as Record<string, unknown>}
          audits={(audits ?? []) as Record<string, unknown>[]}
          designAnalyses={(designRows ?? []) as Record<string, unknown>[]}
          pipelineStatus={pipelineRow?.status ?? null}
          savedPitch={savedPitch as { id: string; subject: string; body: string; tone: string } | null}
        />
      );
  }
}
