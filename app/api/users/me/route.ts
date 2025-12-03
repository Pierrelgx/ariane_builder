export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth/authOptions";
import { withErrorHandler } from "@utils/withErrorHandler";

async function deleteHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { prisma } = await import("@db");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Delete user - cascades to projects, events, etc. (via Prisma schema onDelete: Cascade)
  await prisma.user.delete({
    where: { id: user.id },
  });

  return NextResponse.json({ message: "Compte supprimé" }, { status: 200 });
}

export const DELETE = withErrorHandler(deleteHandler);
