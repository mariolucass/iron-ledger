"use client";

import { colors as t } from "@/shared/config/tokens";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  GitBranch,
  Globe,
  Lock,
  Menu,
  Package,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ease2, spring4, staggerContainer, staggerItem } from "@/shared/lib/animation";

// ─── Design Tokens ────────────────────────────────────────────────────────────

// ─── Animated count-up hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, active = false): string {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, target, duration]);

  return count.toLocaleString("pt-BR");
}

// ─── Section reveal wrapper ───────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  y = 40,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: ease2, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stat Card (count-up) ─────────────────────────────────────────────────────
function StatCard({
  prefix = "",
  value,
  suffix = "",
  label,
  active,
  duration = 1800,
}: {
  prefix?: string;
  value: number;
  suffix?: string;
  label: string;
  active: boolean;
  duration?: number;
}) {
  const count = useCountUp(value, duration, active);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "0 32px",
      }}
    >
      <div
        style={{
          fontSize: "clamp(32px, 4vw, 48px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: t.textPrimary,
          fontVariantNumeric: "tabular-nums",
          background: `linear-gradient(135deg, ${t.textPrimary} 0%, ${t.accent} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {prefix}
        {count}
        {suffix}
      </div>
      <div
        style={{
          fontSize: 13,
          color: t.textSecondary,
          fontWeight: 500,
          textAlign: "center",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Feature data ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: Shield,
    title: "Histórico de auditoria",
    desc: "Cada alteração fica registrada com data, origem e responsável para facilitar conferências e investigações.",
    color: t.accent,
    soft: t.accentSoft,
    size: "large",
  },
  {
    icon: Zap,
    title: "Atualizações em tempo real",
    desc: "Entradas, saídas e transferências aparecem no sistema assim que são processadas.",
    color: t.blue,
    soft: t.blueSoft,
    size: "small",
  },
  {
    icon: GitBranch,
    title: "Operações coordenadas",
    desc: "Fluxos com várias etapas são acompanhados do início ao fim, inclusive quando alguma etapa precisa ser refeita.",
    color: t.purple,
    soft: t.purpleSoft,
    size: "small",
  },
  {
    icon: TrendingUp,
    title: "Planejamento de estoque",
    desc: "O histórico de vendas e a movimentação dos produtos ajudam a identificar reposições com antecedência.",
    color: "#34D399",
    soft: "rgba(52,211,153,0.10)",
    size: "small",
  },
  {
    icon: Package,
    title: "Múltiplos estoques",
    desc: "Acompanhe centros de distribuição, lojas e transferências entre unidades em uma única visão.",
    color: "#F87171",
    soft: "rgba(248,113,113,0.10)",
    size: "small",
  },
  {
    icon: CheckCircle2,
    title: "Conferência financeira",
    desc: "Registros em partidas dobradas e relatórios organizados para apoiar o fechamento e a prestação de contas.",
    color: "#FBBF24",
    soft: "rgba(251,191,36,0.10)",
    size: "large",
  },
];

// ─── Testimonial data ─────────────────────────────────────────────────────────
const testimonials = [
  {
    quote:
      "Antes, conferir uma divergência levava boa parte da manhã. Agora conseguimos seguir o histórico da movimentação e encontrar a origem sem depender de várias planilhas.",
    author: "Luiz Felipe",
    role: "Coordenador Financeiro",
    initials: "LF",
    color: t.accent,
    stars: 5,
  },
  {
    quote:
      "A implantação foi tranquila e conseguimos manter os processos que a equipe já conhecia. O ganho maior foi ter estoque e financeiro olhando para os mesmos números.",
    author: "Pedro Ygor",
    role: "Gerente de Operações",
    initials: "PY",
    color: t.blue,
    stars: 5,
  },
  {
    quote:
      "Os alertas de reposição ajudaram a organizar melhor as compras. Hoje a equipe consegue perceber uma possível falta antes que ela vire um problema na loja.",
    author: "Mário Lucas",
    role: "Responsável por Suprimentos",
    initials: "ML",
    color: t.purple,
    stars: 5,
  },
];

// ─── Tech Stack data ──────────────────────────────────────────────────────────
const techStack = [
  { name: "Kafka", icon: Database, color: "#E87027" },
  { name: "RabbitMQ", icon: GitBranch, color: "#FF6600" },
  { name: "Temporal.io", icon: Globe, color: "#60A5FA" },
  { name: "PostgreSQL", icon: Database, color: "#336791" },
  { name: "Redis", icon: Zap, color: "#FF4438" },
  { name: "gRPC", icon: Globe, color: "#244C5A" },
];

// ─── Nav links ────────────────────────────────────────────────────────────────
const navLinks = [
  { label: "Recursos", href: "#features" },
  { label: "Integração", href: "#tech" },
  { label: "Depoimentos", href: "#testimonials" },
];

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "16px",
        fontFamily: "var(--font-manrope)",
      }}
    >
      {/* Mock header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
              borderRadius: 5,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: t.textPrimary,
              letterSpacing: "-0.02em",
            }}
          >
            Iron Ledger
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF453A", "#FF9F0A", "#30D158"].map((c) => (
            <div
              key={c}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
        </div>
      </div>
      {/* Mock KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          { label: "SKUs", val: "4.821", color: t.accent },
          { label: "Transações", val: "38", color: t.blue },
          { label: "Alertas", val: "14", color: "#FF453A" },
          { label: "Precisão", val: "94,2%", color: t.purple },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderLeft: `2px solid ${k.color}`,
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: t.textSecondary,
                marginBottom: 4,
                letterSpacing: "0.02em",
              }}
            >
              {k.label}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: t.textPrimary,
                letterSpacing: "-0.03em",
              }}
            >
              {k.val}
            </div>
          </div>
        ))}
      </div>
      {/* Mock chart area */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 8 }}
      >
        {/* Chart */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: t.textSecondary,
              marginBottom: 10,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Atividade Recente
          </div>
          {/* Fake bars */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              height: 48,
            }}
          >
            {[60, 40, 80, 55, 90, 70, 85, 45, 75, 95, 60, 80].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: i === 10 ? t.accent : "rgba(255,255,255,0.08)",
                  borderRadius: "2px 2px 0 0",
                  transition: "height 0.3s",
                }}
              />
            ))}
          </div>
        </div>
        {/* Alerts */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: t.textSecondary,
              marginBottom: 8,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Alertas
          </div>
          {[
            { label: "Nike Air Zoom", sev: "ALTA", color: "#FF453A" },
            { label: "Camiseta Premium", sev: "MÉDIA", color: "#F5A623" },
            { label: "Jaqueta Couro", sev: "ALTA", color: "#FF453A" },
          ].map((a) => (
            <div
              key={a.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: t.textSecondary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "65%",
                }}
              >
                {a.label}
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: a.color,
                  background: `${a.color}18`,
                  borderRadius: 4,
                  padding: "1px 5px",
                  letterSpacing: "0.04em",
                }}
              >
                {a.sev}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  feature,
  delay = 0,
}: {
  feature: (typeof features)[number];
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = feature.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: ease2, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? t.surfaceElevated : t.surface,
        border: `1px solid ${hovered ? feature.color + "35" : t.border}`,
        borderRadius: 16,
        padding: "28px 28px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition:
          "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${feature.color}18`
          : "none",
        height: "100%",
      }}
    >
      {/* Corner glow */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          background: feature.color,
          filter: "blur(35px)",
          opacity: hovered ? 0.15 : 0.05,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
        }}
      />
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          background: feature.soft,
          border: `1px solid ${feature.color}30`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <Icon size={20} color={feature.color} strokeWidth={1.8} />
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: t.textPrimary,
          letterSpacing: "-0.025em",
          margin: "0 0 10px",
          lineHeight: 1.2,
        }}
      >
        {feature.title}
      </h3>
      <p
        style={{
          fontSize: 13.5,
          color: t.textSecondary,
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {feature.desc}
      </p>
    </motion.div>
  );
}

