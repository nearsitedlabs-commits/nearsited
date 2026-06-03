import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, website, audit, design } = body;
    const normalizedWebsite = typeof website === "string" ? website.trim() : undefined;

    if (!businessId && !normalizedWebsite) {
      return NextResponse.json(
        { error: "Missing required field: businessId or website" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    let targetBusinessId = businessId;
    if (!targetBusinessId) {
      const { data: existingBusiness, error: businessLookupError } = await supabase
        .from("businesses")
        .select("id")
        .eq("website", normalizedWebsite)
        .eq("user_id", user.id)
        .maybeSingle();

      if (businessLookupError) {
        console.error("Business lookup error:", businessLookupError);
        return NextResponse.json(
          { error: "Failed to lookup existing business" },
          { status: 500 },
        );
      }

      if (existingBusiness?.id) {
        targetBusinessId = existingBusiness.id;
      } else {
        let parsedName = normalizedWebsite;
        try {
          parsedName = new URL(normalizedWebsite!).hostname;
        } catch {
          parsedName = normalizedWebsite;
        }

        const scoreValues = [audit?.mobile?.performance_score, audit?.desktop?.performance_score].filter(
          (value) => typeof value === "number",
        ) as number[];
        const avgPerformance = scoreValues.length
          ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length)
          : null;

        const designValues = [design?.mobile?.design_score, design?.desktop?.design_score].filter(
          (value) => typeof value === "number",
        ) as number[];
        const avgDesign = designValues.length
          ? Math.round(designValues.reduce((sum, value) => sum + value, 0) / designValues.length)
          : null;

        const now = new Date().toISOString();
        const businessIdToInsert = crypto.randomUUID();
        const { error: insertBusinessError } = await supabase.from("businesses").insert({
          id: businessIdToInsert,
          user_id: user.id,
          name: parsedName,
          website: normalizedWebsite,
          website_status: "has_website",
          performance_score: avgPerformance,
          design_score: avgDesign,
          discovered_at: now,
          audited_at: audit ? now : null,
          design_analyzed_at: design ? now : null,
        });

        if (insertBusinessError) {
          console.error("Business insert error:", insertBusinessError);
          return NextResponse.json(
            { error: "Failed to create business record" },
            { status: 500 },
          );
        }

        targetBusinessId = businessIdToInsert;
      }
    }

    // 1. Check if business already exists in pipeline for this user
    const { data: existing, error: lookupError } = await supabase
      .from("pipeline")
      .select("id")
      .eq("business_id", targetBusinessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Pipeline lookup error:", lookupError);
      return NextResponse.json(
        { error: "Failed to check pipeline" },
        { status: 500 },
      );
    }

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Already in pipeline" },
        { status: 200 },
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const adminClient = createAdminClient();
    const { error: insertError } = await (adminClient.from("pipeline") as ReturnType<typeof adminClient.from>).insert({
      id,
      user_id: user.id,
      business_id: targetBusinessId,
      status: "new_lead",
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error("Pipeline insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to add to pipeline" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, pipeline_id: id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Pipeline API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, status, pipelineId } = body;

    // Validate required fields — accept businessId (looked up from client) or pipelineId (direct)
    if (!status) {
      return NextResponse.json(
        { error: "Missing required field: status" },
        { status: 400 },
      );
    }

    const validStatuses = ["new_lead", "analysed", "pitch_generated", "contacted", "in_conversation", "won", "lost"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Authenticate the user server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    const now = new Date().toISOString();
    const matchField = businessId ? "business_id" : "id";
    const matchValue = businessId ?? pipelineId;

    if (!matchValue) {
      return NextResponse.json(
        { error: "Missing required field: businessId or pipelineId" },
        { status: 400 },
      );
    }

    // Attempt update first
    const { data: updatedRows, error: updateError } = await supabase
      .from("pipeline")
      .update({
        status,
        updated_at: now,
      })
      .eq(matchField, matchValue)
      .eq("user_id", user.id)
      .select("id");

    if (updateError) {
      console.error("Pipeline update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update pipeline status" },
        { status: 500 },
      );
    }

    if (updatedRows && updatedRows.length > 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Pipeline record not found" },
        { status: 404 },
      );
    }

    // Create a pipeline row when one does not exist yet for this business and user.
    const id = crypto.randomUUID();
    const patchAdminClient = createAdminClient();
    const { error: insertError } = await (patchAdminClient.from("pipeline") as ReturnType<typeof patchAdminClient.from>).insert({
      id,
      user_id: user.id,
      business_id: businessId,
      status,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error("Pipeline upsert insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create pipeline record" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, pipeline_id: id }, { status: 200 });
  } catch (error) {
    console.error("Pipeline PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, pipelineId } = body;

    if (!businessId && !pipelineId) {
      return NextResponse.json(
        { error: "Missing required field: businessId or pipelineId" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    const { error: deleteError } = await supabase
      .from("pipeline")
      .delete()
      .eq("user_id", user.id)
      .eq(businessId ? "business_id" : "id", (businessId ?? pipelineId) as string);
    if (deleteError) {
      console.error("Pipeline delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove from pipeline" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Pipeline DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
