export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth/authOptions";
import { withErrorHandler } from "@utils/withErrorHandler";
import { createProjectSchema } from "@schemas/projectSchema";
import { createProject, getProjectsByUser } from "@services/projectService";

async function getHandler(req: NextRequest) {
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

  const projects = await getProjectsByUser(user.id);

  return NextResponse.json({ projects }, { status: 200 });
}

async function postHandler(req: NextRequest) {
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

  const body = await req.json();
  const parsed = createProjectSchema.parse(body);

  const project = await createProject({
    name: parsed.name,
    userId: user.id,
  });

  return NextResponse.json({ project }, { status: 201 });
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
