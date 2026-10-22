"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Shield, User, Webhook, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { spring1 } from "@/shared/lib/animation";
import { Button } from "@/shared/ui/kit/button";
import { PageHeader } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { useSettings } from "../model/use-settings";
import { AccountPanel } from "./components/AccountPanel";
import { IntegrationsPanel } from "./components/IntegrationsPanel";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { SecurityPanel } from "./components/SecurityPanel";

type Tab = "ACCOUNT" | "SECURITY" | "NOTIFICATIONS" | "INTEGRATIONS";

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "ACCOUNT", label: "Perfil e Conta", icon: User },
  { id: "SECURITY", label: "Segurança", icon: Shield },
  { id: "NOTIFICATIONS", label: "Notificações", icon: Bell },
  { id: "INTEGRATIONS", label: "API e Integrações", icon: Webhook },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ACCOUNT");
  const settings = useSettings();
  const { profile } = settings;

  const renderPanel = () => {
    if (activeTab === "INTEGRATIONS") return <IntegrationsPanel />;
    if (settings.loading) {
      return <div className="min-h-80 animate-pulse rounded-xl bg-ink/[0.035]" aria-label="Carregando configurações" />;
    }
    if (!profile) {
      return (
        <div role="alert" className="grid justify-items-start gap-4">
          <p className="m-0 text-sm text-destructive">{settings.error || "Não foi possível carregar suas configurações."}</p>
          <Button variant="outline" onClick={() => void settings.reload()}>Tentar novamente</Button>
        </div>
      );
    }
    switch (activeTab) {
      case "ACCOUNT":
        return <AccountPanel profile={profile} onSave={settings.saveProfile} />;
      case "SECURITY":
        return (
          <SecurityPanel
            profile={profile}
            onChangePassword={settings.changePassword}
            onSavePreferences={settings.savePreferences}
          />
        );
      case "NOTIFICATIONS":
        return <NotificationsPanel profile={profile} onSave={settings.savePreferences} />;
    }
  };

  return (
    <Layout title="Configurações do Sistema">
      <PageHeader title="Configurações" description="Preferências da conta, segurança, notificações e integrações." />
      <div className="grid max-w-[1200px] items-start gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <nav
          aria-label="Seções de configurações"
          className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-3 lg:flex-col"
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveTab(id)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-0 px-4 py-3 text-left text-sm whitespace-nowrap transition-colors ${isActive ? "bg-primary-soft font-semibold text-primary" : "bg-transparent font-medium text-muted-foreground hover:bg-card-hover hover:text-foreground"}`}
              >
                <Icon size={18} aria-hidden /> {label}
              </button>
            );
          })}
        </nav>

        <div className="min-h-[500px] rounded-xl border border-border bg-card p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring1}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
