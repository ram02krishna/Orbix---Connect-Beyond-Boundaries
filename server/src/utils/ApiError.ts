// A custom error class that carries an HTTP status code
// so we can throw errors anywhere and the global error handler in app.ts
// will automatically send the right status code to the client.
//
// Usage:
//   throw new ApiError(404, "User not found");
//   throw new ApiError(401, "You need to log in first");

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";

    // Keeps the stack trace clean in V8 (Node.js)
    Error.captureStackTrace(this, this.constructor);
  }
}
