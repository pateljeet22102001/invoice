import { notFound } from "next/navigation";
import { challanDb } from "@/lib/prisma-challan";
import type { ChallanDetail } from "@/types/models";

export type { ChallanDetail };

export async function getChallanDetail(
  businessId: string,
  challanId: string,
): Promise<ChallanDetail> {
  const challan = await challanDb.findFirst({
    where: { id: challanId, businessId },
    include: {
      customer: true,
      business: true,
      items: {
        include: { product: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!challan) {
    notFound();
  }

  return challan as ChallanDetail;
}
