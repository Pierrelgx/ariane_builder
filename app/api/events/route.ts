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

  // Get projectId from query params
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;

  const events = await getEventsByAuthor(user.id, projectId);

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
  console.log("POST /api/events - body:", JSON.stringify(body, null, 2));

  const parsed = createEventSchema.parse(body);
  console.log("POST /api/events - parsed:", JSON.stringify(parsed, null, 2));

  const event = await createEvent({
    ...parsed,
    date: parsed.date || undefined,
    authorId: user.id,
    projectId: parsed.projectId || undefined,
  });

  return NextResponse.json({ event }, { status: 201 });
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
