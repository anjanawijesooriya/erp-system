import { Queue } from "bullmq";
import { connection } from "../connection";

export const dailySummaryQueue = new Queue("daily-summary", { connection });

/** Schedules the repeatable 8pm-daily trigger job — call once at worker startup. */
export async function scheduleDailySummary() {
  await dailySummaryQueue.add(
    "run",
    {},
    {
      repeat: { pattern: "0 20 * * *" }, // 8pm every day, server timezone
      jobId: "daily-summary-schedule",
    },
  );
}
