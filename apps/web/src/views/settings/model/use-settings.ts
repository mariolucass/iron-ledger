"use client";

import { useCallback, useEffect, useState } from "react";
import {
  userApi,
  type ChangePasswordInput,
  type Preferences,
  type PreferencesPatch,
  type Profile,
  type UpdateProfileInput,
} from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";

function mergePreferences(current: Preferences, patch: PreferencesPatch): Preferences {
  return {
    notifications: { ...current.notifications, ...patch.notifications },
    security: { ...current.security, ...patch.security },
  };
}

export function useSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProfile(await withSession(userApi.me()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar suas configurações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const saveProfile = async (input: UpdateProfileInput) => {
    setProfile(await withSession(userApi.updateMe(input)));
  };

  /** Atualização otimista: aplica já na tela e desfaz se a API recusar. */
  const savePreferences = async (patch: PreferencesPatch) => {
    if (!profile) return;
    const previous = profile.preferences;
    setProfile({ ...profile, preferences: mergePreferences(previous, patch) });
    try {
      const saved = await withSession(userApi.updatePreferences(patch));
      setProfile((current) => (current ? { ...current, preferences: saved } : current));
    } catch (reason) {
      setProfile((current) => (current ? { ...current, preferences: previous } : current));
      throw reason;
    }
  };

  const changePassword = async (input: ChangePasswordInput) => {
    await withSession(userApi.changePassword(input));
  };

  return { profile, loading, error, reload: load, saveProfile, savePreferences, changePassword };
}

export type SettingsApi = ReturnType<typeof useSettings>;
