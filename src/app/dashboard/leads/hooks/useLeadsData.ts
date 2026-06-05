import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BusinessRow } from "@/lib/db-types";
import type { LeadRow } from "../components/types";

type UseLeadsDataResult = {
  leads: LeadRow[];
  pipelineMap: Map<string, string>;
  loading: boolean;
  error: string | null;
};

export function useLeadsData(): UseLeadsDataResult {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [pipelineMap, setPipelineMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please sign in to view leads"); setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from("businesses")
        .select("id, name, business_type, address, city, place_id, website, phone, website_status, rating, review_count, performance_score, design_score, opportunity_score, audited_at, design_analyzed_at, discovered_at, flagged_for_outreach, outreach_reason")
        .eq("user_id", user.id)
        .order("discovered_at", { ascending: false });

      if (fetchError) { setError(fetchError.message); setLoading(false); return; }

      const { data: designRows } = await supabase
        .from("design_analyses").select("business_id, issues").eq("user_id", user.id);

      const issuesCountMap = new Map<string, number>();
      for (const row of designRows ?? []) {
        const issues = (row.issues as unknown[] | null) ?? [];
        issuesCountMap.set(row.business_id, (issuesCountMap.get(row.business_id) ?? 0) + issues.length);
      }

      setLeads((data ?? []).map((lead) => ({
        ...lead,
        phone: (lead as BusinessRow).phone as string | null ?? null,
        issues_count: issuesCountMap.get(lead.id) ?? 0,
        opportunity_score: (lead as BusinessRow).opportunity_score as number | null ?? null,
      })));

      const { data: pipelineRows } = await supabase
        .from("pipeline").select("business_id, status").eq("user_id", user.id);

      const pMap = new Map<string, string>();
      for (const row of pipelineRows ?? []) pMap.set(row.business_id, row.status);
      setPipelineMap(pMap);

      setLoading(false);
    }

    init();
  }, []);

  return { leads, pipelineMap, loading, error };
}
