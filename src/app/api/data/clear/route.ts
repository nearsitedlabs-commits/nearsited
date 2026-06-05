import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dataClearSchema } from "@/lib/validation";

const _VALID_SCOPES = ["leads", "pipeline", "pitches", "saved_searches"] as const;
type Scope = (typeof _VALID_SCOPES)[number];

const TABLE_MAP: Record<Scope, string> = {
  leads: "businesses",
  pipeline: "pipeline",
  pitches: "pitches",
  saved_searches: "saved_searches",
};

export const POST = withAuth(async ({ request, user }) => {
  const body = await request.json().catch(() => ({}));
  
  // ── Zod validation ──────────────────────────────────────────────────────
  const parsed = dataClearSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const { scope } = parsed.data;

  const table = TABLE_MAP[scope as Scope];
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, count } = await (admin.from(table) as any)
    .delete({ count: "exact" })
    .eq("user_id", user.id);

  if (error) {
    console.error(`[DATA/CLEAR] scope=${scope} DB error`, { code: error.code, message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deleted = count ?? 0;
  console.log(`[DATA/CLEAR] scope=${scope} deleted=${deleted} user=...${user.id.slice(-4)}`);
  return NextResponse.json({ deleted });
});
