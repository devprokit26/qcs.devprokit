"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCustomerBalance = calculateCustomerBalance;
exports.calculateVendorBalance = calculateVendorBalance;
function calculateCustomerBalance(customer, transactions = []) {
    const opening = customer?.openingBalance || 0;
    const txnSum = transactions.reduce((acc, t) => {
        return t.type === 'debit' ? acc + t.amount : acc - t.amount;
    }, 0);
    return Math.round(opening + txnSum);
}
function calculateVendorBalance(vendor, transactions = []) {
    const opening = vendor?.openingBalance || 0;
    const txnSum = transactions.reduce((acc, t) => {
        return t.type === 'debit' ? acc + t.amount : acc - t.amount;
    }, 0);
    return Math.round(opening + txnSum);
}
//# sourceMappingURL=balance.js.map