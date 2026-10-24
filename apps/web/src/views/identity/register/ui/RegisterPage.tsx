import { RegisterFormWrapper } from "@/features/identity/sign-up";
import { AuthShell } from "@/widgets/auth-shell";

export function RegisterPage() {
  return (
    <AuthShell labelledBy="register-title">
      <RegisterFormWrapper />
    </AuthShell>
  );
}
