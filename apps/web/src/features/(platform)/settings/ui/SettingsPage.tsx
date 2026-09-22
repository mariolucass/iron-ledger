"use client";

import { colors as theme } from "@/shared/config/tokens";
import {
  Bell,
  CheckCircle,
  CreditCard,
  Key,
  Plus,
  Save,
  Shield,
  Smartphone,
  User,
  Webhook,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { spring1 } from "@/shared/lib/animation";
import { Layout } from "@/widgets/layout/Layout";

// 1. Tema "Cryptix" Integrado

// 2. Sub-componentes Reutilizáveis
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.textPrimary,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              maxWidth: "80%",
            }}
          >
            {description}
          </div>
        )}
      </div>
      <button
        onClick={onChange}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? theme.accentGlow : theme.surface,
          border: `1px solid ${checked ? theme.accent : theme.border}`,
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 22 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: checked ? theme.accent : theme.textSecondary,
            boxShadow: checked ? `0 0 8px ${theme.accent}` : "none",
            transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        />
      </button>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  placeholder,
  disabled = false,
}: any) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: theme.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          background: disabled ? "rgba(0,0,0,0.4)" : theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: "12px 16px",
          color: disabled ? theme.textSecondary : theme.textPrimary,
          fontSize: 14,
          outline: "none",
          transition: "all 0.2s",
          opacity: disabled ? 0.7 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = theme.accent;
            e.currentTarget.style.boxShadow = `0 0 0 1px ${theme.accent}, inset 0 2px 4px rgba(0,0,0,0.2)`;
          }
        }}
        onBlur={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.boxShadow = "none";
          }
        }}
        readOnly={disabled}
      />
    </div>
  );
}

