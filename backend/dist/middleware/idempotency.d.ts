import { Request, Response, NextFunction } from 'express';
export declare function purgeOldIdempotencyKeys(): Promise<void>;
export declare function idempotency(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=idempotency.d.ts.map