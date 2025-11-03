export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth/authOptions";
import { withErrorHandler } from "@utils/withErrorHandler";
import { connectEventsSchema } from "@schemas/eventSchema";
import { connectEvents, getEventById, disconnectEvents } from "@services/eventService";

async function postHandler(
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

  // Verify source event belongs to user
  const sourceEvent = await getEventById(params.id, user.id);
  if (!sourceEvent) {
    return NextResponse.json(
      { error: "Source event not found" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const parsed = connectEventsSchema.parse(body);

  // Verify target event belongs to user
  const targetEvent = await getEventById(parsed.targetEventId, user.id);
  if (!targetEvent) {
    return NextResponse.json(
      { error: "Target event not found" },
      { status: 404 }
    );
  }

  const connection = await connectEvents({
    sourceEventId: params.id,
    targetEventId: parsed.targetEventId,
    connectionType: parsed.connectionType,
    order: parsed.order,
  });

  return NextResponse.json({ connection }, { status: 201 });
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

  const body = await req.json();
  const { targetEventId } = body;

  if (!targetEventId) {
    return NextResponse.json(
      { error: "targetEventId is required" },
      { status: 400 }
    );
  }

  await disconnectEvents(params.id, targetEventId);

  return NextResponse.json(
    { message: "Connection deleted" },
    { status: 200 }
  );
}

export const POST = withErrorHandler(postHandler);
export const DELETE = withErrorHandler(deleteHandler);
