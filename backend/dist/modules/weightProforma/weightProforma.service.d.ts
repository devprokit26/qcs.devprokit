import { WeightProformaInput } from './weightProforma.schema';
export declare function listWeightProformas(search?: string): Promise<{
    id: any;
    cnNo: any;
    shipper: any;
    services: any;
    date: any;
    divisor: any;
    shipmentId: any;
    boxes: any;
}[]>;
export declare function getWeightProforma(id: number): Promise<{
    id: any;
    cnNo: any;
    shipper: any;
    services: any;
    date: any;
    divisor: any;
    shipmentId: any;
    boxes: any;
}>;
export declare function createWeightProforma(input: WeightProformaInput): Promise<{
    id: any;
    cnNo: any;
    shipper: any;
    services: any;
    date: any;
    divisor: any;
    shipmentId: any;
    boxes: any;
}>;
export declare function updateWeightProforma(id: number, input: Partial<WeightProformaInput>): Promise<{
    id: any;
    cnNo: any;
    shipper: any;
    services: any;
    date: any;
    divisor: any;
    shipmentId: any;
    boxes: any;
}>;
export declare function deleteWeightProforma(id: number): Promise<void>;
//# sourceMappingURL=weightProforma.service.d.ts.map