import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const started = Date.now();

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log(`OK — database connected in ${Date.now() - started}ms`);
} catch (error) {
  console.error(`FAIL after ${Date.now() - started}ms:`, error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
