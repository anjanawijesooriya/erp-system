import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { userRoles, users } from "@erp/db/schema";
import { assertWithinLimit } from "../plans/feature-gate";

export const inviteUserInput = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().uuid(),
  branchId: z.string().uuid().optional(), // omitted = role applies tenant-wide
});
export type InviteUserInput = z.infer<typeof inviteUserInput>;

export async function listTenantUsers(tenantId: string) {
  return db.query.users.findMany({
    where: eq(users.tenantId, tenantId),
    orderBy: (u, { asc }) => [asc(u.name)],
    with: { roles: { with: { role: true, branch: true } } },
  });
}

/** Enforces the plan's maxUsers limit — see packages/core/src/plans/feature-gate.ts. */
export async function inviteUser(tenantId: string, input: InviteUserInput) {
  await assertWithinLimit(tenantId, "maxUsers");

  const passwordHash = await bcrypt.hash(input.password, 10);

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ tenantId, name: input.name, email: input.email, passwordHash })
      .returning();
    if (!user) throw new Error("Failed to create user");

    await tx.insert(userRoles).values({ userId: user.id, roleId: input.roleId, branchId: input.branchId });

    return user;
  });
}

export async function deactivateUser(tenantId: string, userId: string) {
  const [row] = await db
    .update(users)
    .set({ isActive: false })
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .returning();
  return row;
}
