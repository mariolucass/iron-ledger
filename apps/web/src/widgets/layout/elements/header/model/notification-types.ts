import type { LucideIcon } from "lucide-react";

export type NotificationTone = "destructive" | "primary" | "warning";

export interface AppNotification {
  body: string;
  icon: LucideIcon;
  id: number;
  time: string;
  title: string;
  tone: NotificationTone;
  unread: boolean;
}
