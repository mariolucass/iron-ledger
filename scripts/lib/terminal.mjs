/**
 * Primitivas de terminal: paleta, estilos e medição de texto.
 * Paleta inspirada nas cores de sistema da Apple (truecolor, com fallback para 16 cores).
 */

const forced = Boolean(process.env.FORCE_COLOR) && process.env.FORCE_COLOR !== "0";
export const enabled = (Boolean(process.stdout.isTTY) || forced) && !process.env.NO_COLOR;

const truecolor =
  enabled &&
  (/^(truecolor|24bit)$/i.test(process.env.COLORTERM ?? "") ||
    Boolean(process.env.WT_SESSION) ||
    /^(vscode|iTerm\.app|WezTerm|ghostty)$/i.test(process.env.TERM_PROGRAM ?? ""));

const ESC = "\u001b[";
const wrap = (open, close) => (text) =>
  enabled ? `${ESC}${open}m${text}${ESC}${close}m` : String(text);

/** Cor com RGB (truecolor) e código ANSI equivalente para terminais simples. */
const color = (rgb, basic) => wrap(truecolor ? `38;2;${rgb.join(";")}` : basic, 39);

/** Tokens de apps/web/src/shared/config/theme.ts (tema escuro), em RGB. */
export const palette = {
  primary: [0, 229, 160], // --primary / --chart-1
  info: [96, 165, 250], // --info / --chart-2
  purple: [167, 139, 250], // --purple / --chart-3
  warning: [255, 159, 10], // --warning / --chart-4
  destructive: [255, 69, 58], // --destructive / --chart-5
  foreground: [245, 245, 247], // --foreground
  muted: [134, 134, 139], // --muted-foreground
  subtle: [72, 72, 74], // --subtle-foreground
};

export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const italic = wrap(3, 23);
export const primary = color(palette.primary, 32);
export const info_ = color(palette.info, 34);
export const purple = color(palette.purple, 35);
export const warning = color(palette.warning, 33);
export const destructive = color(palette.destructive, 31);
export const foreground = color(palette.foreground, 97);
export const muted = color(palette.muted, 90);
export const subtle = color(palette.subtle, 90);

/** Cor arbitrária a partir de um token da paleta. */
export const paint = (token) => color(palette[token], 37);

// Apelidos semânticos (mantidos para os scripts existentes).
export const green = primary;
export const teal = primary;
export const cyan = primary;
export const blue = info_;
export const orange = warning;
export const yellow = warning;
export const red = destructive;
export const magenta = purple;
export const gray = muted;
export const white = foreground;

/** Interpola entre duas cores da paleta (0..1); sem truecolor, devolve a cor inicial. */
export function gradient(text, from, to) {
  const chars = [...String(text)];
  if (!truecolor) return color(palette[from], 32)(text);
  return chars
    .map((char, index) => {
      const t = chars.length > 1 ? index / (chars.length - 1) : 0;
      const rgb = palette[from].map((value, i) => Math.round(value + (palette[to][i] - value) * t));
      return `${ESC}38;2;${rgb.join(";")}m${char}`;
    })
    .join("")
    .concat(`${ESC}39m`);
}

const ANSI = /\u001b\[[0-9;]*m/g;
export const stripAnsi = (text) => String(text).replace(ANSI, "");
export const visibleLength = (text) => [...stripAnsi(text)].length;
export const padVisible = (text, width) =>
  text + " ".repeat(Math.max(0, width - visibleLength(text)));
export const columns = () => Math.min(process.stdout.columns || 80, 100);

export const info = (message) => console.log(`${primary("›")} ${message}`);
export const success = (message) => console.log(`${green("✓")} ${message}`);
export const warn = (message) => console.log(`${orange("!")} ${message}`);
export const fail = (message) => console.error(`${red("✗")} ${red(message)}`);

export function banner(text) {
  const line = "─".repeat(text.length + 2);
  console.log(bold(blue(`╭${line}╮\n│ ${text} │\n╰${line}╯`)));
}
