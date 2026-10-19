import { CreateUserInput, UpdateUserInput } from './users.schema';
export declare function listUsers(): Promise<{
    id: any;
    name: any;
    username: any;
    permissions: any;
    protected: boolean;
    createdAt: any;
}[]>;
export declare function getUser(id: number): Promise<{
    id: any;
    name: any;
    username: any;
    permissions: any;
    protected: boolean;
    createdAt: any;
}>;
export declare function createUser(input: CreateUserInput): Promise<{
    id: any;
    name: any;
    username: any;
    permissions: any;
    protected: boolean;
    createdAt: any;
}>;
export declare function updateUser(id: number, input: UpdateUserInput): Promise<{
    id: any;
    name: any;
    username: any;
    permissions: any;
    protected: boolean;
    createdAt: any;
}>;
export declare function deleteUser(id: number, currentUserId?: number): Promise<void>;
//# sourceMappingURL=users.service.d.ts.map