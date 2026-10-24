import { createConnection } from "node:net";

/** Extrai host/porta de uma URL ou de "host:porta"; cai no padrão quando não há porta. */
export function hostPort(address, fallbackPort) {
  try {
    const url = new URL(address.includes("://") ? address : `tcp://${address}`);
    return { host: url.hostname || "localhost", port: Number(url.port || fallbackPort) };
  } catch {
    return { host: "localhost", port: Number(fallbackPort) };
  }
}

export function reachable({ host, port }, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}
