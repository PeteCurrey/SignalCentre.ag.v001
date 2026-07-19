import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Mock authentication - replace with Clerk/Auth logic
  const userId = "mock-user-123";

  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const db = createServerClient();
  const { data, error } = await db.from("alerts").select("*").eq("user_id", userId).order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const userId = "mock-user-123";
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ id: "mock-id", ...body, user_id: userId, created_at: new Date().toISOString() });
  }

  const db = createServerClient();
  const { data, error } = await db.from("alerts").insert({
    user_id: userId,
    instrument: body.instrument,
    condition_type: body.condition_type,
    threshold: body.threshold,
    notification_channels: body.notification_channels,
  } as any).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const userId = "mock-user-123";
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  const db = createServerClient();
  const { data, error } = await (db.from("alerts") as any)
    .update({ active: body.active })
    .eq("id", body.id)
    .eq("user_id", userId)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const userId = "mock-user-123";
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  const db = createServerClient();
  const { error } = await db.from("alerts").delete().eq("id", id).eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
