import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { BRAND } from "@/lib/constants/brand";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle={`Reset your ${BRAND.name} account password`}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
