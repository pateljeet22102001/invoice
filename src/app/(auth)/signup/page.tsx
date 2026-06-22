import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { BRAND } from "@/lib/constants/brand";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your business account"
      subtitle={`Start GST billing, stock, and accounts on ${BRAND.name} — free`}
    >
      <SignupForm />
    </AuthShell>
  );
}
