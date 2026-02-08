import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { headline, summary, brandName, brandDescription } = await request.json();

    if (!headline || !brandName) {
      return NextResponse.json(
        { error: "headline and brandName are required" },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      system:
        "You are a brand strategist writing a concise 'Why it matters' paragraph for a newsletter article. " +
        "Write 2-3 sentences explaining why this article is relevant to the specified brand. " +
        "Be specific about how the article's topic connects to the brand's strategy, products, or industry position. " +
        "Do NOT use the phrase 'Why it matters' in your response — just write the paragraph directly. " +
        "Keep the tone professional and insightful.",
      messages: [
        {
          role: "user",
          content: `Brand: ${brandName}\n${brandDescription ? `Brand context: ${brandDescription}\n` : ""}Article headline: ${headline}\n${summary ? `Article summary: ${summary}` : ""}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const text = textBlock ? textBlock.text : "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Why-it-matters generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate text" },
      { status: 500 }
    );
  }
}
