import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { getTransactionById } from "@/lib/services/transactionService";
import { TransactionReceiptDocument } from "@/lib/transaction-receipt";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (_request, context) => {
  const user = await requireAuth();
  const { id } = await (context as Ctx).params;
  const tx = await getTransactionById(prisma, user, id);

  const buffer = await renderToBuffer(
    <TransactionReceiptDocument
      tx={{
        reference: tx.reference,
        type: tx.type,
        status: tx.status,
        amount: tx.amount.toString(),
        fee: tx.fee.toString(),
        currency: tx.currency,
        description: tx.description,
        createdAt: tx.createdAt,
        completedAt: tx.completedAt,
        fromAccount: tx.fromAccount ? { accountNumber: tx.fromAccount.accountNumber } : null,
        toAccount: tx.toAccount ? { accountNumber: tx.toAccount.accountNumber } : null,
      }}
    />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${tx.reference}.pdf"`,
    },
  });
});
