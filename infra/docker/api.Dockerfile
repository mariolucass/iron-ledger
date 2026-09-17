FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @iron-ledger/api... --no-frozen-lockfile

FROM dependencies AS development
COPY apps/api apps/api
EXPOSE 3000
CMD ["pnpm", "--filter", "@iron-ledger/api", "dev"]

FROM dependencies AS build
COPY apps/api apps/api
RUN pnpm --filter @iron-ledger/api prisma:generate && pnpm --filter @iron-ledger/api build

FROM node:20-alpine AS production
RUN corepack enable
WORKDIR /workspace
ENV NODE_ENV=production
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
EXPOSE 3000
CMD ["sh", "-c", "pnpm --dir apps/api prisma:deploy && node apps/api/dist/main.js"]
