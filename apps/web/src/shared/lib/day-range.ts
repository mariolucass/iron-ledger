/** `yyyy-mm-dd` do seletor de datas → limites ISO do dia, no fuso local. */
export function dayRange(from: string, to: string): { from?: string; to?: string } {
  return {
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
  };
}
