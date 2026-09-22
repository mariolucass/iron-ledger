"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Search,
  Settings,
  TrendingUp,
  User,
  Users,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ease2, spring1, spring4 } from "@/shared/lib/animation";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const theme = {
  bg: "#080808",
  surface: "rgba(255,255,255,0.03)",
  surfaceElevated: "rgba(255,255,255,0.055)",
  surfaceHover: "rgba(255,255,255,0.07)",
  surfaceActive: "rgba(255,255,255,0.09)",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.13)",
  textPrimary: "#F5F5F7",
  textSecondary: "#86868B",
  textTertiary: "#48484A",
  accent: "#00E5A0",
  accentDark: "#00B37E",
  accentSoft: "rgba(0,229,160,0.10)",
  accentGlow: "rgba(0,229,160,0.05)",
  danger: "#FF453A",
  dangerSoft: "rgba(255,69,58,0.12)",
  warning: "#F5A623",
  purple: "#A78BFA",
};

const SIDEBAR_EXPANDED = 252;
const SIDEBAR_COLLAPSED = 64;

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  section: string;
  badge?: number;
  shortcut?: string;
}

// ─── Navigation Config ────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    section: "Principal",
    shortcut: "⌘1",
  },
  {
    icon: Package,
    label: "Estoque",
    path: "/inventory",
    section: "Principal",
    shortcut: "⌘2",
  },
  {
    icon: Warehouse,
    label: "Armazéns",
    path: "/warehouses",
    section: "Principal",
    shortcut: "⌘3",
  },
  {
    icon: ArrowLeftRight,
    label: "Transações",
    path: "/transactions",
    section: "Principal",
    shortcut: "⌘4",
  },
  {
    icon: ScrollText,
    label: "Log de Auditoria",
    path: "/audit-log",
    section: "Análises",
    shortcut: "⌘5",
  },
  {
    icon: TrendingUp,
    label: "Previsões",
    path: "/forecasting",
    section: "Análises",
    shortcut: "⌘6",
  },
  {
    icon: BarChart3,
    label: "Relatórios",
    path: "/reports",
    section: "Análises",
    shortcut: "⌘7",
  },
  {
    icon: Bell,
    label: "Alertas",
    path: "/alerts",
    section: "Análises",
    shortcut: "⌘8",
    badge: 3,
  },
  {
    icon: Users,
    label: "Usuários",
    path: "/users",
    section: "Sistema",
    shortcut: "⌘9",
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/settings",
    section: "Sistema",
  },
  {
    icon: BookOpen,
    label: "Design System",
    path: "/design-system",
    section: "Sistema",
  },
];

const navSections = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
  if (!acc[item.section]) acc[item.section] = [];
  acc[item.section].push(item);
  return acc;
}, {});

// ─── Path → Breadcrumb label map ──────────────────────────────────────────────
const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  inventory: "Estoque",
  warehouses: "Armazéns",
  transactions: "Transações",
  "audit-log": "Log de Auditoria",
  forecasting: "Previsões",
  reports: "Relatórios",
  alerts: "Alertas",
  users: "Usuários",
  settings: "Configurações",
  "design-system": "Design System",
};

// ─── Mock notifications ───────────────────────────────────────────────────────
const mockNotifications = [
  {
    id: 1,
    icon: Bell,
    color: theme.danger,
    title: "Alerta Crítico",
    body: "Nike Air Zoom abaixo do mínimo — Loja Centro",
    time: "há 2 min",
    unread: true,
  },
  {
    id: 2,
    icon: CheckCircle2,
    color: theme.accent,
    title: "Transação Confirmada",
    body: "TXN-00483921 finalizada com sucesso",
    time: "há 5 min",
    unread: true,
  },
  {
    id: 3,
    icon: Zap,
    color: theme.warning,
    title: "Previsão Atualizada",
    body: "Modelo ML re-treinado — precisão 94,2%",
    time: "há 18 min",
    unread: false,
  },
];

