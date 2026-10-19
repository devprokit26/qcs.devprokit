import { Response } from 'express';
export declare function ok<T>(res: Response, data: T, status?: number): Response<any, Record<string, any>>;
export declare function created<T>(res: Response, data: T): Response<any, Record<string, any>>;
export declare function noContent(res: Response): Response<any, Record<string, any>>;
export declare function badRequest(res: Response, message: string, errors?: unknown): Response<any, Record<string, any>>;
export declare function unauthorized(res: Response, message?: string): Response<any, Record<string, any>>;
export declare function forbidden(res: Response, message?: string): Response<any, Record<string, any>>;
export declare function notFound(res: Response, message?: string): Response<any, Record<string, any>>;
export declare function conflict(res: Response, message: string): Response<any, Record<string, any>>;
export declare function serverError(res: Response, message?: string): Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map