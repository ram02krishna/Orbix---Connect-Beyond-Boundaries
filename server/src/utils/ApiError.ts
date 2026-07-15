// custom error class so we can throw errors with HTTP status codes from anywhere
// the global error handler in app.ts will catch these and send the right response
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}