// ─── Live clock hook ─────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Recent pages hook (sessionStorage) ──────────────────────────────────────
function useRecentPages() {
  const pathname = usePathname();

  useEffect(() => {
    const raw = sessionStorage.getItem("il_recent_paths") ?? "[]";
    const prev: string[] = JSON.parse(raw);
    const next = [
      pathname,
      ...prev.filter((p) => p !== pathname),
    ].slice(0, 5);
    sessionStorage.setItem("il_recent_paths", JSON.stringify(next));
  }, [pathname]);

  const get = (): NavItem[] => {
    const raw = sessionStorage.getItem("il_recent_paths") ?? "[]";
    const paths: string[] = JSON.parse(raw);
    return paths
      .map((p) => navItems.find((n) => n.path === p))
      .filter(Boolean) as NavItem[];
  };

  return { get };
}

// ─── Floating Tooltip (collapsed sidebar) ────────────────────────────────────
function NavTooltip({ label, visible }: { label: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -8, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -6, scale: 0.94 }}
          transition={{ duration: 0.15, ease: ease2 }}
          style={{
            position: "absolute",
            left: "calc(100% + 12px)",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 200,
            background: "#1A1A1A",
            border: `1px solid ${theme.borderStrong}`,
            borderRadius: 8,
            padding: "6px 11px",
            fontSize: 12.5,
            fontWeight: 600,
            color: theme.textPrimary,
            whiteSpace: "nowrap",
            fontFamily: "var(--font-manrope)",
            letterSpacing: "-0.01em",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          {label}
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              left: -5,
              top: "50%",
              transform: "translateY(-50%)",
              width: 8,
              height: 8,
              background: "#1A1A1A",
              border: `1px solid ${theme.borderStrong}`,
              borderRight: "none",
              borderTop: "none",
              rotate: "45deg",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Sidebar Component ────────────────────────────────────────────────────────
function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  onNavigate,
}: {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes pulse-status {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,229,160,0.4); }
          70%       { box-shadow: 0 0 0 6px rgba(0,229,160,0); }
        }
        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer-logo {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .il-nav-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: ${theme.textSecondary};
          cursor: pointer;
          text-align: left;
          font-size: 13.5px;
          font-weight: 500;
          letter-spacing: -0.01em;
          position: relative;
          font-family: var(--font-manrope);
          transition: color 0.15s ease;
          overflow: visible;
        }
        .il-nav-btn:hover { color: ${theme.textPrimary}; }
        .il-nav-btn.active { color: ${theme.accent}; }

        .il-section-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: ${theme.textTertiary};
          text-transform: uppercase;
          padding: 0 12px;
          margin-top: 4px;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          animation: fadeSlideIn 0.2s ease forwards;
        }

        .il-collapse-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid ${theme.border};
          border-radius: 10px;
          color: ${theme.textTertiary};
          cursor: pointer;
          padding: 8px 0;
          transition: all 0.18s ease;
          font-family: var(--font-manrope);
        }
        .il-collapse-btn:hover {
          border-color: ${theme.borderStrong};
          color: ${theme.textSecondary};
          background: ${theme.surfaceHover};
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.borderStrong}; }
      `}</style>

      <motion.aside
        className={`il-sidebar${mobileOpen ? " is-mobile-open" : ""}`}
        animate={{ width, minWidth: width }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{
          background: "rgba(8,8,8,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: `1px solid ${theme.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 20,
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{
            height: 60,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: `1px solid ${theme.border}`,
            gap: 10,
            flexShrink: 0,
            cursor: "pointer",
          }}
          onClick={() => router.push("/")}
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={spring4}
            src="/logo.png"
            alt="Iron Ledger"
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              flexShrink: 0,
              objectFit: "contain",
            }}
          />

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                key="logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: ease2 }}
                style={{ overflow: "hidden", flexShrink: 0 }}
              >
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: theme.textPrimary,
                    letterSpacing: "-0.035em",
                    whiteSpace: "nowrap",
                    lineHeight: 1.15,
                  }}
                >
                  Iron Ledger
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: theme.accent,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  GESTÃO OPERACIONAL
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Navigation ── */}
        <nav
          style={{
            flex: 1,
            padding: "10px 8px",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {Object.entries(navSections).map(([section, items], sIdx) => (
            <div key={section} style={{ marginTop: sIdx > 0 ? 14 : 0 }}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    key={`section-${section}`}
                    className="il-section-label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {section}
                  </motion.div>
                )}
              </AnimatePresence>
              {collapsed && sIdx > 0 && (
                <div
                  style={{
                    height: 1,
                    background: theme.border,
                    margin: "6px 8px",
                  }}
                />
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {items.map(({ icon: Icon, label, path, badge, shortcut }) => {
                  const active =
                    pathname === path ||
                    (path !== "/dashboard" &&
                      pathname.startsWith(path));

                  return (
                    <div
                      key={path}
                      style={{ position: "relative" }}
                      onMouseEnter={() => setHoveredPath(path)}
                      onMouseLeave={() => setHoveredPath(null)}
                    >
                      <button
                        className={`il-nav-btn${active ? " active" : ""}`}
                        onClick={() => {
                          router.push(path);
                          onNavigate();
                        }}
                        aria-label={label}
                      >
                        {/* Active background pill via layoutId */}
                        {active && (
                          <motion.div
                            layoutId="nav-active-pill"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 34,
                            }}
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: theme.accentSoft,
                              borderRadius: 10,
                              zIndex: 0,
                            }}
                          />
                        )}

                        {/* Hover background */}
                        {!active && hoveredPath === path && (
                          <motion.div
                            layoutId="nav-hover-bg"
                            transition={{ duration: 0.12 }}
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: theme.surfaceHover,
                              borderRadius: 10,
                              zIndex: 0,
                            }}
                          />
                        )}

                        {/* Icon container */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 8,
                            flexShrink: 0,
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <Icon
                            size={16}
                            strokeWidth={active ? 2.3 : 1.8}
                            style={{
                              flexShrink: 0,
                              transition: "stroke-width 0.15s",
                            }}
                          />
                          {/* Badge on icon (visible in collapsed mode) */}
                          {badge && badge > 0 && collapsed && (
                            <div
                              style={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                width: 14,
                                height: 14,
                                background: theme.danger,
                                borderRadius: "50%",
                                border: `1.5px solid ${theme.bg}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 8,
                                fontWeight: 800,
                                color: "#fff",
                                animation:
                                  "pulse-badge 2s ease-in-out infinite",
                              }}
                            >
                              {badge}
                            </div>
                          )}
                        </div>

                        {/* Label + badge + shortcut */}
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.div
                              key="nav-label-row"
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              transition={{ duration: 0.18, ease: ease2 }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                flex: 1,
                                gap: 6,
                                position: "relative",
                                zIndex: 1,
                                minWidth: 0,
                              }}
                            >
                              <span style={{ whiteSpace: "nowrap", flex: 1 }}>
                                {label}
                              </span>
                              {badge && badge > 0 && (
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    color: "#fff",
                                    background: theme.danger,
                                    borderRadius: 999,
                                    padding: "1px 5px",
                                    letterSpacing: "0.02em",
                                    animation:
                                      "pulse-badge 2s ease-in-out infinite",
                                    flexShrink: 0,
                                  }}
                                >
                                  {badge}
                                </span>
                              )}
                              {shortcut && !badge && (
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    color: theme.textTertiary,
                                    background: theme.surface,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 4,
                                    padding: "1px 5px",
                                    fontFamily: "var(--font-manrope)",
                                    letterSpacing: 0,
                                    flexShrink: 0,
                                  }}
                                >
                                  {shortcut}
                                </span>
                              )}
                              {/* Active dot */}
                              {active && (
                                <div
                                  style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: "50%",
                                    background: theme.accent,
                                    boxShadow: `0 0 8px ${theme.accent}`,
                                    flexShrink: 0,
                                    animation:
                                      "pulse-badge 2.4s ease-in-out infinite",
                                  }}
                                />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>

                      {/* Floating tooltip (collapsed only) */}
                      {collapsed && (
                        <NavTooltip
                          label={label}
                          visible={hoveredPath === path}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Sidebar Footer ── */}
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            padding: "12px 8px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* User profile */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                key="user-row"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: ease2 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 10px",
                  borderRadius: 10,
                  background: theme.surfaceElevated,
                  border: `1px solid ${theme.border}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#040404",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    AL
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 8,
                      height: 8,
                      background: theme.accent,
                      borderRadius: "50%",
                      border: `1.5px solid ${theme.bg}`,
                      animation: "pulse-status 2.5s ease-in-out infinite",
                    }}
                  />
                </div>
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: theme.textPrimary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    admin@ironledger
                  </div>
                  <div
                    style={{
                      fontSize: 9.5,
                      color: theme.accent,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Super Admin
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle */}
          <button
            className="il-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={spring4}
            >
              <ChevronRight size={14} />
            </motion.div>
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// ─── Notification Dropdown ────────────────────────────────────────────────────
function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: ease2 }}
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 340,
        background: "#141414",
        border: `1px solid ${theme.borderStrong}`,
        borderRadius: 16,
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: theme.textPrimary,
              letterSpacing: "-0.02em",
            }}
          >
            Notificações
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
              background: theme.danger,
              borderRadius: 999,
              padding: "1px 6px",
            }}
          >
            {mockNotifications.filter((n) => n.unread).length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: theme.textTertiary,
            cursor: "pointer",
            padding: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Notifications list */}
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {mockNotifications.map((n, i) => {
          const Icon = n.icon;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2, ease: ease2 }}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 16px",
                borderBottom:
                  i < mockNotifications.length - 1
                    ? `1px solid ${theme.border}`
                    : "none",
                cursor: "pointer",
                background: n.unread
                  ? "rgba(255,255,255,0.015)"
                  : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = theme.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = n.unread
                  ? "rgba(255,255,255,0.015)"
                  : "transparent")
              }
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: n.color + "18",
                  border: `1px solid ${n.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={15} color={n.color} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: theme.textPrimary,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {n.title}
                  </span>
                  {n.unread && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: theme.accent,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.textSecondary,
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.body}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.textTertiary,
                    marginTop: 3,
                  }}
                >
                  {n.time}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{ padding: "10px 16px", borderTop: `1px solid ${theme.border}` }}
      >
        <button
          onClick={() => {
            router.push("/alerts");
            onClose();
          }}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            color: theme.accent,
            cursor: "pointer",
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: "var(--font-manrope)",
            letterSpacing: "-0.01em",
            padding: "4px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          Ver todos os alertas
          <ChevronRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── User Dropdown ────────────────────────────────────────────────────────────
function UserDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: ease2 }}
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 240,
        background: "#141414",
        border: `1px solid ${theme.borderStrong}`,
        borderRadius: 14,
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      {/* User info */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11.5,
              fontWeight: 800,
              color: "#040404",
              letterSpacing: "-0.02em",
              flexShrink: 0,
            }}
          >
            AL
          </div>
          <div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: theme.textPrimary,
                letterSpacing: "-0.015em",
              }}
            >
              Admin
            </div>
            <div style={{ fontSize: 11, color: theme.textSecondary }}>
              admin@ironledger
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: theme.accent,
              background: theme.accentSoft,
              border: `1px solid ${theme.accent}30`,
              borderRadius: 4,
              padding: "2px 7px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Super Admin
          </span>
          <span
            style={{
              fontSize: 9.5,
              color: theme.textTertiary,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 4,
              padding: "2px 7px",
            }}
          >
            v2.4.0
          </span>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: "6px" }}>
        {[
          { icon: User, label: "Perfil", action: () => router.push("/settings") },
          {
            icon: Settings,
            label: "Configurações",
            action: () => router.push("/settings"),
          },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={() => {
              action();
              onClose();
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 10px",
              background: "transparent",
              border: "none",
              borderRadius: 8,
              color: theme.textSecondary,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-manrope)",
              letterSpacing: "-0.01em",
              textAlign: "left",
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.surfaceHover;
              e.currentTarget.style.color = theme.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = theme.textSecondary;
            }}
          >
            <Icon size={14} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding: "6px", borderTop: `1px solid ${theme.border}` }}>
        <button
          onClick={() => {
            router.push("/login");
            onClose();
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 10px",
            background: "transparent",
            border: "none",
            borderRadius: 8,
            color: theme.textSecondary,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "var(--font-manrope)",
            letterSpacing: "-0.01em",
            textAlign: "left",
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.dangerSoft;
            e.currentTarget.style.color = theme.danger;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = theme.textSecondary;
          }}
        >
          <LogOut size={14} strokeWidth={1.8} />
          Sair da conta
        </button>
      </div>
    </motion.div>
  );
}

// ─── Command Palette ──────────────────────────────────────────────────────────
function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const recentPages = useRecentPages();

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Build results
  const recentItems = recentPages
    .get()
    .filter((n) => n.path !== pathname);
  const filtered = query
    ? navItems.filter((n) =>
        n.label.toLowerCase().includes(query.toLowerCase()),
      )
    : navItems;

  // Group filtered results
  const grouped = filtered.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flatResults = filtered;

  useEffect(() => setFocusedIdx(0), [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const item = flatResults[focusedIdx];
      if (item) {
        router.push(item.path);
        onClose();
      }
    }
  };

  const go = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: ease2 }}
        style={{
          background: "#111111",
          border: `1px solid ${theme.borderStrong}`,
          borderRadius: 18,
          width: "100%",
          maxWidth: 560,
          margin: "0 20px",
          overflow: "hidden",
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <Search
            size={16}
            color={theme.textSecondary}
            style={{ flexShrink: 0 }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar páginas, ações..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: theme.textPrimary,
              fontSize: 15,
              width: "100%",
              fontFamily: "var(--font-manrope)",
              letterSpacing: "-0.01em",
            }}
          />
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 10,
                color: theme.textTertiary,
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 5,
                padding: "2px 6px",
                fontFamily: "var(--font-manrope)",
              }}
            >
              ESC
            </span>
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: "auto", padding: "8px" }}>
          {/* Recent section when no query */}
          {!query && recentItems.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: theme.textTertiary,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "4px 10px 6px",
                }}
              >
                Recente
              </div>
              {recentItems.slice(0, 3).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "9px 10px",
                      background: theme.surface,
                      border: "none",
                      borderRadius: 10,
                      color: theme.textSecondary,
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 13.5,
                      fontFamily: "var(--font-manrope)",
                      letterSpacing: "-0.01em",
                      transition: "background 0.12s, color 0.12s",
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.surfaceHover;
                      e.currentTarget.style.color = theme.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.surface;
                      e.currentTarget.style.color = theme.textSecondary;
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        background: theme.surfaceElevated,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 7,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={13} />
                    </div>
                    {item.label}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        color: theme.textTertiary,
                      }}
                    >
                      Recente
                    </span>
                  </button>
                );
              })}
              <div
                style={{
                  height: 1,
                  background: theme.border,
                  margin: "8px 4px",
                }}
              />
            </div>
          )}

          {/* Grouped results */}
          {Object.entries(query ? grouped : navSections).map(
            ([section, items]) => {
              // In query mode, only show matching items
              const displayItems = query ? (grouped[section] ?? []) : items;
              if (!displayItems.length) return null;

              return (
                <div key={section} style={{ marginBottom: 4 }}>
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: theme.textTertiary,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "4px 10px 5px",
                    }}
                  >
                    {section}
                  </div>
                  {displayItems.map((item) => {
                    const Icon = item.icon;
                    const flatIdx = flatResults.findIndex(
                      (r) => r.path === item.path,
                    );
                    const isFocused = flatIdx === focusedIdx;
                    const isActive =
                      pathname === item.path ||
                      (item.path !== "/dashboard" &&
                        pathname.startsWith(item.path));

                    return (
                      <button
                        key={item.path}
                        onClick={() => go(item.path)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                          padding: "9px 10px",
                          background: isFocused
                            ? theme.surfaceActive
                            : "transparent",
                          border: `1px solid ${isFocused ? theme.borderStrong : "transparent"}`,
                          borderRadius: 10,
                          color: isFocused
                            ? theme.textPrimary
                            : theme.textSecondary,
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 13.5,
                          fontFamily: "var(--font-manrope)",
                          letterSpacing: "-0.01em",
                          transition:
                            "background 0.1s, border-color 0.1s, color 0.1s",
                          marginBottom: 1,
                        }}
                        onMouseEnter={() => setFocusedIdx(flatIdx)}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            background: isActive
                              ? theme.accentSoft
                              : theme.surface,
                            border: `1px solid ${isActive ? theme.accent + "30" : theme.border}`,
                            borderRadius: 7,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon
                            size={13}
                            color={
                              isActive ? theme.accent : theme.textSecondary
                            }
                          />
                        </div>
                        <span
                          style={{
                            flex: 1,
                            color: isActive ? theme.accent : undefined,
                          }}
                        >
                          {item.label}
                        </span>
                        {item.shortcut && (
                          <span
                            style={{
                              fontSize: 10,
                              color: theme.textTertiary,
                              background: theme.surface,
                              border: `1px solid ${theme.border}`,
                              borderRadius: 4,
                              padding: "1px 5px",
                            }}
                          >
                            {item.shortcut}
                          </span>
                        )}
                        {isFocused && (
                          <span
                            style={{
                              fontSize: 10,
                              color: theme.textTertiary,
                              marginLeft: 4,
                            }}
                          >
                            ↵
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            },
          )}

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 24px",
                color: theme.textTertiary,
                fontSize: 13,
                fontFamily: "var(--font-manrope)",
              }}
            >
              <Search
                size={28}
                style={{
                  margin: "0 auto 12px",
                  opacity: 0.3,
                  display: "block",
                }}
              />
              Nenhum resultado para "
              <strong style={{ color: theme.textSecondary }}>{query}</strong>"
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            padding: "10px 20px",
            borderTop: `1px solid ${theme.border}`,
            background: "rgba(0,0,0,0.2)",
          }}
        >
          {[
            ["↑↓", "Navegar"],
            ["↵", "Selecionar"],
            ["ESC", "Fechar"],
          ].map(([key, hint]) => (
            <div
              key={key}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: theme.textTertiary,
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontFamily: "var(--font-manrope), monospace",
                }}
              >
                {key}
              </span>
              <span style={{ fontSize: 11, color: theme.textTertiary }}>
                {hint}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, idx) => ({
    label: pathLabels[part] ?? part,
    path: "/" + parts.slice(0, idx + 1).join("/"),
    isLast: idx === parts.length - 1,
  }));

  if (crumbs.length === 0)
    return (
      <span
        style={{ fontSize: 13.5, fontWeight: 600, color: theme.textPrimary }}
      >
        Iron Ledger
      </span>
    );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {crumbs.map((crumb, i) => (
        <div
          key={crumb.path}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          {i > 0 && <ChevronRight size={11} color={theme.textTertiary} />}
          <button
            onClick={() => !crumb.isLast && router.push(crumb.path)}
            style={{
              background: "none",
              border: "none",
              fontSize: 13.5,
              fontWeight: crumb.isLast ? 600 : 500,
              color: crumb.isLast ? theme.textPrimary : theme.textTertiary,
              cursor: crumb.isLast ? "default" : "pointer",
              padding: "2px 4px",
              borderRadius: 5,
              fontFamily: "var(--font-manrope)",
              letterSpacing: "-0.015em",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!crumb.isLast) {
                e.currentTarget.style.color = theme.textSecondary;
                e.currentTarget.style.background = theme.surfaceHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = crumb.isLast
                ? theme.textPrimary
                : theme.textTertiary;
              e.currentTarget.style.background = "transparent";
            }}
          >
            {crumb.label}
          </button>
        </div>
      ))}
    </div>
  );
}

function Header({
  title: _title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const clock = useClock();
  const unreadCount = mockNotifications.filter((n) => n.unread).length;

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <AnimatePresence>
        {paletteOpen && (
          <CommandPalette onClose={() => setPaletteOpen(false)} />
        )}
      </AnimatePresence>

      <header
        className="il-header"
        style={{
          height: 58,
          background: "rgba(8,8,8,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 16,
          flexShrink: 0,
          zIndex: 10,
          position: "relative",
        }}
      >
        <button
          className="il-mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 10,
            border: `1px solid ${theme.border}`,
            background: theme.surface,
            color: theme.textSecondary,
            cursor: "pointer",
          }}
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumbs */}
        <div className="il-breadcrumbs" style={{ flex: "0 0 auto" }}>
          <Breadcrumbs />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Clock */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: theme.textTertiary,
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.02em",
          }}
        >
          <Clock size={12} />
          {clock}
        </div>

        {/* Environment badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 999,
            padding: "4px 10px",
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: theme.accent,
              animation: "pulse-badge 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: theme.textSecondary,
              letterSpacing: "0.04em",
            }}
          >
            PRODUÇÃO
          </span>
          <span style={{ fontSize: 10, color: theme.textTertiary }}>
            v2.4.0
          </span>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: "7px 13px",
            cursor: "pointer",
            color: theme.textTertiary,
            fontSize: 13,
            fontFamily: "var(--font-manrope)",
            transition: "border-color 0.18s, background 0.18s",
            minWidth: 180,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.borderStrong;
            e.currentTarget.style.color = theme.textSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.color = theme.textTertiary;
          }}
        >
          <Search size={13} />
          <span
            style={{ flex: 1, textAlign: "left", letterSpacing: "-0.01em" }}
          >
            Pesquisar...
          </span>
          <span
            style={{
              fontSize: 10,
              background: theme.surfaceElevated,
              border: `1px solid ${theme.border}`,
              borderRadius: 4,
              padding: "1px 5px",
              letterSpacing: "0.01em",
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Vertical divider */}
        <div
          style={{
            width: 1,
            height: 20,
            background: theme.border,
            flexShrink: 0,
          }}
        />

        {/* Notification bell */}
        <div style={{ position: "relative" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring4}
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserOpen(false);
            }}
            style={{
              background: notifOpen ? theme.surfaceElevated : theme.surface,
              border: `1px solid ${notifOpen ? theme.borderStrong : theme.border}`,
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.textSecondary,
              cursor: "pointer",
              position: "relative",
              transition: "background 0.15s, border-color 0.15s",
            }}
            aria-label="Notificações"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 16,
                  height: 16,
                  background: theme.danger,
                  borderRadius: "50%",
                  border: `2px solid ${theme.bg}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                {unreadCount}
              </motion.div>
            )}
          </motion.button>
          <AnimatePresence>
            {notifOpen && (
              <NotificationDropdown onClose={() => setNotifOpen(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* User avatar + dropdown */}
        <div style={{ position: "relative" }}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring4}
            onClick={() => {
              setUserOpen((v) => !v);
              setNotifOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px 4px 4px",
              background: userOpen ? theme.surfaceElevated : theme.surface,
              border: `1px solid ${userOpen ? theme.borderStrong : theme.border}`,
              borderRadius: 999,
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: "#040404",
                  letterSpacing: "-0.02em",
                }}
              >
                AL
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 7,
                  height: 7,
                  background: theme.accent,
                  borderRadius: "50%",
                  border: `1.5px solid ${theme.bg}`,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: theme.textSecondary,
                whiteSpace: "nowrap",
                fontFamily: "var(--font-manrope)",
                letterSpacing: "-0.01em",
              }}
            >
              Admin
            </span>
            <motion.div
              animate={{ rotate: userOpen ? 180 : 0 }}
              transition={spring4}
            >
              <ChevronRight
                size={11}
                color={theme.textTertiary}
                style={{ transform: "rotate(90deg)" }}
              />
            </motion.div>
          </motion.div>
          <AnimatePresence>
            {userOpen && <UserDropdown onClose={() => setUserOpen(false)} />}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}

