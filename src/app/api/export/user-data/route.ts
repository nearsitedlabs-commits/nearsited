import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Exports all user data as JSON (GDPR / data portability request).
 * Returns: businesses, pipeline entries, pitches, audits, design analyses, saved searches.
 */
export const GET = withAuth(async ({ user }) => {
  const admin = createAdminClient();
  const userId = user.id;

  const [businesses, pipeline, pitches, audits, designAnalyses, territories] = await Promise.all([
    admin.from("businesses").select("*").eq("user_id", userId),
    admin.from("pipeline").select("*").eq("user_id", userId),
    admin.from("pitches").select("*").eq("user_id", userId),
    admin.from("audits").select("*").eq("user_id", userId),
    admin.from("design_analyses").select("*").eq("user_id", userId),
    admin.from("territories").select("*").eq("user_id", userId),
  ]);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user: { id: userId, email: user.email },
    businesses: businesses.data ?? [],
    pipeline: pipeline.data ?? [],
    pitches: pitches.data ?? [],
    audits: audits.data ?? [],
    design_analyses: designAnalyses.data ?? [],
    saved_searches: territories.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nearsited-data-export-${userId.slice(0, 8)}.json"`,
    },
  });
});
