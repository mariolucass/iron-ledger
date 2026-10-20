# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/temporal-worker/package.json apps/temporal-worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/event-bus/package.json packages/event-bus/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/workflow-contracts packages/workflow-contracts
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --filter @iron-ledger/temporal-worker... --frozen-lockfile
# Pacotes compartilhados são consumidos a partir de dist/: compila as dependências do app.
COPY tsconfig.base.json ./
COPY packages packages
RUN pnpm --filter "@iron-ledger/temporal-worker^..." --if-present run build

FROM dependencies AS development
ENV NODE_ENV=development
COPY apps/temporal-worker apps/temporal-worker
CMD ["pnpm", "--dir", "apps/temporal-worker", "dev"]

FROM dependencies AS build
COPY apps/temporal-worker apps/temporal-worker
RUN pnpm --dir apps/temporal-worker build

FROM node:24-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /workspace
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/packages ./packages
COPY --from=build --chown=node:node /workspace/apps/temporal-worker/node_modules ./apps/temporal-worker/node_modules
COPY --from=build --chown=node:node /workspace/apps/temporal-worker/package.json ./apps/temporal-worker/package.json
COPY --from=build --chown=node:node /workspace/apps/temporal-worker/dist ./apps/temporal-worker/dist
USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/temporal-worker/dist/worker.js"]
