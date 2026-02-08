import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ingestUrl } from "@/lib/ingestion/pipeline";

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { url, manual_content } = body as {
      url?: string;
      manual_content?: string;
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Ingest the article
    const article = await ingestUrl(url, {
      ingested_by: user.id,
      manual_content: manual_content || undefined,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Handle duplicate article
    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    console.error("Ingestion error:", message);
    return NextResponse.json(
      { error: "Ingestion failed", details: message },
      { status: 500 }
    );
  }
}
