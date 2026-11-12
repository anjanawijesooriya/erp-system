"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@erp/ui/button";
import { ConfirmDialog } from "@erp/ui/dialog";
import { useToast } from "@erp/ui/toast";
import { voidSalesInvoiceAction } from "../actions";

export function VoidButton({ invoiceId }: { invoiceId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function handleVoid() {
    startTransition(async () => {
      const result = await voidSalesInvoiceAction(invoiceId);
      if (result?.error) {
        toast(result.error, "error");
      } else {
        toast("Sales invoice voided.", "success");
        setConfirming(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setConfirming(true)} className="print:hidden">
        Void invoice
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Void this invoice?"
        description="This can't be undone. Only possible while it's still fully unpaid and nothing has been delivered against it."
        confirmLabel="Void invoice"
        variant="destructive"
        pending={pending}
        onConfirm={handleVoid}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
