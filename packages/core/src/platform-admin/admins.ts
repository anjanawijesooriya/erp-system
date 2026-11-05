import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { platformAdmins } from "@erp/db/schema";

export async function findPlatformAdminByEmail(email: string) {
  return db.query.platformAdmins.findFirst({ where: eq(platformAdmins.email, email) });
}

export async function verifyPlatformAdminPassword(email: string, password: string) {
  const admin = await findPlatformAdminByEmail(email);
  if (!admin) return null;
  const valid = await bcrypt.compare(password, admin.passwordHash);
  return valid ? admin : null;
}

/** Bootstrap-only — there's no self-service platform-admin signup. Run via a one-off script. */
export async function createPlatformAdmin(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [row] = await db.insert(platformAdmins).values({ name, email, passwordHash }).returning();
  return row;
}
