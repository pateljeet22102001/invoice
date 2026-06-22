import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { BRAND } from "@/lib/constants/brand";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle={`Sign in to your ${BRAND.name} account`}
    >
      <LoginForm />
    </AuthShell>
  );
}
