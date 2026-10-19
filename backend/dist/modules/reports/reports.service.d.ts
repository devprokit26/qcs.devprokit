export declare function getAnalyticsSummary(): Promise<{
    todayShipments: number;
    totalShipments: number;
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    profitMarginPercent: number;
    topCourier: {
        name: string;
        count: number;
    } | null;
    topCustomer: {
        name: string;
        count: number;
    } | null;
    outstandingReceivable: number;
    totalCustomers: number;
    totalVendors: number;
    overdueAlertCount: number;
    unfinalAwbs: string[];
    agingTotals: {
        current: number;
        d1_30: number;
        d31_60: number;
        d60plus: number;
    };
}>;
export declare function getRevenueCostTrend(days?: number): Promise<{
    day: string;
    label: string;
    revenue: number;
    cost: number;
    profit: number;
}[]>;
export declare function getStatusDistribution(): Promise<Record<string, number>>;
export declare function getServiceDistribution(): Promise<Record<string, number>>;
export declare function getCourierReport(): Promise<{
    courier: string;
    count: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
    sharePercent: number;
}[]>;
export declare function getDestinationReport(): Promise<{
    destination: string;
    count: number;
    totalWeight: number;
    revenue: number;
    avgRevenue: number;
}[]>;
export declare function getCustomerReport(): Promise<{
    customerId: number;
    name: string;
    shipments: number;
    totalPaid: number;
    outstanding: number;
    status: "Owes" | "Paid" | "Advance";
}[]>;
export declare function getCreditWarnings(): Promise<{
    overLimit: {
        customer: any;
        balance: number;
        limit: number;
        exceedBy: number;
    }[];
    lockedLate: {
        customer: any;
        daysOverdue: number;
        creditDays: number;
    }[];
}>;
//# sourceMappingURL=reports.service.d.ts.map