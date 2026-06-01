import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LeadDetailClient from "./lead-detail-client";
import type { WebsiteStatus } from "@/lib/types";

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

  // Fetch pipeline status
  const { data: pipelineRow } = await supabase
    .from("pipeline")
    .select("status")
    .eq("business_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <LeadDetailClient
      business={business as Record<string, unknown>}
      audits={(audits ?? []) as Record<string, unknown>[]}
      designAnalyses={(designRows ?? []) as Record<string, unknown>[]}
      pipelineStatus={pipelineRow?.status ?? null}
    />
  );
}
