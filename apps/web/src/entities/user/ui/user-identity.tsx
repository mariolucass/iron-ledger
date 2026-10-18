import type { User } from "../model/types";

export function UserIdentity({ user }: { user: Pick<User, "name" | "email"> }) {
  return <span className="inline-flex min-w-0 flex-col">
    <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
  </span>;
}
