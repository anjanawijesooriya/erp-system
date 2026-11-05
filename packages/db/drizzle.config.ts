import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://erp:erp_dev_password@localhost:55432/erp";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  strict: true,
  verbose: true,
});
