import { prisma } from "@db";
import validator from "validator";

interface CreateProjectInput {
  name: string;
  userId: string;
}

interface UpdateProjectInput {
  name: string;
}

function sanitizeName(name: string): string {
  return validator.escape(validator.trim(name));
}

export async function createProject(input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      name: sanitizeName(input.name),
      userId: input.userId,
    },
    include: {
      _count: {
        select: { events: true },
      },
    },
  });

  return project;
}

export async function getProjectsByUser(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    include: {
      _count: {
        select: { events: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects;
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      _count: {
        select: { events: true },
      },
    },
  });

  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput
) {
  const project = await prisma.project.updateMany({
    where: {
      id: projectId,
      userId,
    },
    data: {
      name: sanitizeName(input.name),
    },
  });

  if (project.count === 0) {
    throw new Error("Project not found or unauthorized");
  }

  return getProjectById(projectId, userId);
}

export async function deleteProject(projectId: string, userId: string) {
  const deleted = await prisma.project.deleteMany({
    where: {
      id: projectId,
      userId,
    },
  });

  if (deleted.count === 0) {
    throw new Error("Project not found or unauthorized");
  }

  return { success: true };
}
