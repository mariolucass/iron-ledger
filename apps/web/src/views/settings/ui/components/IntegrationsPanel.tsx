"use client";

import { colors as theme } from "@/shared/config/tokens";
import { CheckCircle, Key } from "lucide-react";
import { motion } from "framer-motion";
import { spring1 } from "@/shared/lib/animation";

// Fase 5 (chaves de API e webhooks) ainda não está ligada ao backend: dados de exemplo.
export function IntegrationsPanel() {
  return (
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
}
