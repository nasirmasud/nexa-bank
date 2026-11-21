export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_PIN"
  | "PIN_LOCKED"
  | "ACCOUNT_FROZEN"
  | "RECIPIENT_NOT_FOUND"
  | "LIMIT_EXCEEDED_SINGLE"
  | "LIMIT_EXCEEDED_DAILY"
  | "BELOW_MIN_BALANCE"
  | "SAME_ACCOUNT"
  | "DUPLICATE_REQUEST"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  fields?: Record<string, string[]>;

  constructor(code: ErrorCode, message: string, status = 400, fields?: Record<string, string[]>) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const errorResponse = (err: unknown) => {
  if (err instanceof AppError) {
    return Response.json(
      { error: { code: err.code, message: err.message, fields: err.fields } },
      { status: err.status },
    );
  }
  console.error(err);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 },
  );
};
