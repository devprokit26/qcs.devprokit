import { CartonTypeInput, CartonTypeCreateInput, CartonMovementInput } from './cartons.schema';
export declare function listCartonTypes(): Promise<{
    lowStockThreshold: any;
    isActive: boolean;
    heightCm?: number | undefined;
    widthCm?: number | undefined;
    lengthCm?: number | undefined;
    id: any;
    name: any;
}[]>;
export declare function listCartonMovements(): Promise<{
    id: any;
    cartonTypeId: any;
    date: any;
    movementType: any;
    quantity: any;
    shipmentId: any;
    vendorId: any;
    unitCost: number | null;
    note: any;
    createdBy: any;
    createdAt: any;
}[]>;
export declare function createCartonType(input: CartonTypeCreateInput, username?: string): Promise<{
    lowStockThreshold: any;
    isActive: boolean;
    heightCm?: number | undefined;
    widthCm?: number | undefined;
    lengthCm?: number | undefined;
    id: any;
    name: any;
}>;
export declare function updateCartonType(id: number, input: Partial<CartonTypeInput>): Promise<{
    lowStockThreshold: any;
    isActive: boolean;
    heightCm?: number | undefined;
    widthCm?: number | undefined;
    lengthCm?: number | undefined;
    id: any;
    name: any;
}>;
/**
 * Deletes a carton type and its stock movements.
 * Refused when the box type has been used in shipments (history must stay intact).
 */
export declare function deleteCartonType(id: number): Promise<void>;
export declare function addCartonMovement(input: CartonMovementInput, username: string): Promise<{
    id: any;
    cartonTypeId: any;
    date: any;
    movementType: any;
    quantity: any;
    shipmentId: any;
    vendorId: any;
    unitCost: number | null;
    note: any;
    createdBy: any;
    createdAt: any;
}>;
//# sourceMappingURL=cartons.service.d.ts.map