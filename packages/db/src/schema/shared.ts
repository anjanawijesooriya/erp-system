import { pgEnum } from "drizzle-orm/pg-core";

/** Shared between purchasing (supplier payments) and sales (customer payments). */
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "bank", "cheque"]);