// ─── Layout Root ──────────────────────────────────────────────────────────────
export function Layout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Track recent pages
  useRecentPages();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // ⌘B — toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Number key shortcuts ⌘1-⌘8
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= navItems.length) {
        e.preventDefault();
        router.push(navItems[num - 1].path);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <div
      className="il-app-shell"
      style={{
        display: "flex",
        height: "100vh",
        background: theme.bg,
        fontFamily: "var(--font-manrope)",
        color: theme.textPrimary,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        .il-mobile-backdrop {
          display: none;
        }

        @media (max-width: 767px) {
          .il-app-shell .il-sidebar {
            position: fixed !important;
            inset: 0 auto 0 0;
            width: min(82vw, 300px) !important;
            min-width: min(82vw, 300px) !important;
            height: 100dvh;
            z-index: 60 !important;
            transform: translateX(-105%);
            transition: transform 220ms ease;
            box-shadow: 24px 0 60px rgba(0, 0, 0, 0.55);
          }

          .il-app-shell .il-sidebar.is-mobile-open {
            transform: translateX(0);
          }

          .il-mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 50;
            border: 0;
            background: rgba(0, 0, 0, 0.62);
            backdrop-filter: blur(4px);
          }

          .il-header {
            height: 56px !important;
            padding: 0 14px !important;
            gap: 10px !important;
          }

          .il-mobile-menu-btn {
            display: flex !important;
          }

          .il-header > div:nth-of-type(3),
          .il-header > div:nth-of-type(4),
          .il-header > button:not(.il-mobile-menu-btn),
          .il-header > div[style*="width: 1px"] {
            display: none !important;
          }

          .il-breadcrumbs {
            min-width: 0;
            overflow: hidden;
          }

          .il-breadcrumbs > div {
            overflow: hidden;
            white-space: nowrap;
          }

          .il-breadcrumbs button {
            max-width: 42vw;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .il-main {
            padding: 18px 14px 28px !important;
            overflow-x: hidden !important;
          }

          .il-page-content {
            min-width: 0;
            width: 100%;
          }

          .il-page-content [style*="grid-template-columns"] {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .il-page-content [style*="min-width: 220px"],
          .il-page-content [style*="min-width: 240px"],
          .il-page-content [style*="min-width: 260px"],
          .il-page-content [style*="min-width: 280px"] {
            min-width: 0 !important;
            width: 100% !important;
          }

          .il-page-content [style*="width: 180px"],
          .il-page-content [style*="width: 200px"],
          .il-page-content [style*="width: 220px"] {
            width: 100% !important;
            max-width: 100% !important;
          }

          .il-page-content > [style*="display: flex"],
          .il-page-content > div > [style*="display: flex"] {
            flex-wrap: wrap !important;
          }

          .il-page-content input,
          .il-page-content select,
          .il-page-content textarea,
          .il-page-content button {
            max-width: 100%;
          }

          .il-page-content div:has(> table) {
            max-width: 100%;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }

          .il-page-content table {
            min-width: 720px;
          }

          .il-page-content h1 {
            font-size: clamp(1.5rem, 8vw, 2rem) !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1100px) {
          .il-main {
            padding: 24px !important;
          }

          .il-header {
            padding: 0 18px !important;
            gap: 10px !important;
          }

          .il-header > button:not(.il-mobile-menu-btn) {
            min-width: 42px !important;
          }
        }
      `}</style>
      {/* Ambient mesh background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "25%",
            width: 600,
            height: 600,
            background: `radial-gradient(ellipse, ${theme.accent}0E 0%, transparent 65%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            right: "5%",
            width: 400,
            height: 400,
            background: `radial-gradient(ellipse, ${theme.purple}0A 0%, transparent 65%)`,
            filter: "blur(70px)",
          }}
        />
      </div>

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <AnimatePresence>
        {mobileNavOpen && (
          <motion.button
            className="il-mobile-backdrop"
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
          minWidth: 0,
        }}
      >
        <Header
          title={title}
          onMenuClick={() => setMobileNavOpen((open) => !open)}
        />

        <main
          className="il-main"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "28px 32px",
            position: "relative",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              className="il-page-content"
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring1}
              style={{ minWidth: 0 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
