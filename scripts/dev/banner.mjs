import path from "node:path";
import { loadAppEnv } from "../lib/app-env.cjs";
import { bold, cyan, yellow } from "../lib/terminal.mjs";
import { rootDir } from "../lib/workspace.cjs";
import { services } from "./services.mjs";

const line = (label, value, suffix = "") => `  ${label.padEnd(17)} ${value}${suffix}`;

/** Resumo exibido ao iniciar `dev`: endereços, avisos e interfaces de infraestrutura. */
export function printDevBanner({ selected, notices, environments, note }) {
  const dockerEnv = loadAppEnv(path.join(rootDir, ".env"), null);
  const dockerPort = (key, fallback) => dockerEnv[key] || fallback;

  console.log(`\n  ${bold("Iron Ledger · desenvolvimento")}\n`);
  for (const name of selected) {
    const { label, url } = services[name];
    console.log(line(label, cyan(url(environments[name]))));
  }

  if (notices.length) {
    console.log(`\n  ${bold("Atenção")}\n`);
    for (const [name, check] of notices) {
      const status = check.skip ? "não iniciado" : "aviso";
      const title = yellow(`${services[name].label} (${status})`.padEnd(30));
      console.log(`  ${title} ${check.skip ?? check.warn}`);
    }
  }
  if (note) console.log(`\n  ${note}`);

  console.log(`\n  ${bold("Interfaces Docker (quando iniciadas)")}\n`);
  const interfaces = [
    ["RabbitMQ", dockerPort("RABBITMQ_MANAGEMENT_PORT", "15672"), "core"],
    ["Temporal UI", dockerPort("TEMPORAL_UI_PORT", "8088"), "platform"],
    ["Jaeger", dockerPort("JAEGER_UI_PORT", "16686"), "observability"],
  ];
  for (const [label, port, profile] of interfaces) {
    console.log(line(label, cyan(`http://localhost:${port}`), `  (${profile})`));
  }

  console.log(`\n  ${bold("Serviços sem interface web")}\n`);
  console.log(line("Redis", `localhost:${dockerPort("REDIS_PORT", "6379")}`));
  console.log(line("PostgreSQL", `localhost:${dockerPort("POSTGRES_PORT", "5432")}`));
  console.log(line("Kafka", `localhost:${dockerPort("KAFKA_PORT", "9092")}`, "  (platform)"));
  console.log("\n  Pressione Ctrl+C para encerrar.\n");
}
