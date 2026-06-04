import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_SCOPES = ["leads", "pipeline", "pitches", "saved_searches"] as const;
type Scope = typeof VALID_SCOPES[number];

const TABLE_MAP: Record<Scope, string> = {
  leads: "businesses",
  pipeline: "pipeline",
  pitches: "pitches",
  saved_searches: "saved_searches",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scope: string = body.scope;

  if (!VALID_SCOPES.includes(scope as Scope)) {
    return NextResponse.json({ error: `Invalid scope. Must be one of: ${VALID_SCOPES.join(", ")}` }, { status: 400 });
  }

  const table = TABLE_MAP[scope as Scope];
  const admin = createAdminClient();

  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .eq("user_id", user.id);

  if (error) {
    console.error(`[DATA/CLEAR] scope=${scope} DB error`, { code: error.code, message: error.message, details: error.details, hint: error.hint });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deleted = count ?? 0;
  console.log(`[DATA/CLEAR] scope=${scope} deleted=${deleted} user=${user.id}`);
  return NextResponse.json({ deleted });
}
