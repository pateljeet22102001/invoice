import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      database: "connected",
      message: "Backend and PostgreSQL database are working.",
    });
  } catch {
    return Response.json(
      {
        status: "error",
        database: "disconnected",
        message: "Cannot connect to PostgreSQL. Run: npm run db:up",
      },
      { status: 503 },
    );
  }
}
