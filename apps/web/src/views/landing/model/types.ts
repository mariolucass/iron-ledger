export type LandingIcon =
  | "check"
  | "database"
  | "git-branch"
  | "globe"
  | "package"
  | "shield"
  | "trending-up"
  | "zap";

export type LandingTone = "blue" | "emerald" | "orange" | "primary" | "purple" | "red" | "yellow";

export interface LandingFeature {
  description: string;
  icon: LandingIcon;
  size: "large" | "small";
  title: string;
  tone: LandingTone;
}

export interface LandingStat {
  duration: number;
  label: string;
  prefix?: string;
  suffix?: string;
  value: number;
}

export interface LandingTestimonial {
  author: string;
  initials: string;
  quote: string;
  role: string;
  stars: number;
  tone: LandingTone;
}

export interface LandingTechnology {
  icon: LandingIcon;
  name: string;
  tone: LandingTone;
}

export interface LandingLinkGroup {
  links: string[];
  title: string;
}

export interface LandingNavLink {
  href: `#${string}`;
  label: string;
}
