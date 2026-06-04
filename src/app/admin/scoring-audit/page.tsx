import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ScoringAuditClient from "./scoring-audit-client";
import type { AuditBusiness } from "./score-explainer";

export const metadata = { title: "Scoring Audit — NearSited Admin" };

export default async function ScoringAuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  // Fetch all businesses across all users (admin view)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: businesses, error } = await (admin as any)
    .from("businesses")
    .select("id, name, business_type, city, website, website_status, rating, review_count, performance_score, design_score, opportunity_score, flagged_for_outreach, audited_at, design_analyzed_at, discovered_at")
    .order("opportunity_score", { ascending: false, nullsFirst: false });

  if (error) {
    return (
      <div className="p-8 text-red-400">
        Failed to load businesses: {error.message}
      </div>
    );
  }

  return <ScoringAuditClient businesses={(businesses ?? []) as AuditBusiness[]} />;
}
