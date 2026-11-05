import { Worker } from "bullmq";
import { connection } from "./connection";
import { scheduleDailySummary } from "./queues/daily-summary";
import { sendSms } from "./notifylk";
import { computeDailySummary, formatSummarySms, listTenantsWithSmsEnabled } from "@erp/core/reports";

const maintenanceWorker = new Worker(
  "maintenance",
  async (job) => {
    console.log(`[maintenance] processing job ${job.name} (${job.id})`, job.data);
    if (job.name === "ping") {
      return { pong: true, at: new Date().toISOString() };
    }
  },
  { connection },
);

maintenanceWorker.on("completed", (job) => {
  console.log(`[maintenance] job ${job.id} completed`);
});

maintenanceWorker.on("failed", (job, err) => {
  console.error(`[maintenance] job ${job?.id} failed`, err);
});

/**
 * Daily owner SMS summary (build-plan Phase 7). Fans out one tenant at a
 * time rather than batching, so one tenant's failure (bad phone number,
 * Notify.lk outage) doesn't stop the others.
 */
const dailySummaryWorker = new Worker(
  "daily-summary",
  async (job) => {
    const today = new Date().toISOString().slice(0, 10);
    const tenants = await listTenantsWithSmsEnabled();
    console.log(`[daily-summary] job ${job.id}: sending to ${tenants.length} tenant(s)`);

    const results = [];
    for (const tenant of tenants) {
      if (!tenant.ownerPhone) continue;
      const summary = await computeDailySummary(tenant.id, today);
      const message = formatSummarySms(summary);
      const result = await sendSms(tenant.ownerPhone, message);
      results.push({ tenantId: tenant.id, ...result });
    }
    return results;
  },
  { connection },
);

dailySummaryWorker.on("completed", (job, result) => {
  console.log(`[daily-summary] job ${job.id} completed`, result);
});

dailySummaryWorker.on("failed", (job, err) => {
  console.error(`[daily-summary] job ${job?.id} failed`, err);
});

console.log("Worker started, listening on queues: maintenance, daily-summary");

scheduleDailySummary().catch((err) => console.error("[daily-summary] failed to schedule repeat job", err));

process.on("SIGTERM", async () => {
  await maintenanceWorker.close();
  await dailySummaryWorker.close();
  process.exit(0);
});
