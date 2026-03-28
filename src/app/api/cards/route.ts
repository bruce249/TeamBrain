import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, answer, summary, tags } = await req.json();

    if (!question || !answer || !summary) {
      return NextResponse.json(
        { error: "question, answer, and summary are required" },
        { status: 400 }
      );
    }

    const normalizedTags = (tags || []).map((t: string) =>
      t.toLowerCase().trim()
    );

    const card = await prisma.knowledgeCard.create({
      data: {
        question,
        answer,
        summary,
        tags: normalizedTags,
        authorId: session.user.id,
        workspaceId: session.user.workspaceId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Also create a feed item so the team sees it
    await prisma.teamFeedItem.create({
      data: {
        cardId: card.id,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error("Create card error:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");

    const where: any = {
      workspaceId: session.user.workspaceId,
    };

    if (tag) {
      where.tags = { has: tag.toLowerCase() };
    }

    if (search) {
      where.OR = [
        { question: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: search.toLowerCase().split(/\s+/) } },
      ];
    }

    const cards = await prisma.knowledgeCard.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Fetch cards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}
