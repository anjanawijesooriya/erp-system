import { z } from "zod";

const lineInput = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
});

export const purchaseOrderInput = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  orderDate: z.string().min(1),
  expectedDate: z.string().optional(),
  note: z.string().max(500).optional(),
  lines: z.array(lineInput).min(1),
});
export type PurchaseOrderInput = z.infer<typeof purchaseOrderInput>;

const grnLineInput = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const grnInput = z.object({
  branchId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  supplierId: z.string().uuid(),
  purchaseOrderId: z.string().uuid().optional(),
  receivedDate: z.string().min(1),
  note: z.string().max(500).optional(),
  lines: z.array(grnLineInput).min(1),
});
export type GrnInput = z.infer<typeof grnInput>;

export const supplierInvoiceInput = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  grnId: z.string().uuid().optional(),
  supplierRefNumber: z.string().max(100).optional(),
  invoiceDate: z.string().min(1),
  note: z.string().max(500).optional(),
  lines: z.array(lineInput).min(1),
});
export type SupplierInvoiceInput = z.infer<typeof supplierInvoiceInput>;

export const supplierPaymentInput = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  paymentDate: z.string().min(1),
  method: z.enum(["cash", "bank", "cheque"]),
  amount: z.coerce.number().positive(),
  note: z.string().max(500).optional(),
});
export type SupplierPaymentInput = z.infer<typeof supplierPaymentInput>;

export const purchaseReturnInput = z.object({
  branchId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  supplierId: z.string().uuid(),
  grnId: z.string().uuid().optional(),
  returnDate: z.string().min(1),
  reason: z.enum(["damaged", "wrong_item", "excess", "other"]),
  note: z.string().max(500).optional(),
  lines: z.array(lineInput).min(1),
});
export type PurchaseReturnInput = z.infer<typeof purchaseReturnInput>;
