import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password, name, workspaceName } = await req.json();

    if (!email || !password || !workspaceName) {
      return NextResponse.json(
        { error: "Email, password, and workspace name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        type: "team",
        users: {
          create: {
            email,
            password: hashedPassword,
            name: name || null,
            role: "OWNER",
          },
        },
      },
      include: { users: true },
    });

    const user = workspace.users[0];

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
