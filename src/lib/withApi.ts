import { errorResponse } from "@/lib/errors";

type RouteHandler = (request: Request, context?: unknown) => Promise<Response>;

export function withApi(handler: RouteHandler): RouteHandler {
  return async (request: Request, context?: unknown) => {
    const requestId = crypto.randomUUID();

    try {
      const response = await handler(request, context);
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (err) {
      const response = errorResponse(err, requestId);
      response.headers.set("x-request-id", requestId);
      return response;
    }
  };
}
