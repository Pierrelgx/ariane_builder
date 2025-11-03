import { prisma } from "@db";
import { ConnectionType } from "@prisma/client";
import validator from "validator";

interface CreateEventInput {
  title: string;
  description?: string;
  date?: string;
  positionX?: number;
  positionY?: number;
  authorId: string;
}

interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  positionX?: number;
  positionY?: number;
}

interface ConnectEventsInput {
  sourceEventId: string;
  targetEventId: string;
  connectionType?: ConnectionType;
  order?: number;
}

function sanitizeEventInput(input: CreateEventInput | UpdateEventInput) {
  const sanitized: any = {};

  if ('title' in input && input.title) {
    sanitized.title = validator.escape(validator.trim(input.title));
  }

  if ('description' in input && input.description) {
    sanitized.description = validator.escape(validator.trim(input.description));
  }

  if ('date' in input && input.date) {
    sanitized.date = new Date(input.date);
  }

  if ('positionX' in input && typeof input.positionX === 'number') {
    sanitized.positionX = input.positionX;
  }

  if ('positionY' in input && typeof input.positionY === 'number') {
    sanitized.positionY = input.positionY;
  }

  return sanitized;
}

export async function createEvent(input: CreateEventInput) {
  const sanitized = sanitizeEventInput(input);

  const event = await prisma.event.create({
    data: {
      title: sanitized.title,
      description: sanitized.description,
      date: sanitized.date,
      positionX: sanitized.positionX ?? 0,
      positionY: sanitized.positionY ?? 0,
      authorId: input.authorId,
    },
    include: {
      nexts: {
        include: {
          next: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
      prevs: {
        include: {
          prev: true,
        },
      },
    },
  });

  return event;
}

export async function getEventsByAuthor(authorId: string) {
  const events = await prisma.event.findMany({
    where: {
      authorId,
    },
    include: {
      nexts: {
        include: {
          next: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
      prevs: {
        include: {
          prev: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return events;
}

export async function getEventById(eventId: string, authorId: string) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      authorId,
    },
    include: {
      nexts: {
        include: {
          next: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
      prevs: {
        include: {
          prev: true,
        },
      },
    },
  });

  return event;
}

export async function updateEvent(eventId: string, authorId: string, input: UpdateEventInput) {
  const sanitized = sanitizeEventInput(input);

  const event = await prisma.event.updateMany({
    where: {
      id: eventId,
      authorId,
    },
    data: sanitized,
  });

  if (event.count === 0) {
    throw new Error("Event not found or unauthorized");
  }

  return getEventById(eventId, authorId);
}

export async function deleteEvent(eventId: string, authorId: string) {
  const deleted = await prisma.event.deleteMany({
    where: {
      id: eventId,
      authorId,
    },
  });

  if (deleted.count === 0) {
    throw new Error("Event not found or unauthorized");
  }

  return { success: true };
}

export async function connectEvents(input: ConnectEventsInput) {
  const { sourceEventId, targetEventId, connectionType, order } = input;

  // Check if connection already exists
  const existing = await prisma.eventConnection.findFirst({
    where: {
      prevId: sourceEventId,
      nextId: targetEventId,
    },
  });

  if (existing) {
    throw new Error("Connection already exists");
  }

  const connection = await prisma.eventConnection.create({
    data: {
      prevId: sourceEventId,
      nextId: targetEventId,
      type: connectionType ?? ConnectionType.LINEAR,
      order: order ?? 0,
    },
    include: {
      next: true,
      prev: true,
    },
  });

  return connection;
}

export async function disconnectEvents(sourceEventId: string, targetEventId: string) {
  const deleted = await prisma.eventConnection.deleteMany({
    where: {
      prevId: sourceEventId,
      nextId: targetEventId,
    },
  });

  if (deleted.count === 0) {
    throw new Error("Connection not found");
  }

  return { success: true };
}
