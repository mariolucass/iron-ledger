import { CheckCircle2, Database, GitBranch, Globe, Package, Shield, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import type { LandingIcon, LandingTone } from "../model/types";

export const landingIcons = {
  check: CheckCircle2,
  database: Database,
  "git-branch": GitBranch,
  globe: Globe,
  package: Package,
  shield: Shield,
  "trending-up": TrendingUp,
  zap: Zap,
} satisfies Record<LandingIcon, LucideIcon>;

export const landingTones = {
  blue: { text: "text-info", soft: "bg-info-soft", border: "border-info/30", hover: "hover:border-info/40" },
  emerald: { text: "text-emerald-400", soft: "bg-emerald-400/10", border: "border-emerald-400/30", hover: "hover:border-emerald-400/40" },
  orange: { text: "text-orange-400", soft: "bg-orange-400/10", border: "border-orange-400/30", hover: "hover:border-orange-400/40" },
  primary: { text: "text-primary", soft: "bg-primary-soft", border: "border-primary/30", hover: "hover:border-primary/40" },
  purple: { text: "text-purple", soft: "bg-purple-soft", border: "border-purple/30", hover: "hover:border-purple/40" },
  red: { text: "text-red-400", soft: "bg-red-400/10", border: "border-red-400/30", hover: "hover:border-red-400/40" },
  yellow: { text: "text-yellow-400", soft: "bg-yellow-400/10", border: "border-yellow-400/30", hover: "hover:border-yellow-400/40" },
} satisfies Record<LandingTone, { border: string; hover: string; soft: string; text: string }>;
