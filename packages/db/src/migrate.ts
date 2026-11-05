import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://erp:erp_dev_password@localhost:55432/erp";

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrations complete.");

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
