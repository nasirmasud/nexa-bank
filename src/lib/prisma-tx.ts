import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

type RetryOptions = {
  retries?: number;
  timeout?: number;
};

export async function withSerializableRetry<T>(
  prisma: PrismaClient,
  fn: (tx: TxClient) => Promise<T>,
  retriesOrOptions: number | RetryOptions = 3,
): Promise<T> {
  const options = typeof retriesOrOptions === "number" ? { retries: retriesOrOptions } : retriesOrOptions;
  const retries = options.retries ?? 3;
  const timeout = options.timeout ?? 10_000;

  let attempt = 0;
  while (true) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout,
      });
    } catch (err) {
      attempt++;
      const code = (err as { code?: string })?.code;
      const isRetryable = code === "P2034";
      if (!isRetryable || attempt >= retries) throw err;
      const jitter = Math.floor(Math.random() * 100 * attempt);
      await new Promise((r) => setTimeout(r, 50 * attempt + jitter));
    }
  }
}
