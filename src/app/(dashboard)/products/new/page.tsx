import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Tobacco / mandi: items are created when you buy — not on a separate form. */
export default function NewProductPage() {
  redirect("/purchases/new");
}
