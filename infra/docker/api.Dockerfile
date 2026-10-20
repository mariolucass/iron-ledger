# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apk add --no-cache openssl \
  && corepack enable
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
  pnpm install --filter @iron-ledger/api... --frozen-lockfile
# Pacotes compartilhados são consumidos a partir de dist/: compila as dependências do app.
COPY tsconfig.base.json ./
COPY scripts/app-env.cjs scripts/app-env.d.cts scripts/run-prisma.mjs ./scripts/
COPY packages packages
RUN pnpm --filter "@iron-ledger/api^..." --if-present run build

FROM dependencies AS development
ENV NODE_ENV=development
COPY apps/api apps/api
RUN pnpm --dir apps/api prisma:generate
EXPOSE 3000
CMD ["pnpm", "--dir", "apps/api", "dev"]

FROM dependencies AS build
COPY apps/api apps/api
RUN pnpm --dir apps/api prisma:generate && pnpm --dir apps/api build

FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /workspace
RUN apk add --no-cache dumb-init openssl
COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/packages ./packages
COPY --from=build --chown=node:node /workspace/scripts ./scripts
COPY --from=build --chown=node:node /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /workspace/apps/api/dist ./apps/api/dist
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/main.js"]
