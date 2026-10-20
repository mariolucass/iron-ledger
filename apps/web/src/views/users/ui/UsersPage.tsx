"use client";

import { colors as theme } from "@/shared/config/tokens";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Key,
  Lock,
  Mail,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Layout } from "@/widgets/layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";

// 1. Tema "Cryptix" Integrado

// 2. Tipagens e Dados Mockados
type Role = "SUPERADMIN" | "ADMIN" | "OPERATOR" | "AUDITOR";
type Status = "ACTIVE" | "INACTIVE" | "PENDING";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  mfaEnabled: boolean;
  lastLogin: string;
  department: string;
}

const mockUsers: User[] = [
  {
    id: "usr-0001",
    name: "Mario Lucas",
    email: "mario.lucas@ironledger.com",
    role: "SUPERADMIN",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Há 2 mins",
    department: "Diretoria de Tecnologia",
  },
  {
    id: "usr-0002",
    name: "Admin iron-ledger",
    email: "admin@ironledger.com",
    role: "ADMIN",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Há 1 hora",
    department: "Gestão Global",
  },
  {
    id: "usr-0003",
    name: "Pedro Ygor",
    email: "pedro.ygor@ironledger.com",
    role: "OPERATOR",
    status: "ACTIVE",
    mfaEnabled: false,
    lastLogin: "Há 3 horas",
    department: "Operações de Estoque",
  },
  {
    id: "usr-0004",
    name: "Luiz Felipe",
    email: "luiz.felipe@ironledger.com",
    role: "AUDITOR",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLogin: "Ontem",
    department: "Compliance e Auditoria",
  },
  {
    id: "usr-0005",
    name: "Gerente Nike",
    email: "operacoes@nike.com",
    role: "OPERATOR",
    status: "PENDING",
    mfaEnabled: false,
    lastLogin: "Nunca",
    department: "Parceiro Externo (B2B)",
  },
];

const loginHistory = [
  {
    ip: "10.0.1.42",
    location: "Lisboa, PT",
    device: "MacBook Pro",
    status: "SUCCESS",
    date: "2026-06-09 10:12:00",
  },
  {
    ip: "10.0.1.42",
    location: "Lisboa, PT",
    device: "MacBook Pro",
    status: "SUCCESS",
    date: "2026-06-08 09:00:15",
  },
  {
    ip: "192.168.1.10",
    location: "Lisboa, PT",
    device: "iPhone 13",
    status: "FAILED",
    date: "2026-06-07 23:45:10",
  },
];

// Utilitários de Design
const getRoleConfig = (role: Role) => {
  switch (role) {
    case "SUPERADMIN":
      return {
        color: theme.accent,
        bg: theme.accentGlow,
        border: `${theme.accent}40`,
      };
    case "ADMIN":
      return {
        color: theme.info,
        bg: theme.infoGlow,
        border: `${theme.info}40`,
      };
    case "OPERATOR":
      return {
        color: theme.warning,
        bg: theme.warningGlow,
        border: `${theme.warning}40`,
      };
    case "AUDITOR":
      return {
        color: theme.textSecondary,
        bg: theme.surfaceHover,
        border: theme.border,
      };
  }
};

const getStatusConfig = (status: Status) => {
  switch (status) {
    case "ACTIVE":
      return { color: theme.accent, text: "Ativo" };
    case "INACTIVE":
      return { color: theme.danger, text: "Inativo" };
    case "PENDING":
      return { color: theme.warning, text: "Pendente" };
  }
};

