"use client";

import { Plus, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import {
  USER_STATUSES,
  UserStatusBadge,
  userApi,
  userStatusLabel,
  type RoleSummary,
  type UserStatus,
  type UserSummary,
} from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";
import { useDebounced } from "@/shared/lib/use-debounced";
import { useRemoteList } from "@/shared/lib/use-remote-list";
import {
  DataTable,
  EmptyState,
  FilterBar,
  ListError,
  PageHeader,
  Pagination,
  SearchField,
  SelectField,
  primaryActionClass,
  type Column,
} from "@/shared/ui/data-list";
import { Badge } from "@/shared/ui/kit/badge";
import { Layout } from "@/widgets/layout";

const PAGE_SIZE = 20;
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const columns: Column<UserSummary>[] = [
  {
    id: "user",
    header: "Usuário",
    cell: (user) => (
      <span className="grid min-w-0">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-[13px] font-normal text-ink/55">{user.email}</span>
      </span>
    ),
  },
  {
    id: "roles",
    header: "Papéis",
    cell: (user) => (
      <div className="flex flex-wrap gap-1.5">
        {user.roles.length ? user.roles.map((name) => <Badge key={name} variant="outline">{name}</Badge>) : <span className="text-ink/50">Sem papel</span>}
      </div>
    ),
  },
  { id: "status", header: "Situação", cell: (user) => <UserStatusBadge status={user.status} /> },
  { id: "mfa", header: "2FA", hideBelow: "md", className: "text-ink/60", cell: (user) => (user.mfaEnabled ? "Ativo" : "—") },
  {
    id: "lastLogin",
    header: "Último acesso",
    hideBelow: "md",
    className: "whitespace-nowrap text-ink/60",
    cell: (user) => (user.lastLoginAt ? dateTime.format(new Date(user.lastLoginAt)) : "Nunca"),
  },
];

const statusOptions = [
  { value: "", label: "Todas as situações" },
  ...USER_STATUSES.map((value) => ({ value, label: userStatusLabel[value] })),
];

export function UsersPage({ initial, initialRoles }: {
  initial: { items: UserSummary[]; total: number };
  initialRoles: RoleSummary[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [roles] = useState<RoleSummary[]>(initialRoles);
  const q = useDebounced(search.trim());

  const { items, total, loading, error, refresh } = useRemoteList(
    () => withSession(userApi.list({ q: q || undefined, status: status || undefined, role: role || undefined, page, pageSize: PAGE_SIZE })),
    [q, status, role, page], initial,
  );

  const filtered = Boolean(q || status || role);
  const reset = <T,>(set: (value: T) => void) => (value: T) => { set(value); setPage(1); };

  return (
    <Layout title="Usuários">
      <PageHeader
        title="Usuários"
        description="Contas de acesso e papéis do workspace."
        actions={<Link href="/users/new" className={primaryActionClass}><Plus size={17} aria-hidden /> Novo usuário</Link>}
      />
      <nav aria-label="Administração de usuários" className="mb-5 flex flex-wrap gap-2 text-sm">
        <Link href="/users/roles" className="rounded-lg border border-border px-3 py-2 hover:text-primary">Papéis</Link>
        <Link href="/users/permissions" className="rounded-lg border border-border px-3 py-2 hover:text-primary">Permissões</Link>
        <Link href="/users/invitations" className="rounded-lg border border-border px-3 py-2 hover:text-primary">Convites</Link>
        <Link href="/users/audit-log" className="rounded-lg border border-border px-3 py-2 hover:text-primary">Auditoria</Link>
      </nav>

      <FilterBar columns="md:grid-cols-[1fr_200px_240px]">
        <SearchField value={search} onChange={reset(setSearch)} placeholder="Buscar por nome ou e-mail" label="Buscar usuários" />
        <SelectField label="Filtrar por situação" value={status} onChange={reset((value: string) => setStatus(value as UserStatus | ""))} options={statusOptions} />
        <SelectField
          label="Filtrar por papel"
          value={role}
          onChange={reset(setRole)}
          options={[{ value: "", label: "Todos os papéis" }, ...roles.map((r) => ({ value: r.name, label: `${r.name} (${r.userCount})` }))]}
        />
      </FilterBar>

      {error && <ListError message={error} onRetry={() => void refresh()} />}

      <DataTable
        caption="Lista de usuários"
        columns={columns}
        rows={items}
        getRowKey={(user) => user.id}
        rowHref={(user) => `/users/${user.id}` as Route}
        loading={loading}
        minWidth={760}
        empty={!error && <EmptyState icon={Users} message={filtered ? "Nenhum usuário encontrado para esses filtros." : "Nenhum usuário cadastrado."} />}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun={["usuário", "usuários"]} />
    </Layout>
  );
}
