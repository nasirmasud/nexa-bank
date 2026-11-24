import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { accountStatementSchema } from "@/lib/validators/account";
import { getAccountStatement } from "@/lib/services/accountService";
import { StatementDocument } from "@/lib/statement-pdf";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export const GET = withApi(async (request, context) => {
  const user = await requireAuth();
  const { id } = await (context as Ctx).params;
  const url = new URL(request.url);
  const input = accountStatementSchema.parse(Object.fromEntries(url.searchParams));
  const { account, transactions, from, to } = await getAccountStatement(prisma, user, id, input);

  if (input.format === "pdf") {
    const buffer = await renderToBuffer(
      <StatementDocument
        accountNumber={account.accountNumber}
        from={from}
        to={to}
        transactions={transactions.map((t) => ({
          reference: t.reference,
          type: t.type,
          status: t.status,
          amount: t.amount.toString(),
          fee: t.fee.toString(),
          currency: t.currency,
          createdAt: t.createdAt,
          description: t.description,
        }))}
      />,
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="statement-${account.accountNumber}.pdf"`,
      },
    });
  }

  const header = [
    "date",
    "reference",
    "type",
    "status",
    "amount",
    "fee",
    "currency",
    "description",
  ];
  const rows = transactions.map((t) =>
    [
      new Date(t.createdAt).toISOString(),
      t.reference,
      t.type,
      t.status,
      t.amount.toString(),
      t.fee.toString(),
      t.currency,
      t.description ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="statement-${account.accountNumber}.csv"`,
    },
  });
});
