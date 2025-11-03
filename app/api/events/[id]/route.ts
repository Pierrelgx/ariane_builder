export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth/authOptions";
import { withErrorHandler } from "@utils/withErrorHandler";
import { updateEventSchema } from "@schemas/eventSchema";
import { getEventById, updateEvent, deleteEvent } from "@services/eventService";

async function getHandler(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@db");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const event = await getEventById(params.id, user.id);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event }, { status: 200 });
}

async function putHandler(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@db");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateEventSchema.parse(body);

  const event = await updateEvent(params.id, user.id, {
    ...parsed,
    date: parsed.date || undefined,
  });

  return NextResponse.json({ event }, { status: 200 });
}

async function deleteHandler(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@db");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await deleteEvent(params.id, user.id);

  return NextResponse.json({ message: "Event deleted" }, { status: 200 });
}

export const GET = withErrorHandler(getHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
