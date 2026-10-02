import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

export interface NavigationItem {
  badge?: number;
  icon: LucideIcon;
  label: string;
  path: Route;
  section: string;
  shortcut?: string;
}

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

export interface LayoutProps {
  children: React.ReactNode;
  title: string;
}