// ─── Mobile detection hook ────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    handler();
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LandingPage() {
  const router = useRouter();
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  // Parallax for hero product mockup
  const { scrollYProgress } = useScroll();
  const mockupRotateX = useTransform(scrollYProgress, [0, 0.25], [8, 0]);
  const mockupY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.25], [0.97, 1]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        fontFamily: "var(--font-manrope)",
        color: t.textPrimary,
        overflowX: "hidden",
      }}
    >
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes badge-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-12px) rotate(1deg); }
          66%       { transform: translateY(-6px) rotate(-0.5deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }
        @keyframes mesh-drift {
          0%   { transform: translate(0, 0); }
          33%  { transform: translate(24px, -16px); }
          66%  { transform: translate(-16px, 24px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes border-glow {
          0%, 100% { border-color: rgba(0,229,160,0.25); box-shadow: 0 0 30px rgba(0,229,160,0.08); }
          50%       { border-color: rgba(0,229,160,0.45); box-shadow: 0 0 60px rgba(0,229,160,0.14); }
        }
        @keyframes scan-line {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(600%); opacity: 0; }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.25; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Mobile nav menu ── */
        .mobile-nav-menu {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          z-index: 99;
          background: rgba(8,8,8,0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid ${t.border};
          padding: 16px 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: slideDown 0.2s ease forwards;
        }
        .mobile-nav-link {
          width: 100%;
          padding: 13px 16px;
          background: none;
          border: none;
          color: ${t.textSecondary};
          font-size: 15px;
          font-weight: 500;
          font-family: var(--font-manrope);
          letter-spacing: -0.01em;
          text-align: left;
          cursor: pointer;
          border-radius: 10px;
          transition: color 0.15s, background 0.15s;
        }
        .mobile-nav-link:hover {
          color: ${t.textPrimary};
          background: ${t.surface};
        }

        /* ── Responsive ── */
        .il-nav-links   { display: flex; }
        .il-nav-cta     { display: flex; }
        .il-hamburger   { display: none; }
        .il-hero-pad    { padding: 140px 40px 80px; }
        .il-stats-grid  { grid-template-columns: repeat(4, 1fr); }
        .il-stats-dividers { display: block; position: absolute; inset: 0; pointer-events: none; }
        .il-bento-grid  { grid-template-columns: repeat(3, 1fr); }
        .il-bento-large { grid-row: 1 / 3; grid-column: 1 / 2; }
        .il-bento-c2    { grid-column: 2 / 3; }
        .il-bento-c3    { grid-column: 3 / 4; }
        .il-footer-grid { grid-template-columns: 1.5fr 1fr 1fr 1fr; }
        .il-section-pad { padding: 80px 40px 100px; }
        .il-cta-pad     { padding: 80px 60px; }
        .il-nav-pad     { padding: 0 40px; }

        @media (max-width: 768px) {
          .il-nav-links  { display: none !important; }
          .il-nav-cta    { display: none !important; }
          .il-hamburger  { display: flex !important; }
          .il-hero-pad   { padding: 110px 20px 60px; }
          .il-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .il-stats-dividers { display: none !important; }
          .il-bento-grid { grid-template-columns: 1fr !important; }
          .il-bento-large { grid-row: auto !important; grid-column: auto !important; }
          .il-bento-c2   { grid-column: auto !important; }
          .il-bento-c3   { grid-column: auto !important; }
          .il-footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .il-section-pad { padding: 60px 20px 72px !important; }
          .il-cta-pad    { padding: 48px 24px !important; }
          .il-nav-pad    { padding: 0 20px !important; }
          .cta-primary, .cta-ghost { width: 100%; justify-content: center; }
        }

        .nav-link {
          color: ${t.textSecondary};
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
          padding: 6px 4px;
          font-family: var(--font-manrope);
          letter-spacing: -0.01em;
          position: relative;
          transition: color 0.2s ease;
        }
        .nav-link:hover { color: ${t.textPrimary}; }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: ${t.accent};
          transform: scaleX(0);
          transition: transform 0.2s ease;
        }
        .nav-link:hover::after { transform: scaleX(1); }

        .cta-primary {
          background: linear-gradient(135deg, ${t.accent} 0%, ${t.accentDark} 100%);
          color: #040404;
          border: none;
          border-radius: 999px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: var(--font-manrope);
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: opacity 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
          position: relative;
          overflow: hidden;
          white-space: nowrap;
        }
        .cta-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: badge-shimmer 2.4s infinite;
        }
        .cta-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,229,160,0.35);
        }
        .cta-primary:active { transform: translateY(0); box-shadow: none; }

        .cta-ghost {
          background: transparent;
          color: ${t.textPrimary};
          border: 1px solid ${t.borderStrong};
          border-radius: 999px;
          padding: 13px 28px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-manrope);
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
          white-space: nowrap;
        }
        .cta-ghost:hover {
          border-color: ${t.accent};
          color: ${t.accent};
          background: ${t.accentGlow};
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>

      {/* ── Ambient Background ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(${t.border} 1px, transparent 1px),
              linear-gradient(90deg, ${t.border} 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            animation: "grid-pulse 8s ease-in-out infinite",
          }}
        />
        {/* Blobs */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "20%",
            width: 700,
            height: 700,
            background: `radial-gradient(ellipse, ${t.accent}14 0%, transparent 65%)`,
            filter: "blur(50px)",
            animation: "mesh-drift 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "-5%",
            width: 500,
            height: 500,
            background: `radial-gradient(ellipse, ${t.purple}10 0%, transparent 65%)`,
            filter: "blur(60px)",
            animation: "mesh-drift 28s ease-in-out infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "10%",
            width: 400,
            height: 400,
            background: `radial-gradient(ellipse, ${t.blue}0C 0%, transparent 65%)`,
            filter: "blur(50px)",
            animation: "mesh-drift 35s ease-in-out infinite 10s",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 1. STICKY NAV ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition:
            "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
          background:
            navScrolled || mobileMenuOpen ? "rgba(8,8,8,0.95)" : "transparent",
          backdropFilter: navScrolled || mobileMenuOpen ? "blur(20px)" : "none",
          WebkitBackdropFilter:
            navScrolled || mobileMenuOpen ? "blur(20px)" : "none",
          borderBottom:
            navScrolled || mobileMenuOpen
              ? `1px solid ${t.border}`
              : "1px solid transparent",
        }}
      >
        <div
          className="il-nav-pad"
          style={{
            width: "100%",
            maxWidth: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setMobileMenuOpen(false);
            }}
          >
            <img
              src="/logo.png"
              alt="Iron Ledger"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                flexShrink: 0,
                objectFit: "contain",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: t.textPrimary,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.1,
                }}
              >
                Iron Ledger
              </div>
              <div
                style={{
                  fontSize: 8.5,
                  fontWeight: 600,
                  color: t.accent,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                GESTÃO OPERACIONAL
              </div>
            </div>
          </div>

          {/* Nav links — desktop only */}
          <div
            className="il-nav-links"
            style={{ alignItems: "center", gap: 32 }}
          >
            {navLinks.map((link) => (
              <button
                key={link.href}
                className="nav-link"
                onClick={() => scrollTo(link.href)}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA — desktop only */}
          <div className="il-nav-cta" style={{ alignItems: "center", gap: 12 }}>
            <button
              className="nav-link"
              onClick={() => router.push("/login")}
              style={{ color: t.textSecondary, fontSize: 14, fontWeight: 500 }}
            >
              Entrar
            </button>
            <button
              className="cta-primary"
              onClick={() => router.push("/login")}
              style={{ padding: "9px 20px", fontSize: 13.5 }}
            >
              Começar grátis <ArrowRight size={14} />
            </button>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="il-hamburger"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileMenuOpen((v) => !v)}
            style={{
              background: "none",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              color: t.textPrimary,
              cursor: "pointer",
              padding: "7px",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.15s",
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-menu">
          {navLinks.map((link) => (
            <button
              key={link.href}
              className="mobile-nav-link"
              onClick={() => {
                scrollTo(link.href);
                setMobileMenuOpen(false);
              }}
            >
              {link.label}
            </button>
          ))}
          <div style={{ height: 1, background: t.border, margin: "8px 0" }} />
          <button
            className="mobile-nav-link"
            onClick={() => {
              router.push("/login");
              setMobileMenuOpen(false);
            }}
            style={{ color: t.textSecondary }}
          >
            Entrar
          </button>
          <button
            onClick={() => {
              router.push("/login");
              setMobileMenuOpen(false);
            }}
            style={{
              marginTop: 8,
              width: "100%",
              background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
              color: "#040404",
              border: "none",
              borderRadius: 10,
              padding: "13px 20px",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-manrope)",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            Começar grátis <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 2. HERO SECTION ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="il-hero-pad"
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{ maxWidth: 900, width: "100%" }}
        >
          {/* Badge pill */}
          <motion.div
            variants={staggerItem}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: t.accentSoft,
                border: `1px solid ${t.borderAccent}`,
                borderRadius: 999,
                padding: "7px 16px",
                fontSize: 12.5,
                fontWeight: 600,
                color: t.accent,
                letterSpacing: "-0.01em",
                cursor: "pointer",
              }}
            >
              <Sparkles size={13} />
              <span>Novo — planejamento de estoque disponível</span>
              <ChevronRight size={12} style={{ opacity: 0.7 }} />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            style={{
              fontSize: "clamp(44px, 6.5vw, 80px)",
              fontWeight: 900,
              lineHeight: 1.03,
              letterSpacing: "-0.05em",
              color: t.textPrimary,
              marginBottom: 28,
            }}
          >
            Controle operacional{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${t.accent} 0%, ${t.purple} 60%, ${t.blue} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
                paddingBottom: "0.1em",
                paddingRight: "0.05em",
              }}
            >
              sem ponto cego.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={staggerItem}
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: t.textSecondary,
              maxWidth: 640,
              lineHeight: 1.65,
              margin: "0 auto 44px",
              letterSpacing: "-0.01em",
            }}
          >
            Acompanhe movimentações, confira saldos e consulte o histórico de
            cada operação sem reunir informações de vários sistemas.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={staggerItem}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <button className="cta-primary" onClick={() => router.push("/login")}>
              Começar agora <ArrowRight size={16} />
            </button>
            <button
              className="cta-ghost"
              onClick={() => router.push("/dashboard")}
            >
              <BarChart3 size={16} />
              Ver demonstração
            </button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            variants={staggerItem}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              marginTop: 48,
            }}
          >
            <div style={{ display: "flex", gap: 3 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={15} color={t.accent} fill={t.accent} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex" }}>
                {["LF", "PY", "ML", "AO", "TP"].map((init, i) => (
                  <div
                    key={init}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background:
                        [t.accent, t.blue, t.purple, "#F87171", "#FBBF24"][i] +
                        "30",
                      border: `2px solid ${t.bg}`,
                      marginLeft: i > 0 ? -8 : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8.5,
                      fontWeight: 700,
                      color: [t.accent, t.blue, t.purple, "#F87171", "#FBBF24"][
                        i
                      ],
                    }}
                  >
                    {init}
                  </div>
                ))}
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: t.textSecondary,
                  letterSpacing: "-0.01em",
                }}
              >
                Usado por{" "}
                <strong style={{ color: t.textPrimary }}>+200 equipes</strong>{" "}
                no dia a dia
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 3. SOCIAL PROOF METRICS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={statsRef}
        style={{
          position: "relative",
          zIndex: 1,
          padding: isMobile ? "0 20px 60px" : "0 40px 80px",
        }}
      >
        <Reveal>
          <div
            className="il-stats-grid"
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 20,
              padding: isMobile ? "32px 10px" : "40px 20px",
              display: "grid",
              position: "relative",
              overflow: "hidden",
              rowGap: isMobile ? 28 : 0,
            }}
          >
            {/* Scan line effect */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${t.accent}40, transparent)`,
                animation: "scan-line 6s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
            {/* Dividers (hidden on mobile via class) */}
            <div className="il-stats-dividers">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${i * 25}%`,
                    top: "15%",
                    bottom: "15%",
                    width: 1,
                    background: t.border,
                  }}
                />
              ))}
            </div>
            <StatCard
              prefix=""
              value={4800000}
              suffix="+"
              label="Transações processadas"
              active={statsInView}
              duration={2000}
            />
            <StatCard
              prefix=""
              value={99}
              suffix=",9%"
              label="Disponibilidade do sistema"
              active={statsInView}
              duration={1600}
            />
            <StatCard
              prefix="+"
              value={200}
              suffix=""
              label="Equipes usuárias"
              active={statsInView}
              duration={1400}
            />
            <StatCard
              prefix=""
              value={50}
              suffix="ms"
              label="Latência média"
              active={statsInView}
              duration={1200}
            />
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 4. PRODUCT SHOWCASE ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: isMobile ? "32px 20px 64px" : "40px 40px 100px",
          textAlign: "center",
        }}
      >
        <Reveal>
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: t.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Plataforma
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: t.textPrimary,
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            Uma visão clara da operação
          </h2>
          <p
            style={{
              fontSize: 16,
              color: t.textSecondary,
              maxWidth: 500,
              margin: "0 auto 64px",
              lineHeight: 1.6,
            }}
          >
            Consulte indicadores, movimentações recentes e alertas sem sair do
            painel principal.
          </p>
        </Reveal>

        {/* 3D Mockup */}
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          {/* Stage glow */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "70%",
              height: "60%",
              background: t.accent,
              filter: "blur(120px)",
              opacity: 0.08,
              pointerEvents: "none",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "70%",
              width: "30%",
              height: "40%",
              background: t.purple,
              filter: "blur(100px)",
              opacity: 0.06,
              pointerEvents: "none",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />

          <motion.div
            style={{
              position: "relative",
              zIndex: 1,
              rotateX: mockupRotateX,
              y: mockupY,
              scale: mockupScale,
              transformPerspective: 1200,
              transformOrigin: "center top",
            }}
          >
            {/* Browser Chrome */}
            <div
              style={{
                background: "rgba(18,18,18,0.95)",
                border: `1px solid ${t.borderStrong}`,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: `
                  0 60px 120px rgba(0,0,0,0.7),
                  0 0 0 1px rgba(255,255,255,0.06),
                  0 0 80px rgba(0,229,160,0.06)
                `,
                animation: "border-glow 4s ease-in-out infinite",
              }}
            >
              {/* Browser top bar */}
              <div
                style={{
                  height: 44,
                  background: "rgba(255,255,255,0.025)",
                  borderBottom: `1px solid ${t.border}`,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 20px",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", gap: 7 }}>
                  {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                    <div
                      key={c}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: c,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    flex: 1,
                    maxWidth: 360,
                    margin: "0 auto",
                    height: 26,
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Lock size={10} color={t.textTertiary} />
                  <span style={{ fontSize: 11, color: t.textTertiary }}>
                    app.ironledger.com/dashboard
                  </span>
                </div>
              </div>
              {/* Dashboard inside */}
              <div style={{ height: "min(480px, 45vw)", background: t.bgDeep }}>
                <DashboardMockup />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 5. FEATURE BENTO GRID ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="features"
        className="il-section-pad"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: t.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Recursos
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: t.textPrimary,
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              O essencial para acompanhar
              <br />
              <span style={{ color: t.textSecondary }}>
                a rotina da operação.
              </span>
            </h2>
            <p
              style={{
                fontSize: 16,
                color: t.textSecondary,
                maxWidth: 500,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Recursos para reduzir conferências manuais e manter as informações
              de estoque e financeiro organizadas.
            </p>
          </div>
        </Reveal>

        {/* Bento Grid */}
        <div
          className="il-bento-grid"
          style={{
            display: "grid",
            gridTemplateRows: "auto auto",
            gap: 16,
          }}
        >
          {/* Large card left — spans 2 rows on desktop */}
          <div className="il-bento-large">
            <FeatureCard feature={features[0]} delay={0} />
          </div>
          {/* Top right two */}
          <div className="il-bento-c2">
            <FeatureCard feature={features[1]} delay={0.08} />
          </div>
          <div className="il-bento-c3">
            <FeatureCard feature={features[2]} delay={0.16} />
          </div>
          {/* Bottom row three */}
          <div className="il-bento-c2">
            <FeatureCard feature={features[3]} delay={0.24} />
          </div>
          <div className="il-bento-c3">
            <FeatureCard feature={features[4]} delay={0.32} />
          </div>
        </div>
        {/* Extra full-width card */}
        <div style={{ marginTop: 16 }}>
          <FeatureCard feature={features[5]} delay={0.4} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 6. TECH STACK ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="tech"
        className="il-section-pad"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        <Reveal>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: t.accent,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Infraestrutura
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: t.textPrimary,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            Integrações que fazem parte da operação
          </h2>
          <p
            style={{
              fontSize: 15,
              color: t.textSecondary,
              maxWidth: 480,
              margin: "0 auto 56px",
              lineHeight: 1.65,
            }}
          >
            O Iron Ledger se conecta a ferramentas conhecidas para processar
            eventos, armazenar dados e manter os fluxos em funcionamento.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 14,
              maxWidth: 900,
              margin: "0 auto",
            }}
          >
            {techStack.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <motion.div
                  key={tech.name}
                  whileHover={{ y: -6, scale: 1.04 }}
                  transition={spring4}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 22px",
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 14,
                    cursor: "default",
                    animation: `float-slow ${4 + i * 0.7}s ease-in-out infinite ${i * 0.4}s`,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: tech.color + "18",
                      border: `1px solid ${tech.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} color={tech.color} strokeWidth={1.8} />
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: t.textPrimary,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {tech.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 7. TESTIMONIALS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="testimonials"
        className="il-section-pad"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: t.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Depoimentos
            </div>
            <h2
              style={{
                fontSize: "clamp(26px, 3.5vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: t.textPrimary,
                lineHeight: 1.1,
              }}
            >
              O que mudou na rotina das equipes
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {testimonials.map((t_data, i) => {
            const ref = useRef<HTMLDivElement>(null);
            const inView = useInView(ref, { once: true, margin: "-60px" });
            return (
              <motion.div
                key={t_data.author}
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, ease: ease2, delay: i * 0.12 }}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderLeft: `3px solid ${t_data.color}`,
                  borderRadius: 16,
                  padding: "28px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {/* Stars */}
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: t_data.stars }).map((_, j) => (
                    <Star
                      key={j}
                      size={13}
                      color={t_data.color}
                      fill={t_data.color}
                    />
                  ))}
                </div>
                {/* Quote */}
                <p
                  style={{
                    fontSize: 14.5,
                    color: t.textSecondary,
                    lineHeight: 1.7,
                    margin: 0,
                    fontStyle: "italic",
                    flex: 1,
                  }}
                >
                  "{t_data.quote}"
                </p>
                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: t_data.color + "20",
                      border: `1.5px solid ${t_data.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: t_data.color,
                      letterSpacing: "0.02em",
                      flexShrink: 0,
                    }}
                  >
                    {t_data.initials}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: t.textPrimary,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {t_data.author}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSecondary }}>
                      {t_data.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 8. FINAL CTA ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: isMobile ? "24px 20px 60px" : "40px 40px 80px",
        }}
      >
        <Reveal>
          <div
            className="il-cta-pad"
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              position: "relative",
              overflow: "hidden",
              borderRadius: 24,
              background:
                "linear-gradient(135deg, rgba(0,229,160,0.07) 0%, rgba(0,0,0,0) 50%, rgba(167,139,250,0.07) 100%)",
              border: `1px solid ${t.borderStrong}`,
              textAlign: "center",
            }}
          >
            {/* CTA Background glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse at center, ${t.accent}0A 0%, transparent 60%)`,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                right: "-10%",
                width: 300,
                height: 300,
                background: `radial-gradient(ellipse, ${t.purple}0C 0%, transparent 70%)`,
                filter: "blur(60px)",
                pointerEvents: "none",
              }}
            />

            {/* Badge */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: t.accentSoft,
                  border: `1px solid ${t.borderAccent}`,
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: t.accent,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: t.accent,
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                Ambiente disponível para teste
              </div>
            </div>

            <h2
              style={{
                position: "relative",
                fontSize: "clamp(30px, 4.5vw, 56px)",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                color: t.textPrimary,
                lineHeight: 1.05,
                marginBottom: 20,
              }}
            >
              Quer organizar melhor
              <br />
              sua operação financeira?
            </h2>
            <p
              style={{
                position: "relative",
                fontSize: 17,
                color: t.textSecondary,
                maxWidth: 480,
                margin: "0 auto 44px",
                lineHeight: 1.65,
              }}
            >
              Conheça o fluxo completo, do registro de uma movimentação até a
              conferência dos saldos e do histórico.
            </p>
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <button
                className="cta-primary"
                onClick={() => router.push("/login")}
                style={{ fontSize: 16, padding: "16px 36px" }}
              >
                Começar agora <ArrowRight size={18} />
              </button>
              <button
                className="cta-ghost"
                onClick={() => router.push("/dashboard")}
                style={{ fontSize: 16, padding: "15px 36px" }}
              >
                <BarChart3 size={16} />
                Ver o dashboard
              </button>
            </div>
            <p
              style={{
                position: "relative",
                marginTop: 22,
                fontSize: 12.5,
                color: t.textTertiary,
                letterSpacing: "-0.01em",
              }}
            >
              <Lock
                size={11}
                style={{ verticalAlign: "middle", marginRight: 5 }}
              />
              Sem cartão de crédito. Você pode explorar o sistema antes de
              configurar sua operação.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 9. FOOTER ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: `1px solid ${t.border}`,
          padding: isMobile ? "40px 20px 32px" : "60px 40px 40px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {/* Top row */}
          <div
            className="il-footer-grid"
            style={{
              display: "grid",
              gap: 48,
              marginBottom: 60,
            }}
          >
            {/* Brand column */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <img
                  src="/logo.png"
                  alt="Iron Ledger"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: t.textPrimary,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                    }}
                  >
                    Iron Ledger
                  </div>
                  <div
                    style={{
                      fontSize: 8.5,
                      fontWeight: 600,
                      color: t.accent,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    GESTÃO OPERACIONAL
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: t.textSecondary,
                  lineHeight: 1.65,
                  maxWidth: 240,
                }}
              >
                Estoque, movimentações e conferência financeira em um só lugar.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: t.accent,
                    animation: "pulse-dot 2.2s ease-in-out infinite",
                  }}
                />
                <span style={{ fontSize: 11.5, color: t.textSecondary }}>
                  Sistemas funcionando normalmente
                </span>
              </div>
            </div>

            {/* Link columns */}
            {[
              {
                title: "Produto",
                links: [
                  "Dashboard",
                  "Estoque",
                  "Transações",
                  "Auditoria",
                  "Previsões",
                ],
              },
              {
                title: "Empresa",
                links: ["Sobre", "Blog", "Carreiras", "Contato", "Parceiros"],
              },
              {
                title: "Legal",
                links: [
                  "Privacidade",
                  "Termos",
                  "Cookies",
                  "Segurança",
                  "Compliance",
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.textTertiary,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  {col.title}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {col.links.map((link) => (
                    <button
                      key={link}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 13.5,
                        color: t.textSecondary,
                        cursor: "pointer",
                        textAlign: "left",
                        padding: 0,
                        fontFamily: "var(--font-manrope)",
                        letterSpacing: "-0.01em",
                        transition: "color 0.15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = t.textPrimary)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = t.textSecondary)
                      }
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: `1px solid ${t.border}`,
              paddingTop: 28,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: t.textTertiary }}>
              © 2026 Iron Ledger. Todos os direitos reservados.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={11} color={t.textTertiary} />
              <span style={{ fontSize: 11.5, color: t.textTertiary }}>
                Acesso protegido e histórico de alterações · v2.4.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
