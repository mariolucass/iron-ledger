const relativeTime = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

/** "há 5 minutos", "ontem"… a partir de uma data ISO. */
export function formatRelativeTime(value: string): string {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1_000);
  if (!Number.isFinite(seconds)) return new Date(value).toLocaleString("pt-BR");
  if (Math.abs(seconds) < 60) return relativeTime.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour");
  return relativeTime.format(Math.round(hours / 24), "day");
}
