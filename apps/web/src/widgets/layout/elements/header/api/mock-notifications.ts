import { Bell, CheckCircle2, Zap } from "lucide-react";
import type { AppNotification } from "../model/notification-types";

export const mockNotifications: AppNotification[] = [
  {
    id: 1,
    icon: Bell,
    tone: "destructive",
    title: "Alerta Crítico",
    body: "Nike Air Zoom abaixo do mínimo — Loja Centro",
    time: "há 2 min",
    unread: true,
  },
  {
    id: 2,
    icon: CheckCircle2,
    tone: "primary",
    title: "Transação confirmada",
    body: "TXN-00483921 finalizada com sucesso",
    time: "há 5 min",
    unread: true,
  },
  {
    id: 3,
    icon: Zap,
    tone: "warning",
    title: "Previsão atualizada",
    body: "Modelo ML retreinado — precisão 94,2%",
    time: "há 18 min",
    unread: false,
  },
];

export const unreadNotificationsCount = mockNotifications.filter(({ unread }) => unread).length;
