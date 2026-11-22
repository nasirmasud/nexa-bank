import { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export async function getIdempotentResponse(tx: TxClient, userId: string, key: string) {
  return tx.idempotencyKey.findUnique({
    where: { userId_key: { userId, key } },
  });
}

export async function saveIdempotentResponse(
  tx: TxClient,
  params: { userId: string; key: string; endpoint: string; responseJson: unknown },
) {
  return tx.idempotencyKey.create({
    data: {
      userId: params.userId,
      key: params.key,
      endpoint: params.endpoint,
      responseJson: params.responseJson as Prisma.InputJsonValue,
    },
  });
}
