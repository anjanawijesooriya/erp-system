import { Queue } from "bullmq";
import { connection } from "../connection";

/**
 * Placeholder queue to prove the worker/Redis wiring works end to end.
 * Real queues (payroll, month-end close, report generation, Excel
 * imports, backups) land in later phases.
 */
export const maintenanceQueue = new Queue("maintenance", { connection });