// 3. Componente Principal
type Tab = "ACCOUNT" | "SECURITY" | "NOTIFICATIONS" | "INTEGRATIONS";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ACCOUNT");

  // Mock States para os Toggles
  const [toggles, setToggles] = useState({
    emailAlerts: true,
    slackAlerts: false,
    mfaEnabled: true,
    strictIp: false,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: "ACCOUNT", label: "Perfil e Conta", icon: User },
    { id: "SECURITY", label: "Segurança", icon: Shield },
    { id: "NOTIFICATIONS", label: "Notificações", icon: Bell },
    { id: "INTEGRATIONS", label: "API e Integrações", icon: Webhook },
  ];

  // Renderizadores de Painel
  const renderAccountPanel = () => (
    <motion.div
      key="ACCOUNT"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring1}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: theme.textPrimary,
          margin: "0 0 24px",
        }}
      >
        Informações da Conta
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 32,
          paddingBottom: 32,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: theme.surfaceHover,
            border: `2px dashed ${theme.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            cursor: "pointer",
          }}
        >
          <User size={32} color={theme.textSecondary} />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: theme.accent,
              borderRadius: "50%",
              padding: 4,
              display: "flex",
              boxShadow: `0 0 8px ${theme.accentGlow}`,
            }}
          >
            <Plus size={12} color="#000" />
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: theme.textPrimary,
              marginBottom: 4,
            }}
          >
            Administrador do Sistema
          </div>
          <div style={{ fontSize: 13, color: theme.textSecondary }}>
            Formatos suportados: JPEG, PNG. Max 2MB.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <InputField label="Nome Completo" value="Administrador Iron Ledger" />
        <InputField
          label="Endereço de Email"
          value="admin@ironledger.com"
          disabled
        />
      </div>

      <InputField label="Cargo / Função (Role)" value="SUPERADMIN" disabled />

      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
      >
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: theme.accent,
            color: "#000",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
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
          <Save size={16} /> Guardar Alterações
        </button>
      </div>
    </motion.div>
  );

  const renderSecurityPanel = () => (
    <motion.div
      key="SECURITY"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring1}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: theme.textPrimary,
          margin: "0 0 24px",
        }}
      >
        Configurações de Segurança
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Toggle
          label="Autenticação de Dois Fatores (2FA)"
          description="Requer um código gerado por uma app (ex: Google Authenticator) além da password."
          checked={toggles.mfaEnabled}
          onChange={() => handleToggle("mfaEnabled")}
        />
        <Toggle
          label="Restrição de IP (Strict IP Binding)"
          description="Limita o acesso à API e ao painel apenas aos endereços IP na whitelist."
          checked={toggles.strictIp}
          onChange={() => handleToggle("strictIp")}
        />
      </div>

      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.textPrimary,
          margin: "0 0 16px",
        }}
      >
        Sessões Ativas
      </h3>
      <div
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {[
          {
            device: "MacBook Pro - Chrome",
            ip: "10.0.1.42",
            location: "Lisboa, Portugal",
            current: true,
          },
          {
            device: "iPhone 13 - Safari",
            ip: "192.168.1.10",
            location: "Lisboa, Portugal",
            current: false,
          },
        ].map((session, i) => (
          <div
            key={i}
            style={{
              padding: "16px",
              borderBottom: i === 0 ? `1px solid ${theme.border}` : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  background: theme.surfaceHover,
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                {session.device.includes("iPhone") ? (
                  <Smartphone size={18} color={theme.textSecondary} />
                ) : (
                  <CreditCard size={18} color={theme.textSecondary} />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.textPrimary,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {session.device}
                  {session.current && (
                    <span
                      style={{
                        background: theme.accentGlow,
                        color: theme.accent,
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      SESSÃO ATUAL
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.textSecondary,
                    fontFamily: "var(--font-jetbrains-mono)",
                  }}
                >
                  {session.ip} · {session.location}
                </div>
              </div>
            </div>
            {!session.current && (
              <button
                style={{
                  background: "transparent",
                  border: `1px solid ${theme.danger}40`,
                  color: theme.danger,
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = theme.dangerGlow)
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Revogar
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderNotificationsPanel = () => (
    <motion.div
      key="NOTIFICATIONS"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring1}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: theme.textPrimary,
          margin: "0 0 24px",
        }}
      >
        Preferências de Notificação
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Toggle
          label="Alertas por Email"
          description="Receber resumos diários e alertas de anomalias no sistema."
          checked={toggles.emailAlerts}
          onChange={() => handleToggle("emailAlerts")}
        />
        <Toggle
          label="Integração com Slack"
          description="Enviar notificações em tempo real de falhas nas Sagas e rupturas de stock para o canal #ops-alerts."
          checked={toggles.slackAlerts}
          onChange={() => handleToggle("slackAlerts")}
        />
      </div>

      <div
        style={{
          marginTop: 32,
          background: theme.infoGlow,
          border: `1px solid rgba(59, 130, 246, 0.3)`,
          borderRadius: 8,
          padding: 16,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <Bell size={18} color={theme.info} style={{ marginTop: 2 }} />
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.info,
              marginBottom: 4,
            }}
          >
            Notificações In-App Ativas
          </div>
          <div
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              lineHeight: 1.5,
            }}
          >
            Os alertas críticos (como Falhas de Compensação ou Previsão de
            Ruptura) não podem ser desativados e aparecerão sempre na barra
            superior do painel.
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderIntegrationsPanel = () => (
    <motion.div
      key="INTEGRATIONS"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring1}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: theme.textPrimary,
          margin: "0 0 24px",
        }}
      >
        API e Webhooks
      </h2>

      <div
        style={{
          background: theme.surfaceHover,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.textPrimary,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Key size={16} color={theme.accent} /> Chave de API Principal
          </div>
          <div
            style={{
              fontSize: 13,
              fontFamily: "var(--font-jetbrains-mono)",
              color: theme.textSecondary,
              background: theme.bg,
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
            }}
          >
            sk_live_***************************a9f2
          </div>
        </div>
        <button
          style={{
            background: "transparent",
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            padding: "8px 16px",
            color: theme.textPrimary,
            cursor: "pointer",
            fontSize: 12,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = theme.accent;
            e.currentTarget.style.color = theme.accent;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.color = theme.textPrimary;
          }}
        >
          Rodar Chave
        </button>
      </div>

      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.textPrimary,
          margin: "0 0 16px",
        }}
      >
        Endpoints de Webhook Configurados
      </h3>
      <div
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.textPrimary,
                marginBottom: 4,
              }}
            >
              Serviço de Log Externo (Datadog)
            </div>
            <div
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              https://api.datadoghq.eu/api/v1/logs
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: theme.accent,
                background: theme.accentGlow,
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              <CheckCircle size={10} /> ATIVO
            </span>
          </div>
        </div>
      </div>

      <button
        style={{
          marginTop: 16,
          background: "transparent",
          border: `1px dashed ${theme.border}`,
          borderRadius: 8,
          padding: "12px",
          color: theme.textSecondary,
          cursor: "pointer",
          fontSize: 13,
          width: "100%",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = theme.textPrimary;
          e.currentTarget.style.color = theme.textPrimary;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.color = theme.textSecondary;
        }}
      >
        + Adicionar Novo Endpoint de Webhook
      </button>
    </motion.div>
  );

  return (
    <Layout title="Configurações do Sistema">
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 40,
          alignItems: "start",
          maxWidth: 1200,
        }}
      >
        {/* Menu Lateral das Configurações */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 12,
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                whileHover={
                  !isActive
                    ? { backgroundColor: theme.surfaceHover, color: theme.textPrimary }
                    : undefined
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: isActive ? theme.accentGlow : "transparent",
                  border: "none",
                  borderRadius: 8,
                  color: isActive ? theme.accent : theme.textSecondary,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.2s",
                }}
              >
                <Icon size={18} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Área de Conteúdo Dinâmico */}
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 40,
            minHeight: 500,
          }}
        >
          <AnimatePresence mode="wait">
            {activeTab === "ACCOUNT" && renderAccountPanel()}
            {activeTab === "SECURITY" && renderSecurityPanel()}
            {activeTab === "NOTIFICATIONS" && renderNotificationsPanel()}
            {activeTab === "INTEGRATIONS" && renderIntegrationsPanel()}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
