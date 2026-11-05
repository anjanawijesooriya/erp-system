"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { closePeriod } from "@erp/core/accounting";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

const closePeriodInput = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

export async function closePeriodAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.PERIOD_CLOSE);

  const parsed = closePeriodInput.safeParse({
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await closePeriod(tenantId, userId, parsed.data.periodStart, parsed.data.periodEnd);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to close period" };
  }

  revalidatePath("/accounting/periods");
  return {};
}
