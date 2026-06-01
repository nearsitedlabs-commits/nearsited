import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch aggregate stats
  const { count: totalLeads } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: flaggedLeads } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("flagged_for_outreach", true);

  const { count: totalPitches } = await supabase
    .from("pitches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch pipeline counts per status
  const { data: pipelineData } = await supabase
    .from("pipeline")
    .select("status")
    .eq("user_id", user.id);

  const pipelineCounts: Record<string, number> = {};
  for (const row of pipelineData ?? []) {
    pipelineCounts[row.status] = (pipelineCounts[row.status] ?? 0) + 1;
  }

  // Fetch recent 5 leads
  const { data: recentLeads } = await supabase
    .from("businesses")
    .select("id, name, business_type, city, website_status, performance_score, design_score, discovered_at, flagged_for_outreach")
    .eq("user_id", user.id)
    .order("discovered_at", { ascending: false })
    .limit(5);

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      totalLeads={totalLeads ?? 0}
      flaggedLeads={flaggedLeads ?? 0}
      totalPitches={totalPitches ?? 0}
      pipelineCounts={pipelineCounts}
      recentLeads={(recentLeads ?? []) as Record<string, unknown>[]}
    />
  );
}
