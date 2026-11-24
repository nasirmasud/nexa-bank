import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_PIN"
  | "PIN_LOCKED"
  | "INVALID_PASSWORD"
  | "ACCOUNT_FROZEN"
  | "RECIPIENT_NOT_FOUND"
  | "LIMIT_EXCEEDED_SINGLE"
  | "LIMIT_EXCEEDED_DAILY"
  | "BELOW_MIN_BALANCE"
  | "SAME_ACCOUNT"
  | "DUPLICATE_REQUEST"
  | "KYC_NOT_VERIFIED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  fields?: Record<string, string[]>;
  details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    status = 400,
    fields?: Record<string, string[]>,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.details = details;
  }
}

export function zodErrorFields(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const fields: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(flattened)) {
    if (Array.isArray(value) && value.length > 0) fields[key] = value;
  }
  return fields;
}

export const errorResponse = (err: unknown, requestId?: string) => {
  const prefix = requestId ? `[${requestId}]` : "[api]";

  if (err instanceof ZodError) {
    console.warn(prefix, "Validation error", err.flatten());
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          fields: zodErrorFields(err),
        },
      },
      { status: 422 },
    );
  }

  if (err instanceof AppError) {
    console.warn(prefix, `${err.code}: ${err.message}`);
    return Response.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.fields ? { fields: err.fields } : {}),
          ...(err.details ? { details: err.details } : {}),
        },
      },
      { status: err.status },
    );
  }

  console.error(prefix, err);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 },
  );
};
