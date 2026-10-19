import { LoginInput } from './auth.schema';
export declare function loginService(input: LoginInput): Promise<{
    token: string;
    user: {
        id: number;
        name: string;
        username: string;
        permissions: string[];
        protected: boolean;
        createdAt: string;
    };
}>;
export declare function meService(userId: number): Promise<{
    id: number;
    name: string;
    username: string;
    permissions: string[];
    protected: boolean;
    createdAt: string;
}>;
/**
 * Sliding refresh: if the token has less than 2 days left, issue a fresh 7-day token.
 * Returns null if no refresh is needed or if the token cannot be decoded.
 */
export declare function maybeRefreshToken(token: string): {
    token: string;
} | null;
//# sourceMappingURL=auth.service.d.ts.map