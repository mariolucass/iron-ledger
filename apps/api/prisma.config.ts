import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seeds/index.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
