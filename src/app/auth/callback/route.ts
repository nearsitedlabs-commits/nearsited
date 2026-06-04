import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_AUDIT_LIMIT } from "@/lib/dodo";

async function ensureSubscription(userId: string) {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("subscriptions").upsert(
    { user_id: userId, tier: "free", audits_limit: FREE_AUDIT_LIMIT, audits_used: 0 },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // Handle email confirmation links (token_hash + type)
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "signup" | "recovery" | "invite" | "magiclink",
    });

    if (!error) {
      if (data.user) await ensureSubscription(data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  // Handle OAuth callback (code)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data.user) await ensureSubscription(data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // No recognized params — redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
