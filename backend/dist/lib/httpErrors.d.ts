export declare class HttpError extends Error {
    statusCode: number;
    details?: any;
    constructor(statusCode: number, message: string, details?: any);
}
export declare function badRequestError(message: string, details?: any): HttpError;
export declare function unauthorizedError(message?: string): HttpError;
export declare function forbiddenError(message?: string): HttpError;
export declare function notFoundError(message?: string): HttpError;
export declare function conflictError(message: string): HttpError;
//# sourceMappingURL=httpErrors.d.ts.map