/** Returns only the fields whose value changed: { field: { from, to } } */
export declare function diffObjects(before: any, after: any): Record<string, {
    from: any;
    to: any;
}>;
export declare function writeAudit(db: any, p: {
    userId?: number | null;
    action: 'create' | 'update' | 'delete' | 'void';
    module: string;
    entity: string;
    entityId: string | number;
    label?: string;
    changes?: Record<string, {
        from: any;
        to: any;
    }>;
    snapshot?: any;
}): Promise<void>;
//# sourceMappingURL=audit.d.ts.map