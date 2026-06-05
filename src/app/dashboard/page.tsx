import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import type { BusinessRow } from "@/lib/db-types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Extract first name from user metadata (Google OAuth sets full_name)
  const userMeta = user.user_metadata ?? {};
  const fullName: string = userMeta.full_name ?? userMeta.name ?? "";
  const firstName = fullName.trim().split(/\s+/)[0] ?? "";

  const { count: totalLeads } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: flaggedLeads } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("flagged_for_outreach", true);

  const { data: pipelineData } = await supabase
    .from("pipeline")
    .select("status")
    .eq("user_id", user.id);

  const pipelineCounts: Record<string, number> = {};
  for (const row of pipelineData ?? []) {
    pipelineCounts[row.status] = (pipelineCounts[row.status] ?? 0) + 1;
  }

  // Count unanalysed leads (no performance_score) for action guidance
  const { count: unanalysedLeads } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("performance_score", null);

  const activeConversations = pipelineCounts["in_conversation"] ?? 0;

  const { data: recentLeads } = await supabase
    .from("businesses")
    .select("id, name, business_type, city, website_status, performance_score, design_score, opportunity_score, rating, review_count, discovered_at, flagged_for_outreach")
    .eq("user_id", user.id)
    .order("discovered_at", { ascending: false })
    .limit(5);

  return (
    <DashboardClient
      firstName={firstName}
      totalLeads={totalLeads ?? 0}
      flaggedLeads={flaggedLeads ?? 0}
      unanalysedLeads={unanalysedLeads ?? 0}
      activeConversations={activeConversations}
      pipelineCounts={pipelineCounts}
      recentLeads={(recentLeads ?? []) as BusinessRow[]}
    />
  );
}
