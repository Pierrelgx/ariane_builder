export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth/authOptions";
import { withErrorHandler } from "@utils/withErrorHandler";
import { createEventSchema } from "@schemas/eventSchema";
import { createEvent, getEventsByAuthor } from "@services/eventService";

async function getHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user from session
  const { prisma } = await import("@db");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const events = await getEventsByAuthor(user.id);

  return NextResponse.json({ events }, { status: 200 });
}

async function postHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user from session
  const { prisma } = await import("@db");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createEventSchema.parse(body);

  const event = await createEvent({
    ...parsed,
    date: parsed.date || undefined,
    authorId: user.id,
  });

  return NextResponse.json({ event }, { status: 201 });
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
