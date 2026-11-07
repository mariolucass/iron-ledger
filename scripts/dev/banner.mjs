import path from "node:path";
import { loadAppEnv } from "../lib/app-env.cjs";
import { amqpReady, hostPort, reachable } from "../lib/net.mjs";
import { bold, gray, orange, primary, subtle } from "../lib/terminal.mjs";
import { logo, row, rule, section, symbols } from "../lib/ui.mjs";
import { rootDir } from "../lib/workspace.cjs";
import { serviceColor, services } from "./services.mjs";

const local = (host) => (host === "localhost" ? "127.0.0.1" : host);

/** Estado real dos endpoints usados (nem sempre os containers do compose), em ordem de prioridade. */
async function inspectInfra({ requested, environments, dockerPort }) {
  const env = { ...environments.worker, ...environments.api };
  const at = (url, fallbackPort, key) => {
    const target = url
      ? hostPort(url, fallbackPort)
      : { host: "127.0.0.1", port: Number(dockerPort(key, fallbackPort)) };
    return { ...target, host: local(target.host) };
  };
  const local_ = (key, fallback) => ({
    host: "127.0.0.1",
    port: Number(dockerPort(key, fallback)),
  });
  const api = requested.includes("api");
  const broker = api && env.EVENT_BUS !== "memory";

  const items = [
    { label: "PostgreSQL", need: api && "API", at: at(env.DATABASE_URL, 5432, "POSTGRES_PORT") },
    {
      label: "RabbitMQ",
      need: broker && "API",
      at: at(env.RABBITMQ_URL, 5672, "RABBITMQ_PORT"),
      ready: amqpReady,
      link: `http://localhost:${dockerPort("RABBITMQ_MANAGEMENT_PORT", "15672")}`,
    },
    {
      label: "Temporal",
      need: requested.includes("worker") && "Worker",
      at: at(`tcp://${env.TEMPORAL_ADDRESS ?? "localhost:7233"}`, 7233, "TEMPORAL_PORT"),
    },
    {
      label: "Temporal UI",
      at: local_("TEMPORAL_UI_PORT", "8088"),
      link: `http://localhost:${dockerPort("TEMPORAL_UI_PORT", "8088")}`,
    },
    { label: "Redis", at: local_("REDIS_PORT", "6379") },
    { label: "Kafka", at: local_("KAFKA_PORT", "9092") },
    {
      label: "Jaeger",
      at: local_("JAEGER_UI_PORT", "16686"),
      link: `http://localhost:${dockerPort("JAEGER_UI_PORT", "16686")}`,
    },
  ];
  return Promise.all(
    items.map(async (item) => {
      const up = await (item.ready ?? reachable)(item.at, 700);
      const starting = !up && item.ready && (await reachable(item.at, 700));
      return { ...item, up, starting };
    }),
  );
}

function infraRow({ label, need, at, link, up, starting }) {
  const icon = up ? symbols.on : starting ? orange("●") : need ? symbols.fail : symbols.off;
  const detail = up
    ? primary(link ?? `${at.host}:${at.port}`)
    : starting
      ? orange("iniciando…")
      : gray(need ? "parado" : "—");
  const role = need ? gray(`necessário para ${need}`) : subtle("opcional");
  return `${row(icon, label, detail, { labelWidth: 14 })}${" ".repeat(Math.max(1, 30 - detail.replace(/\u001b\[[0-9;]*m/g, "").length))}${role}`;
}

export async function printDevBanner({ requested, selected, notices, environments, note }) {
  const dockerEnv = loadAppEnv(path.join(rootDir, ".env"), null);
  const dockerPort = (key, fallback) => dockerEnv[key] || fallback;
  const active = new Set(selected);
  const infra = await inspectInfra({ requested, environments, dockerPort });

  console.log(`\n${logo("ambiente de desenvolvimento")}\n`);
  console.log(rule());
  if (note) console.log(`\n  ${orange("◆")} ${gray(note)}`);

  console.log(`\n${section("Infraestrutura", "· o que os serviços usam")}`);
  for (const item of infra) console.log(infraRow(item));

  console.log(`\n${section("Serviços", "· ordem de inicialização")}`);
  for (const [name, service] of Object.entries(services)) {
    if (active.has(name)) {
      console.log(row(serviceColor(name)("●"), service.label, primary(service.url(environments[name]))));
    } else {
      const notice = notices.find(([key]) => key === name)?.[1];
      const reason = !requested.includes(name)
        ? "fora deste modo"
        : notice?.skip
          ? `não iniciado · ${notice.skip}`
          : "não iniciado";
      console.log(row(symbols.off, service.label, gray(reason)));
    }
  }

  const warnings = notices.filter(([, check]) => check.warn);
  if (warnings.length) {
    console.log(`\n${section("Avisos")}`);
    for (const [name, check] of warnings) {
      console.log(`  ${symbols.warn}  ${bold(services[name].label)} ${gray("·")} ${check.warn}`);
    }
  }

  console.log(`\n${rule()}`);
  console.log(`  ${gray("Ctrl+C encerra com segurança · pressione de novo para forçar")}\n`);
}
