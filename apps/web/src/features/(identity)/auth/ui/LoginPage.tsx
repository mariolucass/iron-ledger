"use client";

import { colors as t } from "@/shared/config/tokens";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ease2, spring4 } from "@/shared/lib/animation";


const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const proofPoints = [
  "Auditoria imutável de cada operação",
  "Criptografia de nível corporativo",
  "Disponibilidade operacional de 99,99%",
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <button
      className="brand-button"
      type="button"
      aria-label="Voltar para a página inicial"
      onClick={() => window.location.assign("/")}
    >
      <span className="brand-mark">
        <img src="/logo.png" alt="" />
      </span>
      <span className="brand-copy">
        <strong>Iron Ledger</strong>
        {!compact && <small>Inteligência operacional</small>}
      </span>
    </button>
  );
}

function StatusPill() {
  return (
    <div
      className="status-pill"
      role="status"
      aria-label="Todos os sistemas operacionais"
    >
      <span className="status-dot" />
      Todos os sistemas operacionais
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const emailId = useId();
  const passwordId = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");

  const emailError = submitted
    ? !email.trim()
      ? "Informe seu email corporativo."
      : !emailPattern.test(email)
        ? "Digite um endereço de email válido."
        : ""
    : "";
  const passwordError = submitted && !password ? "Informe sua senha." : "";
  const canSubmit = emailPattern.test(email) && password.length > 0;

  useEffect(() => {
    emailRef.current?.focus({ preventScroll: true });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setNotice("");
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    router.push("/dashboard");
  };

  const handleForgotPassword = () => {
    setNotice(
      emailPattern.test(email)
        ? `Enviaremos instruções para ${email} quando a recuperação estiver conectada.`
        : "Informe seu email primeiro para iniciar a recuperação de acesso.",
    );
    if (!emailPattern.test(email)) emailRef.current?.focus();
  };

  const handleEnterpriseAccess = (method: "SSO" | "passkey") => {
    setNotice(
      method === "SSO"
        ? "O login corporativo estará disponível quando o provedor de identidade for conectado."
        : "O acesso por passkey estará disponível quando a autenticação for conectada.",
    );
  };

  const entrance = prefersReducedMotion
    ? { initial: false as const, animate: {} }
    : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

  return (
    <main className="login-page">
      <style>{`
        .login-page, .login-page * { box-sizing: border-box; }
        .login-page button, .login-page input { font: inherit; }

        .login-page {
          min-height: 100svh;
          background: ${t.bg};
          color: ${t.text};
          display: grid;
          grid-template-columns: minmax(420px, 0.92fr) minmax(520px, 1.08fr);
          overflow: hidden;
          isolation: isolate;
          font-family: var(--font-manrope);
        }

        .login-visual {
          min-height: 100svh;
          padding: clamp(28px, 4vw, 56px);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          border-right: 1px solid ${t.border};
          background:
            radial-gradient(circle at 18% 16%, rgba(0,229,160,0.13), transparent 30%),
            radial-gradient(circle at 82% 80%, rgba(103,80,255,0.13), transparent 32%),
            linear-gradient(145deg, #0b100e 0%, #080908 48%, #0b0b10 100%);
        }

        .login-visual::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.22;
          background-image:
            linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: linear-gradient(to bottom, black, transparent 90%);
          pointer-events: none;
        }

        .login-visual::after {
          content: '';
          position: absolute;
          width: 520px;
          height: 520px;
          left: 45%;
          top: 48%;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 50%;
          box-shadow:
            0 0 0 80px rgba(255,255,255,0.018),
            0 0 0 160px rgba(255,255,255,0.012);
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .brand-button {
          position: relative;
          z-index: 2;
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 0;
          border: 0;
          background: transparent;
          color: ${t.text};
          text-align: left;
          cursor: pointer;
        }

        .brand-mark {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 12px;
          background: rgba(255,255,255,0.055);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 30px rgba(0,0,0,0.25);
        }

        .brand-mark img { width: 31px; height: 31px; object-fit: contain; }
        .brand-copy { display: flex; flex-direction: column; gap: 2px; }
        .brand-copy strong { font-size: 14px; letter-spacing: -0.025em; }
        .brand-copy small {
          color: ${t.secondary};
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .visual-content {
          position: relative;
          z-index: 2;
          width: min(100%, 560px);
          margin: auto 0;
          padding: clamp(64px, 10vh, 120px) 0;
        }

        .eyebrow {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 24px;
          color: ${t.accent};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .visual-title {
          max-width: 540px;
          margin: 0;
          font-size: clamp(42px, 5.1vw, 72px);
          font-weight: 700;
          line-height: 0.98;
          letter-spacing: -0.065em;
          text-wrap: balance;
        }

        .visual-title span {
          color: transparent;
          background: linear-gradient(100deg, ${t.accent} 0%, #73f6cd 45%, #9f93ff 100%);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .visual-description {
          max-width: 480px;
          margin: 26px 0 36px;
          color: ${t.secondary};
          font-size: 15px;
          line-height: 1.7;
          letter-spacing: -0.01em;
        }

        .proof-list { display: grid; gap: 13px; }
        .proof-item {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #c5c5c9;
          font-size: 12.5px;
          font-weight: 500;
        }

        .proof-check {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(0,229,160,0.2);
          border-radius: 50%;
          background: ${t.accentSoft};
          color: ${t.accent};
        }

        .visual-footer {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          color: ${t.tertiary};
          font-size: 10px;
          letter-spacing: 0.02em;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          width: fit-content;
          padding: 7px 10px;
          border: 1px solid ${t.border};
          border-radius: 999px;
          background: rgba(255,255,255,0.025);
          color: ${t.secondary};
          font-size: 10px;
          font-weight: 600;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${t.accent};
          box-shadow: 0 0 0 4px rgba(0,229,160,0.1), 0 0 12px rgba(0,229,160,0.45);
        }

        .login-form-side {
          min-width: 0;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px clamp(28px, 7vw, 112px);
          position: relative;
          background:
            radial-gradient(circle at 50% 45%, rgba(0,229,160,0.035), transparent 34%),
            ${t.bg};
        }

        .mobile-header { display: none; }
        .login-card { width: min(100%, 430px); position: relative; z-index: 1; }

        .form-heading { margin-bottom: 30px; }
        .form-kicker {
          margin: 0 0 10px;
          color: ${t.accent};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .form-heading h1 {
          margin: 0 0 10px;
          font-size: clamp(30px, 3vw, 38px);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.05em;
        }

        .form-heading p {
          margin: 0;
          color: ${t.secondary};
          font-size: 13.5px;
          line-height: 1.6;
        }

        .auth-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .auth-option {
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid ${t.border};
          border-radius: 11px;
          background: ${t.surface};
          color: #d9d9dc;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
        }

        .auth-option:hover {
          border-color: ${t.borderStrong};
          background: ${t.surfaceStrong};
          transform: translateY(-1px);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 22px 0;
          color: ${t.tertiary};
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .divider::before, .divider::after { content: ''; height: 1px; flex: 1; background: ${t.border}; }
        .login-form { display: grid; gap: 17px; }
        .field { display: grid; gap: 7px; }
        .field-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .field label { color: #c7c7cb; font-size: 11px; font-weight: 650; letter-spacing: 0.01em; }

        .text-button {
          padding: 2px;
          border: 0;
          background: transparent;
          color: ${t.accent};
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .input-shell { position: relative; }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: ${t.tertiary};
          pointer-events: none;
          transition: color 160ms ease;
        }

        .login-input {
          width: 100%;
          height: 48px;
          padding: 0 44px 0 42px;
          border: 1px solid ${t.border};
          border-radius: 12px;
          outline: 0;
          background: rgba(255,255,255,0.035);
          color: ${t.text};
          font-size: 13px;
          letter-spacing: -0.01em;
          caret-color: ${t.accent};
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .login-input::placeholder { color: #505055; }
        .login-input:hover { border-color: rgba(255,255,255,0.14); }
        .login-input:focus {
          border-color: rgba(0,229,160,0.7);
          background: rgba(0,229,160,0.035);
          box-shadow: 0 0 0 4px rgba(0,229,160,0.09);
        }
        .input-shell:focus-within .input-icon { color: ${t.accent}; }
        .input-shell.has-error .login-input {
          border-color: rgba(255,105,97,0.65);
          box-shadow: 0 0 0 4px rgba(255,105,97,0.07);
        }

        .password-toggle {
          position: absolute;
          right: 9px;
          top: 50%;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          transform: translateY(-50%);
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: ${t.tertiary};
          cursor: pointer;
        }
        .password-toggle:hover { color: ${t.secondary}; background: rgba(255,255,255,0.045); }

        .field-error { margin: 0; color: ${t.danger}; font-size: 10.5px; line-height: 1.4; }
        .form-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }

        .remember-control {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: ${t.secondary};
          font-size: 11px;
          cursor: pointer;
          user-select: none;
        }
        .remember-control input { position: absolute; opacity: 0; pointer-events: none; }
        .custom-checkbox {
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          border: 1px solid ${remember ? "rgba(0,229,160,0.65)" : t.borderStrong};
          border-radius: 5px;
          background: ${remember ? t.accentSoft : t.surface};
          color: ${t.accent};
          transition: all 160ms ease;
        }

        .submit-button {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 1px;
          border: 0;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          background: linear-gradient(135deg, #21efad, ${t.accent});
          color: #042018;
          font-size: 12.5px;
          font-weight: 750;
          letter-spacing: -0.01em;
          cursor: pointer;
          box-shadow: 0 10px 28px rgba(0,229,160,0.16), inset 0 1px 0 rgba(255,255,255,0.45);
          transition: filter 160ms ease, box-shadow 160ms ease;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%);
          transform: translateX(-110%);
          transition: transform 600ms ${`cubic-bezier(${ease2.join(",")})`};
        }
        .submit-button:hover::before { transform: translateX(110%); }
        .submit-button:hover { filter: brightness(1.04); box-shadow: 0 14px 38px rgba(0,229,160,0.23); }
        .submit-button:disabled { cursor: wait; filter: saturate(0.75); }
        .submit-button > * { position: relative; z-index: 1; }

        .notice {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px 12px;
          border: 1px solid ${t.border};
          border-radius: 10px;
          background: ${t.surface};
          color: ${t.secondary};
          font-size: 10.5px;
          line-height: 1.5;
        }

        .security-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid ${t.border};
          color: ${t.tertiary};
          font-size: 10px;
          line-height: 1.55;
        }
        .security-note svg { flex: 0 0 auto; margin-top: 1px; color: ${t.secondary}; }
        .security-note strong { color: ${t.secondary}; font-weight: 600; }

        .form-footer {
          position: absolute;
          right: clamp(28px, 4vw, 56px);
          bottom: 24px;
          left: clamp(28px, 4vw, 56px);
          display: flex;
          justify-content: center;
          gap: 18px;
          color: ${t.tertiary};
          font-size: 9.5px;
        }
        .form-footer button { padding: 0; border: 0; background: none; color: inherit; cursor: pointer; }
        .form-footer button:hover { color: ${t.secondary}; }

        @media (max-width: 980px) {
          .login-page { grid-template-columns: 1fr; overflow: auto; }
          .login-visual { display: none; }
          .login-form-side {
            min-height: 100svh;
            justify-content: flex-start;
            padding: 24px clamp(20px, 7vw, 64px) 82px;
            background:
              radial-gradient(circle at 15% 0%, rgba(0,229,160,0.1), transparent 28%),
              radial-gradient(circle at 100% 78%, rgba(103,80,255,0.09), transparent 28%),
              ${t.bg};
          }
          .mobile-header {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: clamp(52px, 10vh, 96px);
          }
          .login-card { margin: 0 auto; }
          .form-footer { position: static; margin-top: auto; padding-top: 52px; }
        }

        @media (max-width: 520px) {
          .login-form-side { padding: 18px 18px 32px; }
          .mobile-header { margin-bottom: 48px; }
          .mobile-header .status-pill { display: none; }
          .auth-options { grid-template-columns: 1fr; }
          .form-heading { margin-bottom: 25px; }
          .form-row { align-items: flex-start; }
          .form-footer { flex-wrap: wrap; row-gap: 8px; }
        }

        @media (max-height: 760px) and (min-width: 981px) {
          .login-form-side { padding-top: 28px; padding-bottom: 44px; }
          .form-heading { margin-bottom: 22px; }
          .divider { margin: 17px 0; }
          .security-note { margin-top: 18px; padding-top: 16px; }
          .visual-content { padding: 48px 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-page *, .login-page *::before, .login-page *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <section className="login-visual" aria-label="Sobre o Iron Ledger">
        <Brand />

        <motion.div
          className="visual-content"
          {...entrance}
          transition={{ duration: 0.8, ease: ease2 }}
        >
          <div className="eyebrow">
            <Sparkles size={13} />O sistema operacional das suas finanças
          </div>
          <h2 className="visual-title">
            Clareza para decidir. <span>Controle para crescer.</span>
          </h2>
          <p className="visual-description">
            Estoque, transações, auditoria e inteligência preditiva em uma única
            plataforma construída para operações que não podem parar.
          </p>

          <div className="proof-list">
            {proofPoints.map((item, index) => (
              <motion.div
                className="proof-item"
                key={item}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.35 + index * 0.09,
                  ease: ease2,
                }}
              >
                <span className="proof-check">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="visual-footer">
          <StatusPill />
          <span>Protegido por Iron Ledger Security</span>
        </div>
      </section>

      <section className="login-form-side" aria-labelledby="login-title">
        <div className="mobile-header">
          <Brand compact />
          <StatusPill />
        </div>

        <motion.div
          className="login-card"
          {...entrance}
          transition={{ duration: 0.62, delay: 0.08, ease: ease2 }}
        >
          <header className="form-heading">
            <p className="form-kicker">Acesso seguro</p>
            <h1 id="login-title">Bem-vindo de volta.</h1>
            <p>Entre no seu workspace para continuar sua operação.</p>
          </header>

          <div className="auth-options">
            <motion.button
              type="button"
              className="auth-option"
              whileTap={{ scale: 0.98 }}
              transition={spring4}
              onClick={() => handleEnterpriseAccess("SSO")}
            >
              <ShieldCheck size={16} />
              Continuar com SSO
            </motion.button>
            <motion.button
              type="button"
              className="auth-option"
              whileTap={{ scale: 0.98 }}
              transition={spring4}
              onClick={() => handleEnterpriseAccess("passkey")}
            >
              <Fingerprint size={16} />
              Usar passkey
            </motion.button>
          </div>

          <div className="divider">ou entre com email</div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <div className="field-header">
                <label htmlFor={emailId}>Email corporativo</label>
              </div>
              <div className={`input-shell${emailError ? " has-error" : ""}`}>
                <Mail className="input-icon" size={16} aria-hidden="true" />
                <input
                  ref={emailRef}
                  id={emailId}
                  className="login-input"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="voce@empresa.com"
                  value={email}
                  disabled={isLoading}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? `${emailId}-error` : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (submitted) setSubmitted(false);
                  }}
                />
              </div>
              <AnimatePresence initial={false}>
                {emailError && (
                  <motion.p
                    id={`${emailId}-error`}
                    className="field-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="field">
              <div className="field-header">
                <label htmlFor={passwordId}>Senha</label>
                <button
                  className="text-button"
                  type="button"
                  onClick={handleForgotPassword}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div
                className={`input-shell${passwordError ? " has-error" : ""}`}
              >
                <KeyRound className="input-icon" size={16} aria-hidden="true" />
                <input
                  id={passwordId}
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  disabled={isLoading}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={
                    passwordError ? `${passwordId}-error` : undefined
                  }
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (submitted) setSubmitted(false);
                  }}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <AnimatePresence initial={false}>
                {passwordError && (
                  <motion.p
                    id={`${passwordId}-error`}
                    className="field-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {passwordError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="form-row">
              <label className="remember-control">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span className="custom-checkbox" aria-hidden="true">
                  {remember && <Check size={11} strokeWidth={3} />}
                </span>
                Manter conectado neste dispositivo
              </label>
            </div>

            <AnimatePresence initial={false}>
              {notice && (
                <motion.div
                  className="notice"
                  role="status"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <CheckCircle2 size={14} color={t.accent} />
                  <span>{notice}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              className="submit-button"
              type="submit"
              disabled={isLoading}
              whileTap={isLoading ? undefined : { scale: 0.985 }}
              transition={spring4}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verificando acesso...
                </>
              ) : (
                <>
                  Entrar no Iron Ledger
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <div className="security-note">
            <LockKeyhole size={15} />
            <span>
              <strong>Sessão protegida.</strong> Este acesso pode ser registrado
              no módulo de auditoria para segurança e conformidade da sua
              organização.
            </span>
          </div>
        </motion.div>

        <footer className="form-footer">
          <button type="button" onClick={() => router.push("/")}>
            Privacidade
          </button>
          <button type="button" onClick={() => router.push("/")}>
            Segurança
          </button>
          <button type="button" onClick={() => router.push("/")}>
            Suporte
          </button>
          <span>© 2026 Iron Ledger</span>
        </footer>
      </section>
    </main>
  );
}
