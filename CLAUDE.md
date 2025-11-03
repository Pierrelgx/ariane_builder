# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ariane World Builder is a Next.js 14 application for building interactive timelines with branching narratives (including time travel). It uses PostgreSQL with Prisma ORM, NextAuth for authentication, and runs in Docker containers.

## Development Commands

### Initial Setup
- **macOS/Linux/WSL**: `./scripts/setup.sh` or `make setup`
- **Windows (PowerShell)**: `.\scripts\setup.ps1` (run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` first)

The setup script creates `.env`, builds Docker containers, starts PostgreSQL, and runs Prisma migrations.

### Common Commands
- `npm run dev` - Start Next.js dev server (port 3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint with custom config
- `npm run seed` - Seed database with test data (inside Docker: `make seed`)

### Docker Operations
- `make start` - Start stopped containers
- `make stop` - Stop running containers
- `make reset` - Full teardown and setup
- `make logs` - View app container logs
- `make clear` - Stop and remove containers

### Prisma
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma studio` - Open Prisma Studio (port 5555)
- `npx prisma generate` - Generate Prisma Client

## Architecture

### Path Aliases
The project uses extensive path aliases (defined in [tsconfig.json](tsconfig.json) and [next.config.js](next.config.js)):
- `@db` → `lib/db/prisma` (Prisma client singleton)
- `@schemas/*` → `lib/schemas/*` (Zod validation schemas)
- `@services/*` → `lib/services/*` (Business logic)
- `@utils/*` → `lib/utils/*` (Helper functions)
- `@types/*` → `lib/types/*` (TypeScript types)
- `@tv/*` → `lib/tv/*` (Tailwind Variants components)
- `@components/*` → `components/*`

### Database Models

**Event System** (core feature):
- `Event` - Timeline events with JSON data, connected in a graph structure
- `EventConnection` - Edges between events with order and type (LINEAR or TIMETRAVEL)
- Events can have multiple next/prev connections, enabling branching timelines

**Authentication** (NextAuth):
- `User` - User accounts with bcrypt-hashed passwords
- `Account`, `Session`, `VerificationToken` - NextAuth adapter models
- `Authenticator` - Optional WebAuthn support

### Directory Structure

**[app/](app/)** - Next.js App Router pages and API routes
- `app/api/register/route.ts` - User registration endpoint
- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `app/dashboard/page.tsx` - Protected dashboard page

**[lib/](lib/)** - Shared application code
- `lib/services/` - Business logic (e.g., `userService.ts` for registration)
- `lib/schemas/` - Zod validation schemas
- `lib/utils/` - Error handlers, Zod/Prisma error parsers
- `lib/types/` - Custom types (e.g., `TimelineGraph.ts` for event graph traversal)
- `lib/tv/` - Tailwind Variants for reusable component styles

**[components/](components/)** - React components
- `components/forms/` - LoginForm, RegisterForm
- `components/buttons/` - LoginButton, RegisterButton, SignOutButton
- `components/wrapper/` - Providers (e.g., SessionProvider)

**[prisma/](prisma/)** - Database schema and migrations
- `prisma/schema.prisma` - Prisma schema with Event graph models
- `prisma/seed.ts` - Database seeding script

### Middleware

[middleware.ts](middleware.ts) implements rate limiting using Upstash Redis:
- Protects `/api/register` and `/api/login` routes
- 5 requests per minute per IP
- Gracefully degrades if Upstash env vars are missing

### Error Handling

The codebase uses a layered error handling approach:
- `lib/utils/withErrorHandler.ts` - Higher-order function wrapper for API routes
- `lib/utils/handleZodError.ts` - Transforms Zod validation errors
- `lib/utils/handlePrismaError.ts` - Handles Prisma errors (unique constraints, etc.)
- Custom errors like `UserAlreadyExistsError` for specific business logic failures

### Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection (default: `postgresql://postgres:postgres@db:5432/mydb`)
- `NEXTAUTH_SECRET` - NextAuth JWT secret (default: `my-super-secret`)

Optional:
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL (for rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token

## Key Patterns

1. **Graph-based Event System**: Events are nodes in a directed graph. The `TimelineGraph` class (in `lib/types/TimelineGraph.ts`) builds an in-memory representation from database events, maintaining ordered `nexts` arrays for traversal.

2. **Server Actions**: The app uses Next.js Server Actions for form submissions and mutations.

3. **Validation**: Zod schemas validate all user inputs before processing. Input sanitization uses the `validator` library.

4. **Authentication**: NextAuth with credentials provider (bcrypt password hashing). The `auth.ts` file shows commented-out Google provider config.

5. **Database Access**: All database operations use the singleton Prisma client from `@db`. In development, query logging is enabled.
