import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pollAllFeeds } from "@/lib/ingestion/rss-parser";

export async function POST() {
  try {
    // Check auth — admin only
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role via profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const results = await pollAllFeeds();

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Feed poll error:", message);
    return NextResponse.json(
      { error: "Feed polling failed", details: message },
      { status: 500 }
    );
  }
}
