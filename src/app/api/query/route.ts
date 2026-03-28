import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Default model — can be changed to any OpenRouter model
const AI_MODEL = process.env.AI_MODEL || "google/gemini-2.5-flash";

function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "and", "but", "or",
    "not", "no", "nor", "so", "yet", "both", "either", "neither", "each",
    "every", "all", "any", "few", "more", "most", "other", "some", "such",
    "than", "too", "very", "just", "about", "how", "what", "when", "where",
    "who", "which", "why", "this", "that", "these", "those", "it", "its",
    "i", "me", "my", "we", "our", "you", "your", "he", "him", "his",
    "she", "her", "they", "them", "their",
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, sessionId } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const keywords = extractKeywords(message);

    // Query DB for related KnowledgeCards by tag overlap
    const relatedCards = await prisma.knowledgeCard.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        tags: { hasSome: keywords },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        author: { select: { name: true, email: true } },
      },
    });

    // Build system prompt with team context injected
    let systemPrompt =
      "You are TeamBrain, an AI assistant for a collaborative team workspace. " +
      "Provide clear, actionable answers. When referencing team knowledge, cite it.";

    if (relatedCards.length > 0) {
      const cardSummaries = relatedCards
        .map(
          (card, i) =>
            `[${i + 1}] Q: ${card.question}\nA: ${card.summary}\n(by ${card.author.name || card.author.email})`
        )
        .join("\n\n");

      systemPrompt +=
        "\n\nYour team has previously established:\n" + cardSummaries;
    }

    // Stream response via OpenRouter
    const stream = await openrouter.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const relatedCardsSerialized = relatedCards.map((card) => ({
      id: card.id,
      question: card.question,
      summary: card.summary,
      tags: card.tags,
      author: card.author,
    }));

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // Send metadata as first SSE event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "meta", relatedCards: relatedCardsSerialized, sessionId: sessionId || null })}\n\n`
          )
        );

        let fullResponse = "";

        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              fullResponse += text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", text })}\n\n`
                )
              );
            }
          }

          // Save query session after stream completes
          if (sessionId) {
            await prisma.querySession.update({
              where: { id: sessionId },
              data: {
                messages: {
                  push: [
                    { role: "user", content: message, timestamp: new Date().toISOString() },
                    { role: "assistant", content: fullResponse, timestamp: new Date().toISOString() },
                  ],
                } as any,
              },
            });
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "done", sessionId })}\n\n`
              )
            );
          } else {
            const newSession = await prisma.querySession.create({
              data: {
                authorId: session.user.id,
                workspaceId: session.user.workspaceId,
                messages: [
                  { role: "user", content: message, timestamp: new Date().toISOString() },
                  { role: "assistant", content: fullResponse, timestamp: new Date().toISOString() },
                ],
              },
            });
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "done", sessionId: newSession.id })}\n\n`
              )
            );
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Stream failed" })}\n\n`
            )
          );
        }

        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
