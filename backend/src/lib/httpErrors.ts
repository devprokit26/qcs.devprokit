export class HttpError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function badRequestError(message: string, details?: any): HttpError {
  return new HttpError(400, message, details);
}

export function unauthorizedError(message = 'Unauthorized'): HttpError {
  return new HttpError(401, message);
}

export function forbiddenError(message = 'Forbidden'): HttpError {
  return new HttpError(403, message);
}

export function notFoundError(message = 'Resource not found'): HttpError {
  return new HttpError(404, message);
}

export function conflictError(message: string): HttpError {
  return new HttpError(409, message);
}
