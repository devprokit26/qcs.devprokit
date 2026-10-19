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
//# sourceMappingURL=auth.service.d.ts.map