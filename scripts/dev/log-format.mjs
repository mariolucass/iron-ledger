import { bold, destructive, foreground, muted, orange, primary, subtle } from "../lib/terminal.mjs";

const LEVELS = {
  10: "trace", 20: "debug", 30: "info", 40: "warn", 50: "error", 60: "fatal",
  trace: "trace", debug: "debug", info: "info", warn: "warn", error: "error", fatal: "fatal",
};

const badge = {
  trace: (t) => subtle(t),
  debug: (t) => muted(t),
  info: (t) => primary(t),
  warn: (t) => orange(t),
  error: (t) => destructive(t),
  fatal: (t) => bold(destructive(t)),
};

const HIDDEN = new Set(["level", "time", "message", "msg", "service", "env", "pid", "name", "hostname", "err", "error"]);

const clock = (time) => {
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? "        " : date.toLocaleTimeString("pt-BR", { hour12: false });
};

const short = (value) => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
};

/**
 * Converte uma linha de log estruturado (pino) em texto legível; devolve `null` quando a linha
 * não é JSON de log, para ser exibida como está.
 */
export function parseStructuredLog(line) {
  if (!line.startsWith("{") || !line.endsWith("}")) return null;
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }
  const level = LEVELS[entry.level];
  const message = entry.message ?? entry.msg;
  if (!level || typeof message !== "string") return null;

  const fields = Object.entries(entry)
    .filter(([key]) => !HIDDEN.has(key))
    .map(([key, value]) => `${subtle(`${key}=`)}${muted(short(value))}`);
  const err = entry.err ?? entry.error;
  const text = [
    `${muted(clock(entry.time))}  ${badge[level](level.toUpperCase().padEnd(5))}  ${level === "fatal" || level === "error" ? bold(message) : foreground(message)}`,
    ...fields,
  ].join("  ");
  return { level, text, detail: err?.message ? `${destructive("↳")} ${destructive(err.message)}` : null };
}
