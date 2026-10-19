import { CreateUserInput, UpdateUserInput } from './users.schema';
export declare function listUsers(): Promise<{
    id: number;
    username: string;
    name: string;
    permissions: import(".prisma/client").$Enums.PageKey[];
    isProtected: boolean;
    createdAt: Date;
}[]>;
export declare function createUser(input: CreateUserInput): Promise<{
    id: number;
    username: string;
    name: string;
    permissions: import(".prisma/client").$Enums.PageKey[];
    isProtected: boolean;
    createdAt: Date;
}>;
export declare function updateUser(id: number, input: UpdateUserInput): Promise<{
    id: number;
    username: string;
    name: string;
    permissions: import(".prisma/client").$Enums.PageKey[];
    isProtected: boolean;
    createdAt: Date;
}>;
export declare function deleteUser(id: number): Promise<void>;
//# sourceMappingURL=users.service.d.ts.map