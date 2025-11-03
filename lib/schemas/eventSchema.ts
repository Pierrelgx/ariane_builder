import { z } from "zod";
import { ConnectionType } from "@prisma/client";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  date: z.string().datetime().optional().or(z.literal("")),
  positionX: z.number().optional().default(0),
  positionY: z.number().optional().default(0),
});

export const updateEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().max(2000).optional(),
  date: z.string().datetime().optional().or(z.literal("")),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

export const connectEventsSchema = z.object({
  targetEventId: z.string().cuid(),
  connectionType: z.nativeEnum(ConnectionType).default(ConnectionType.LINEAR),
  order: z.number().int().min(0).optional().default(0),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ConnectEventsInput = z.infer<typeof connectEventsSchema>;
