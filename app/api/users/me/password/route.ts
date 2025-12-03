export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth/authOptions";
import { withErrorHandler } from "@utils/withErrorHandler";
import { changePasswordSchema } from "@schemas/userSchema";
import bcrypt from "bcryptjs";

async function putHandler(req: NextRequest) {
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
  const parsed = changePasswordSchema.parse(body);

  // Verify current password
  const isValid = await bcrypt.compare(parsed.currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(parsed.newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: "Mot de passe mis à jour" }, { status: 200 });
}

export const PUT = withErrorHandler(putHandler);
