import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2];
const newPassword = process.argv[3] ?? "demo123456";

if (!email) {
  console.error("Usage: node scripts/reset-user-password.mjs <email> [newPassword]");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { business: true },
  });

  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`Password reset for ${user.email} (${user.business.name})`);
  console.log(`New password: ${newPassword}`);
} finally {
  await prisma.$disconnect();
}
