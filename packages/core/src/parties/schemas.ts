import { z } from "zod";

export const partyInput = z.object({
  code: z.string().max(40).optional(),
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  taxId: z.string().max(60).optional(),
  creditLimit: z.coerce.number().nonnegative().optional().default(0),
  creditTermDays: z.coerce.number().int().nonnegative().optional().default(0),
});
export type PartyInput = z.infer<typeof partyInput>;
