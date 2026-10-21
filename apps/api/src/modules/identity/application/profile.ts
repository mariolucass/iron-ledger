import { isIP } from "node:net";
import { z } from "zod";

export const MAX_ALLOWED_IPS = 50;

export const preferencesSchema = z.object({
  notifications: z
    .object({ emailAlerts: z.boolean(), slackAlerts: z.boolean() })
    .partial(),
  security: z
    .object({
      strictIp: z.boolean(),
      allowedIps: z
        .array(z.string().trim().refine((ip) => isIP(ip) !== 0, "Endereço IP inválido"))
        .max(MAX_ALLOWED_IPS),
    })
    .partial(),
}).partial();

export type PreferencesPatch = z.infer<typeof preferencesSchema>;

export type Preferences = {
  notifications: { emailAlerts: boolean; slackAlerts: boolean };
  security: { strictIp: boolean; allowedIps: string[] };
};

export const defaultPreferences: Preferences = {
  notifications: { emailAlerts: true, slackAlerts: false },
  security: { strictIp: false, allowedIps: [] },
};

/** Lê o JSON salvo tolerando valores ausentes ou malformados. */
export function resolvePreferences(raw: unknown): Preferences {
  const stored = preferencesSchema.safeParse(raw);
  const patch = stored.success ? stored.data : {};
  return {
    notifications: { ...defaultPreferences.notifications, ...patch.notifications },
    security: { ...defaultPreferences.security, ...patch.security },
  };
}

export type Profile = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  locale: string;
  timezone: string;
  roles: string[];
  preferences: Preferences;
};

export type ProfileRecord = Omit<Profile, "preferences"> & { preferences: unknown };

export interface ProfileRepository {
  findById(id: string): Promise<ProfileRecord | null>;
  update(
    id: string,
    data: Partial<Pick<ProfileRecord, "name" | "avatarUrl" | "locale" | "timezone">>,
  ): Promise<ProfileRecord>;
  savePreferences(id: string, preferences: Preferences): Promise<void>;
  findPasswordHash(id: string): Promise<string | null>;
  savePasswordHash(id: string, passwordHash: string): Promise<void>;
}

export function toProfile(record: ProfileRecord): Profile {
  return { ...record, preferences: resolvePreferences(record.preferences) };
}
