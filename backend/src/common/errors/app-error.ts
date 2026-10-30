/** Throw this from services. The error middleware turns it into the standard error response. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Please log in to continue", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }

  static forbidden(message = "You do not have access to this", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  }

  static notFound(resource = "Resource") {
    return new AppError(404, "NOT_FOUND", `${resource} not found`);
  }

  static conflict(code: string, message: string) {
    return new AppError(409, code, message);
  }

  static tooManyRequests(message: string, code = "TOO_MANY_REQUESTS") {
    return new AppError(429, code, message);
  }
}
