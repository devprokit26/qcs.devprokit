import { CartonTypeInput, CartonMovementInput } from './cartons.schema';
export declare function listCartonTypes(): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lengthCm: import("@prisma/client/runtime/library").Decimal | null;
    widthCm: import("@prisma/client/runtime/library").Decimal | null;
    heightCm: import("@prisma/client/runtime/library").Decimal | null;
    lowStockThreshold: number;
    isActive: boolean;
}[]>;
export declare function listCartonMovements(): Promise<({
    cartonType: {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        lengthCm: import("@prisma/client/runtime/library").Decimal | null;
        widthCm: import("@prisma/client/runtime/library").Decimal | null;
        heightCm: import("@prisma/client/runtime/library").Decimal | null;
        lowStockThreshold: number;
        isActive: boolean;
    };
} & {
    id: number;
    createdAt: Date;
    date: string;
    cartonTypeId: number;
    quantity: number;
    movementType: import(".prisma/client").$Enums.MovementType;
    vendorId: number | null;
    unitCost: import("@prisma/client/runtime/library").Decimal | null;
    note: string | null;
    createdBy: string;
    shipmentId: number | null;
})[]>;
export declare function createCartonType(input: CartonTypeInput): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lengthCm: import("@prisma/client/runtime/library").Decimal | null;
    widthCm: import("@prisma/client/runtime/library").Decimal | null;
    heightCm: import("@prisma/client/runtime/library").Decimal | null;
    lowStockThreshold: number;
    isActive: boolean;
}>;
export declare function updateCartonType(id: number, input: Partial<CartonTypeInput>): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lengthCm: import("@prisma/client/runtime/library").Decimal | null;
    widthCm: import("@prisma/client/runtime/library").Decimal | null;
    heightCm: import("@prisma/client/runtime/library").Decimal | null;
    lowStockThreshold: number;
    isActive: boolean;
}>;
export declare function addCartonMovement(input: CartonMovementInput, username: string): Promise<{
    cartonType: {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        lengthCm: import("@prisma/client/runtime/library").Decimal | null;
        widthCm: import("@prisma/client/runtime/library").Decimal | null;
        heightCm: import("@prisma/client/runtime/library").Decimal | null;
        lowStockThreshold: number;
        isActive: boolean;
    };
} & {
    id: number;
    createdAt: Date;
    date: string;
    cartonTypeId: number;
    quantity: number;
    movementType: import(".prisma/client").$Enums.MovementType;
    vendorId: number | null;
    unitCost: import("@prisma/client/runtime/library").Decimal | null;
    note: string | null;
    createdBy: string;
    shipmentId: number | null;
}>;
//# sourceMappingURL=cartons.service.d.ts.map