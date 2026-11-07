/**
 * Componentes de interface para o terminal: logo, seções, painéis, spinner e durações.
 * Toda a saída "bonita" dos scripts passa por aqui, para o visual ficar consistente.
 */
import {
  info_,
  primary,
  bold,
  columns,
  dim,
  enabled,
  gradient,
  gray,
  green,
  orange,
  padVisible,
  red,
  stripAnsi,
  visibleLength,
} from "./terminal.mjs";

export const symbols = {
  on: green("●"),
  off: gray("○"),
  warn: orange("▲"),
  ok: green("✓"),
  fail: red("✗"),
  step: primary("›"),
  stop: orange("◌"),
};

// Fonte compacta de duas linhas feita de meios-blocos.
const GLYPHS = {
  I: ["█", "█"],
  R: ["█▀█", "█▀▄"],
  O: ["█▀█", "█▄█"],
  N: ["█▄ █", "█ ▀█"],
  L: ["█  ", "█▄▄"],
  E: ["█▀▀", "██▄"],
  D: ["█▀▄", "█▄▀"],
  G: ["█▀▀", "█▄█"],
};

function wordmark(text) {
  const rows = ["", ""];
  for (const char of text) {
    if (char === " ") {
      rows.forEach((_, i) => (rows[i] += "   "));
      continue;
    }
    const glyph = GLYPHS[char];
    const width = Math.max(...glyph.map((line) => line.length));
    glyph.forEach((line, i) => (rows[i] += `${line.padEnd(width)} `));
  }
  return rows.map((row) => row.trimEnd());
}

/** Logo com degradê do verde primário ao azul de info e uma linha de contexto abaixo. */
export function logo(subtitle) {
  const rows = wordmark("IRON LEDGER");
  const width = Math.max(...rows.map((row) => row.length));
  const lines = rows.map((row) => `  ${bold(gradient(row.padEnd(width), "primary", "info"))}`);
  if (subtitle) lines.push(`  ${gray(subtitle)}`);
  return lines.join("\n");
}

export const rule = (width = Math.min(columns(), 64)) => gray(`  ${"─".repeat(width - 2)}`);

export const section = (title, hint) => `  ${bold(title)}${hint ? ` ${gray(hint)}` : ""}`;

export function row(icon, label, detail, { labelWidth = 16 } = {}) {
  return `  ${icon}  ${padVisible(label, labelWidth)} ${detail}`;
}

export function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const TONES = {
  error: { color: red, icon: "✗" },
  warn: { color: orange, icon: "▲" },
  info: { color: info_, icon: "●" },
  success: { color: green, icon: "✓" },
};

function wrapLine(line, width) {
  if (stripAnsi(line) !== line || visibleLength(line) <= width) return [line];
  const out = [];
  let current = "";
  for (const word of line.split(" ")) {
    if (current && visibleLength(`${current} ${word}`) > width) {
      out.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) out.push(current);
  return out;
}

/**
 * Painel com bordas arredondadas.
 * `body` é uma lista de linhas já estilizadas; "" vira linha em branco.
 */
export function panel({ tone = "info", title, body = [] }) {
  const { color, icon } = TONES[tone];
  const max = Math.max(48, Math.min(columns(), 78));
  const wrapped = body.flatMap((line) => wrapLine(line, max - 6));
  const inner = Math.min(
    max - 2,
    Math.max(44, visibleLength(title) + 6, ...wrapped.map((line) => visibleLength(line) + 4)),
  );
  const head = ` ${color(icon)} ${bold(title)} `;
  const top =
    color("╭─") + head + color(`${"─".repeat(Math.max(1, inner - visibleLength(head) - 1))}╮`);
  const side = color("│");
  const blank = `${side}${" ".repeat(inner)}${side}`;
  const lines = wrapped.map((line) => `${side}  ${padVisible(line, inner - 2)}${side}`);
  return ["", top, blank, ...lines, blank, color(`╰${"─".repeat(inner)}╯`), ""].join("\n");
}

/** Linha de status de uma dependência: "● PostgreSQL  localhost:5433  disponível". */
export function statusLine({ ok, starting, label, target }) {
  const state = ok ? green("disponível") : starting ? orange("iniciando…") : red("indisponível");
  return `${ok ? symbols.on : starting ? orange("●") : red("○")}  ${padVisible(label, 12)} ${padVisible(gray(target), 18)} ${state}`;
}

/** Passos de resolução numerados: comando em destaque e uma explicação curta. */
export function stepLines(steps) {
  return steps.flatMap(({ command, hint }, index) => [
    `${gray(String(index + 1))}  ${bold(primary(command))}`,
    ...(hint ? [`   ${gray(hint)}`] : []),
  ]);
}

/** Spinner de uma linha; fora de um TTY imprime apenas o início e o resultado. */
export function spinner(text, stream = process.stdout) {
  const interactive = Boolean(stream.isTTY) && enabled;
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const startedAt = Date.now();
  let frame = 0;
  let timer;
  const clear = () => interactive && stream.write("\r\u001b[K");

  if (interactive) {
    stream.write("\u001b[?25l");
    timer = setInterval(() => {
      stream.write(`\r  ${primary(frames[frame++ % frames.length])}  ${text}`);
    }, 80);
  } else {
    stream.write(`  ${symbols.step}  ${text}...\n`);
  }

  const finish = (icon, message) => {
    clearInterval(timer);
    clear();
    if (interactive) stream.write("\u001b[?25h");
    stream.write(`  ${icon}  ${message} ${dim(gray(formatDuration(Date.now() - startedAt)))}\n`);
  };

  return {
    succeed: (message = text) => finish(symbols.ok, message),
    fail: (message = text) => finish(symbols.fail, red(message)),
  };
}
