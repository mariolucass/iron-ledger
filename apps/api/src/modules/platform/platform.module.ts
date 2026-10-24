import type { ModuleFactory } from "../../infra/http/module";
import { PlatformUseCase } from "./application/platform";
import { createPlatformRouter } from "./infra/http/platform.routes";
import { PrismaPlatformRepository } from "./infra/repositories/prisma-platform.repository";
import { PlatformServicesProbe } from "./infra/services/platform-services.probe";

export const platformModule: ModuleFactory = ({ env, eventBus, temporalHealth }) => {
  const servicesProbe = new PlatformServicesProbe(eventBus, {
    eventBusDriver: env.EVENT_BUS,
    rabbitMqUrl: env.RABBITMQ_URL,
    outboxRelayEnabled: env.OUTBOX_RELAY_ENABLED,
    outboxPollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
    temporal: {
      address: env.TEMPORAL_ADDRESS,
      namespace: env.TEMPORAL_NAMESPACE,
      taskQueue: env.TEMPORAL_TASK_QUEUE,
    },
    temporalHealth,
    kafkaBrokers: (env.KAFKA_BROKERS ?? `localhost:${env.KAFKA_PORT}`).split(",").filter(Boolean),
    analyticsUrl: env.ANALYTICS_URL ?? `http://localhost:${env.ANALYTICS_PORT}`,
  });

  return [
    {
      path: "/platform",
      router: createPlatformRouter(
        new PlatformUseCase(new PrismaPlatformRepository(), servicesProbe),
        env.JWT_SECRET,
      ),
    },
  ];
};
