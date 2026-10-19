import { Request, Response, NextFunction } from 'express';
import { PageKey } from '@prisma/client';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        permissions: PageKey[];
        isProtected: boolean;
    };
}
export declare function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function requirePermission(page: PageKey | string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare function requireAnyPermission(...pages: (PageKey | string)[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map