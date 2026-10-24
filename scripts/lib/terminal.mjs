const enabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const style = (code) => (text) => (enabled ? `\u001b[${code}m${text}\u001b[0m` : String(text));

export const bold = style(1);
export const red = style(31);
export const green = style(32);
export const yellow = style(33);
export const blue = style(34);
export const magenta = style(35);
export const cyan = style(36);
export const gray = style(90);

export const info = (message) => console.log(`${cyan("➜")} ${message}`);
export const success = (message) => console.log(`${green("✓")} ${message}`);
export const warn = (message) => console.log(`${yellow("!")} ${message}`);
export const fail = (message) => console.error(red(`✗ ${message}`));

export function banner(text) {
  const line = "─".repeat(text.length + 2);
  console.log(bold(cyan(`┌${line}┐\n│ ${text} │\n└${line}┘`)));
}
