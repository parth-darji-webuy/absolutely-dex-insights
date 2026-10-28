import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({ quiet: true });

// Prisma only reads the store's tables (db pull) and builds the client (generate). No migrations.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: env("STORE_DATABASE_URL_UNPOOLED") },
});
