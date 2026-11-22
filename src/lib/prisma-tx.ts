import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export async function withSerializableRetry<T>(
  prisma: PrismaClient,
  fn: (tx: TxClient) => Promise<T>,
  retries = 3,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err) {
      attempt++;
      const code = (err as { code?: string })?.code;
      const isRetryable = code === "P2034";
      if (!isRetryable || attempt >= retries) throw err;
    }
  }
}
