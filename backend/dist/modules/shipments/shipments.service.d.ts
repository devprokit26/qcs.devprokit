import { ShipmentInput } from './shipments.schema';
export interface ListShipmentsFilter {
    search?: string;
    status?: string;
    range?: 'today' | 'week' | 'month' | 'custom' | string;
    from?: string;
    to?: string;
}
export declare function listShipments(filter?: ListShipmentsFilter): Promise<{
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
    notes?: any;
    revenue: number;
    cost: number;
    status: any;
    jobNo?: any;
    shipInv?: any;
    pieces: any;
    weight: number;
    productName?: any;
    destinationAddress?: any;
    courier: any;
    service: any;
    awb: any;
    origin: any;
    destination: any;
    walkInName?: any;
    id: any;
    date: any;
    customerId: any;
    customerName: any;
    consignee: any;
    isWalkIn: boolean;
}[]>;
export declare function getShipment(id: number): Promise<{
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
    notes?: any;
    revenue: number;
    cost: number;
    status: any;
    jobNo?: any;
    shipInv?: any;
    pieces: any;
    weight: number;
    productName?: any;
    destinationAddress?: any;
    courier: any;
    service: any;
    awb: any;
    origin: any;
    destination: any;
    walkInName?: any;
    id: any;
    date: any;
    customerId: any;
    customerName: any;
    consignee: any;
    isWalkIn: boolean;
}>;
export declare function createShipment(input: ShipmentInput, username: string): Promise<{
    shipment: {
        cartonsUsed?: {
            cartonTypeId: number;
            quantity: number;
        }[] | undefined;
        notes?: any;
        revenue: number;
        cost: number;
        status: any;
        jobNo?: any;
        shipInv?: any;
        pieces: any;
        weight: number;
        productName?: any;
        destinationAddress?: any;
        courier: any;
        service: any;
        awb: any;
        origin: any;
        destination: any;
        walkInName?: any;
        id: any;
        date: any;
        customerId: any;
        customerName: any;
        consignee: any;
        isWalkIn: boolean;
    };
    warning: string | undefined;
}>;
export declare function updateShipment(id: number, input: Partial<ShipmentInput>, username: string): Promise<{
    shipment: {
        cartonsUsed?: {
            cartonTypeId: number;
            quantity: number;
        }[] | undefined;
        notes?: any;
        revenue: number;
        cost: number;
        status: any;
        jobNo?: any;
        shipInv?: any;
        pieces: any;
        weight: number;
        productName?: any;
        destinationAddress?: any;
        courier: any;
        service: any;
        awb: any;
        origin: any;
        destination: any;
        walkInName?: any;
        id: any;
        date: any;
        customerId: any;
        customerName: any;
        consignee: any;
        isWalkIn: boolean;
    };
    warning: string | undefined;
}>;
export declare function updateShipmentStatus(id: number, status: string, username: string): Promise<{
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
    notes?: any;
    revenue: number;
    cost: number;
    status: any;
    jobNo?: any;
    shipInv?: any;
    pieces: any;
    weight: number;
    productName?: any;
    destinationAddress?: any;
    courier: any;
    service: any;
    awb: any;
    origin: any;
    destination: any;
    walkInName?: any;
    id: any;
    date: any;
    customerId: any;
    customerName: any;
    consignee: any;
    isWalkIn: boolean;
}>;
export declare function deleteShipment(id: number): Promise<void>;
//# sourceMappingURL=shipments.service.d.ts.map