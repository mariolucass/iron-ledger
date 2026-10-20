# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
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
  pnpm install --filter @iron-ledger/web... --frozen-lockfile
# Pacotes compartilhados são consumidos a partir de dist/: compila as dependências do app.
COPY tsconfig.base.json ./
COPY packages packages
RUN pnpm --filter "@iron-ledger/web^..." --if-present run build

FROM dependencies AS development
ENV NODE_ENV=development
COPY apps/web apps/web
EXPOSE 3001
CMD ["pnpm", "--dir", "apps/web", "dev", "--", "--hostname", "0.0.0.0", "--port", "3001"]

FROM dependencies AS build
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY apps/web apps/web
RUN pnpm --dir apps/web build

FROM node:24-alpine AS production
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0 \
  PORT=3001
WORKDIR /workspace
RUN apk add --no-cache dumb-init
COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/web/node_modules ./apps/web/node_modules
COPY --from=build --chown=node:node /workspace/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=node:node /workspace/apps/web/.next ./apps/web/.next
USER node
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["./apps/web/node_modules/.bin/next", "start", "apps/web", "--hostname", "0.0.0.0", "--port", "3001"]
