import { Badge } from "@/shared/ui/kit/badge";
import type { UserStatus } from "../model/types";

export const userStatusLabel: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
};

const variant = { ACTIVE: "success", INACTIVE: "secondary", SUSPENDED: "warning" } as const satisfies Record<UserStatus, string>;

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={variant[status]}>{userStatusLabel[status]}</Badge>;
}
