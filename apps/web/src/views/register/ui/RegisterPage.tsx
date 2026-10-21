import { RegisterFormWrapper } from "@/features/sign-up";
import { AuthShell } from "@/widgets/auth-shell";

export function RegisterPage() {
  return (
    <AuthShell labelledBy="register-title">
      <RegisterFormWrapper />
    </AuthShell>
  );
}
