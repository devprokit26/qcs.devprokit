import { VendorCategory as PrismaVendorCategory, ExpensePaymentMethod as PrismaExpensePaymentMethod, PageKey as PrismaPageKey } from '@prisma/client';
export declare const VENDOR_CATEGORY_MAP: Record<string, PrismaVendorCategory>;
export declare const VENDOR_CATEGORY_REVERSE_MAP: Record<PrismaVendorCategory, string>;
export declare function mapVendorCategoryToKey(val: string): PrismaVendorCategory;
export declare function mapVendorCategoryToLabel(key: PrismaVendorCategory | string): string;
export declare const EXPENSE_PAYMENT_METHOD_MAP: Record<string, PrismaExpensePaymentMethod>;
export declare const EXPENSE_PAYMENT_METHOD_REVERSE_MAP: Record<PrismaExpensePaymentMethod, string>;
export declare function mapExpensePaymentMethodToKey(val: string): PrismaExpensePaymentMethod;
export declare function mapExpensePaymentMethodToLabel(key: PrismaExpensePaymentMethod | string): string;
export declare const PAGE_KEY_MAP: Record<string, PrismaPageKey>;
export declare const PAGE_KEY_REVERSE_MAP: Record<PrismaPageKey, string>;
export declare function mapPageKeyToKey(val: string): PrismaPageKey;
export declare function mapPageKeyToLabel(key: PrismaPageKey | string): string;
export declare const VOUCHER_TYPE_MAP: Record<string, string>;
export declare const VOUCHER_TYPE_REVERSE_MAP: Record<string, string>;
export declare function mapVoucherTypeToKey(val: string): string;
export declare function mapVoucherTypeToLabel(key: string): string;
//# sourceMappingURL=enums.d.ts.map