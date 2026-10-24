import { LoginFormWrapper } from "@/features/identity/sign-in";
import { AuthShell } from "@/widgets/auth-shell";

export function LoginPage() {
  return (
    <AuthShell labelledBy="login-title">
      <LoginFormWrapper />
    </AuthShell>
  );
}
