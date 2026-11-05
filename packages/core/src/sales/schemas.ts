import { z } from "zod";

const lineInput = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export const quotationInput = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  quoteDate: z.string().min(1),
  validUntil: z.string().optional(),
  note: z.string().max(500).optional(),
  lines: z.array(lineInput).min(1),
});
export type QuotationInput = z.infer<typeof quotationInput>;

export const salesOrderInput = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  quotationId: z.string().uuid().optional(),
  orderDate: z.string().min(1),
  note: z.string().max(500).optional(),
  lines: z.array(lineInput).min(1),
});
export type SalesOrderInput = z.infer<typeof salesOrderInput>;

export const salesInvoiceInput = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  salesOrderId: z.string().uuid().optional(),
  invoiceDate: z.string().min(1),
  note: z.string().max(500).optional(),
  lines: z.array(lineInput).min(1),
});
export type SalesInvoiceInput = z.infer<typeof salesInvoiceInput>;

const deliveryLineInput = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  batchNumber: z.string().optional(),
});

export const deliveryInput = z.object({
  branchId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  deliveryDate: z.string().min(1),
  note: z.string().max(500).optional(),
  lines: z.array(deliveryLineInput).min(1),
});
export type DeliveryInput = z.infer<typeof deliveryInput>;

export const salesPaymentInput = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  paymentDate: z.string().min(1),
  method: z.enum(["cash", "bank", "cheque"]),
  amount: z.coerce.number().positive(),
  note: z.string().max(500).optional(),
});
export type SalesPaymentInput = z.infer<typeof salesPaymentInput>;

export const salesReturnInput = z.object({
  branchId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  returnDate: z.string().min(1),
  reason: z.enum(["damaged", "wrong_item", "customer_changed_mind", "other"]),
  note: z.string().max(500).optional(),
  lines: z.array(lineInput).min(1),
});
export type SalesReturnInput = z.infer<typeof salesReturnInput>;

export const posSaleInput = z.object({
  branchId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  customerId: z.string().uuid().optional(), // omitted = walk-in
  method: z.enum(["cash", "bank", "cheque"]),
  lines: z.array(lineInput).min(1),
});
export type PosSaleInput = z.infer<typeof posSaleInput>;
