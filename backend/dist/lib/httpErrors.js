"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.badRequestError = badRequestError;
exports.unauthorizedError = unauthorizedError;
exports.forbiddenError = forbiddenError;
exports.notFoundError = notFoundError;
exports.conflictError = conflictError;
class HttpError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.HttpError = HttpError;
function badRequestError(message, details) {
    return new HttpError(400, message, details);
}
function unauthorizedError(message = 'Unauthorized') {
    return new HttpError(401, message);
}
function forbiddenError(message = 'Forbidden') {
    return new HttpError(403, message);
}
function notFoundError(message = 'Resource not found') {
    return new HttpError(404, message);
}
function conflictError(message) {
    return new HttpError(409, message);
}
//# sourceMappingURL=httpErrors.js.map