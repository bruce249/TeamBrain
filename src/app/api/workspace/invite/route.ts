import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can invite
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only workspace owners and admins can invite members" },
        { status: 403 }
      );
    }

    const { email, role = "MEMBER" } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!["MEMBER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be MEMBER or ADMIN" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create user with a temporary password (they'll need to reset it)
    const tempPassword = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as "MEMBER" | "ADMIN",
        workspaceId: session.user.workspaceId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // In production, you'd send an email with a password-reset link here
    return NextResponse.json(
      {
        user,
        message: `Invited ${email} to the workspace. They will need to set a password.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}
