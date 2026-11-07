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

/**
 * Verifica se um broker AMQP está *pronto*, não só com a porta aberta: envia o cabeçalho do
 * protocolo e espera o frame Connection.Start. O RabbitMQ aceita o TCP antes de terminar de
 * iniciar e derruba o handshake ("Socket closed abruptly during opening handshake").
 */
export function amqpReady({ host, port }, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once("connect", () => socket.write(Buffer.from([0x41, 0x4d, 0x51, 0x50, 0, 0, 9, 1])));
    socket.once("data", (data) => done(data[0] === 1));
    socket.once("close", () => done(false));
    socket.once("error", () => done(false));
  });
}