// 3. Sub-componentes
function UserDrawer({ user, onClose }: { user: User; onClose: () => void }) {
  const roleConfig = getRoleConfig(user.role);
  const statusConfig = getStatusConfig(user.status);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          animation: "fade-in 0.2s ease-out",
        }}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 500,
          background: theme.bg,
          borderLeft: `1px solid ${theme.border}`,
          padding: 32,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          animation: "slide-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header Profile */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: theme.surfaceHover,
                border: `1px solid ${theme.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserIcon size={28} color={theme.textSecondary} />
            </div>
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 20,
                  fontWeight: 700,
                  color: theme.textPrimary,
                }}
              >
                {user.name}
              </h2>
              <div
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Mail size={12} /> {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.textSecondary,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = theme.textPrimary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = theme.textSecondary;
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Security & Access Grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Privilégios (Role)
            </div>
            <span
              style={{
                background: roleConfig.bg,
                color: roleConfig.color,
                border: `1px solid ${roleConfig.border}`,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              {user.role}
            </span>
          </div>

          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Estado
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: statusConfig.color,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusConfig.color,
                  boxShadow: `0 0 8px ${statusConfig.color}80`,
                }}
              />
              {statusConfig.text}
            </div>
          </div>

          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              MFA / 2FA
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: user.mfaEnabled ? theme.textPrimary : theme.warning,
              }}
            >
              {user.mfaEnabled ? (
                <>
                  <ShieldCheck size={16} color={theme.accent} /> Ativo
                </>
              ) : (
                <>
                  <AlertTriangle size={16} /> Desativado
                </>
              )}
            </div>
          </div>

          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Departamento
            </div>
            <div
              style={{
                fontSize: 13,
                color: theme.textPrimary,
                fontWeight: 500,
              }}
            >
              {user.department}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: "10px",
              color: theme.textPrimary,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = theme.surfaceHover;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Key size={14} /> Reset Password
          </button>
          <button
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${theme.danger}40`,
              borderRadius: 8,
              padding: "10px",
              color: theme.danger,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = theme.dangerGlow;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {user.status === "ACTIVE" ? (
              <>
                <Lock size={14} /> Suspender
              </>
            ) : (
              <>
                <CheckCircle size={14} /> Ativar
              </>
            )}
          </button>
        </div>

        {/* Login History */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: theme.textSecondary,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Histórico de Autenticação
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {loginHistory.map((log, i) => (
              <div
                key={i}
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    {log.status === "SUCCESS" ? (
                      <CheckCircle size={12} color={theme.accent} />
                    ) : (
                      <XCircle size={12} color={theme.danger} />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.textPrimary,
                      }}
                    >
                      {log.device}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.textSecondary,
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {log.ip} · {log.location}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: theme.textSecondary }}>
                  {log.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Componente Principal
export function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [drawerUser, setDrawerUser] = useState<User | null>(null);

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });


  return (
    <Layout title="Gestão de Utilizadores (IAM)">
      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: theme.accentGlow,
            }}
          >
            <Users size={20} color={theme.accent} />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Total Utilizadores
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: theme.textPrimary,
              }}
            >
              {mockUsers.length}
            </div>
          </div>
        </div>
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: theme.infoGlow,
            }}
          >
            <ShieldCheck size={20} color={theme.info} />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Admins Ativos
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: theme.textPrimary,
              }}
            >
              {
                mockUsers.filter(
                  (u) => u.role.includes("ADMIN") && u.status === "ACTIVE",
                ).length
              }
            </div>
          </div>
        </div>
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: theme.warningGlow,
            }}
          >
            <Clock size={20} color={theme.warning} />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Convites Pendentes
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: theme.textPrimary,
              }}
            >
              {mockUsers.filter((u) => u.status === "PENDING").length}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: "0 14px",
              flex: 1,
              maxWidth: 360,
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.border;
            }}
          >
            <Search size={14} color={theme.textSecondary} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar por nome ou email..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: theme.textPrimary,
                fontSize: 13,
                width: "100%",
                padding: "10px 0",
              }}
            />
          </div>

          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
            <SelectTrigger className="w-[180px]" aria-label="Filtrar por função">
              <Filter size={14} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Funções</SelectItem>
              <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="OPERATOR">Operador</SelectItem>
              <SelectItem value="AUDITOR">Auditor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: theme.accent,
            color: "#000",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 0 16px ${theme.accentGlow}`,
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.transform = "translateY(-2px)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          <Plus size={16} /> Novo Utilizador
        </button>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: "900px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${theme.border}`,
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                {[
                  "Utilizador",
                  "Privilégios (Role)",
                  "Departamento",
                  "Estado",
                  "MFA",
                  "Último Acesso",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "16px 24px",
                      textAlign: i === 6 ? "right" : "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme.textSecondary,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const rConfig = getRoleConfig(u.role);
                const sConfig = getStatusConfig(u.status);

                return (
                  <tr
                    key={u.id}
                    onClick={() => setDrawerUser(u)}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      cursor: "pointer",
                      transition: "background 0.15s",
                      opacity: u.status === "INACTIVE" ? 0.6 : 1,
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = theme.surfaceHover)
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "16px 24px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: theme.bg,
                            border: `1px solid ${theme.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: theme.textSecondary,
                            }}
                          >
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: theme.textPrimary,
                              marginBottom: 2,
                            }}
                          >
                            {u.name}
                          </div>
                          <div
                            style={{ fontSize: 12, color: theme.textSecondary }}
                          >
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          background: rConfig.bg,
                          color: rConfig.color,
                          border: `1px solid ${rConfig.border}`,
                          borderRadius: 999,
                          padding: "2px 10px",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textSecondary,
                      }}
                    >
                      {u.department}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          color: sConfig.color,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: sConfig.color,
                            boxShadow: `0 0 6px ${sConfig.color}`,
                          }}
                        />
                        {sConfig.text}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      {u.mfaEnabled ? (
                        <ShieldCheck size={16} color={theme.accent} />
                      ) : (
                        <AlertTriangle size={16} color={theme.warning} />
                      )}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      {u.lastLogin}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button
                        style={{
                          background: "transparent",
                          border: "none",
                          color: theme.textSecondary,
                          cursor: "pointer",
                          padding: 4,
                        }}
                        onClick={(e) => {
                          e.stopPropagation(); /* Abrir menu de contexto */
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerUser && (
        <UserDrawer user={drawerUser} onClose={() => setDrawerUser(null)} />
      )}
    </Layout>
  );
}
