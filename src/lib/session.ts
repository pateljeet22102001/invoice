import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireBusiness() {
  const session = await auth();

  if (!session?.user?.businessId) {
    redirect("/login");
  }

  return {
    userId: session.user.id,
    businessId: session.user.businessId,
    userName: session.user.name ?? "User",
    businessName: session.user.businessName,
    email: session.user.email ?? "",
  };
}
