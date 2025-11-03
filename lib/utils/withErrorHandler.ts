import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { handleZodError } from "@utils/handleZodError";
import { handlePrismaError } from "@utils//handlePrismaError";
import { UserAlreadyExistsError } from "@lib/types/UserAlreadyExistsError";

function handleError(error: unknown): NextResponse {
  if (error instanceof UserAlreadyExistsError) {
    return NextResponse.json(error.message, { status: 409 });
  }

  if (error instanceof ZodError) {
    const result = handleZodError(error);
    return NextResponse.json(result.body, { status: result.status });
  }

  const prismaHandled = handlePrismaError(error);
  if (prismaHandled) {
    return NextResponse.json(prismaHandled.body, {
      status: prismaHandled.status,
    });
  }

  console.error("Unhandled error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

// Overload signatures
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;

export function withErrorHandler<T>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>
): (req: NextRequest, context: T) => Promise<NextResponse>;

// Implementation
export function withErrorHandler<T = never>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async function (req: NextRequest, context?: T): Promise<NextResponse> {
    try {
      return await handler(req, context as any);
    } catch (error) {
      return handleError(error);
    }
  };
}
