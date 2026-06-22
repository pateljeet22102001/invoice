import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { email: { contains: "testing", mode: "insensitive" } },
        { name: { contains: "demo", mode: "insensitive" } },
      ],
    },
    include: { user: true },
  });

  console.log(JSON.stringify(businesses, null, 2));

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "testing", mode: "insensitive" } },
        { email: { contains: "demo", mode: "insensitive" } },
      ],
    },
    include: { business: { select: { name: true, email: true } } },
  });

  console.log("--- USERS ---");
  console.log(JSON.stringify(users, null, 2));
} finally {
  await prisma.$disconnect();
}
