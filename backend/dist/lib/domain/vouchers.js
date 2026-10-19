"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextVoucherNumber = getNextVoucherNumber;
exports.formatVoucherDisplay = formatVoucherDisplay;
function getNextVoucherNumber(counters, voucherType) {
    const current = counters[voucherType] || 0;
    const nextNumber = current + 1;
    const updatedCounters = {
        ...counters,
        [voucherType]: nextNumber,
    };
    return {
        updatedCounters,
        nextNumber,
        voucherNoStr: String(nextNumber),
    };
}
function formatVoucherDisplay(voucherType, voucherNo) {
    if (!voucherNo)
        return voucherType;
    return `${voucherType} ${voucherNo}`;
}
//# sourceMappingURL=vouchers.js.map