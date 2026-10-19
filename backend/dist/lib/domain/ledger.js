"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShipmentCreateEntries = generateShipmentCreateEntries;
exports.generateShipmentUpdateEntries = generateShipmentUpdateEntries;
const vouchers_1 = require("./vouchers");
function generateShipmentCreateEntries(shipment, customer, vendor, currentCounters = {}) {
    let counters = { ...currentCounters };
    const actions = [];
    // 1. Customer Ledger Entry (if not walk-in)
    if (!shipment.isWalkIn && shipment.customerId && shipment.revenue > 0) {
        const vType = 'AE-LOC-INV';
        const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
        counters = updatedCounters;
        actions.push({
            target: 'customer',
            entityId: shipment.customerId,
            transaction: {
                date: shipment.date,
                description: `Shipment ${shipment.awb}`,
                type: 'debit',
                amount: shipment.revenue,
                voucherType: vType,
                voucherNo: voucherNoStr,
                jobNo: shipment.jobNo || shipment.awb,
                branch: customer?.branch || shipment.origin || '',
                orig: shipment.origin || customer?.branch || '',
                dest: shipment.destination,
                pcsWeight: `${shipment.pieces || 1} / ${shipment.weight}`,
                shipInv: shipment.shipInv || '',
            },
        });
    }
    // 2. Vendor Ledger Entry (cost payable to courier)
    if (vendor && shipment.cost > 0) {
        const vType = 'PINV';
        const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
        counters = updatedCounters;
        actions.push({
            target: 'vendor',
            entityId: vendor.id,
            transaction: {
                date: shipment.date,
                description: `Shipment ${shipment.awb} — courier cost`,
                type: 'debit',
                amount: shipment.cost,
                voucherType: vType,
                voucherNo: voucherNoStr,
                jobNo: shipment.jobNo || shipment.awb,
                shipInv: shipment.shipInv || '',
                branch: vendor.branch || '',
            },
        });
    }
    return { actions, updatedCounters: counters };
}
function generateShipmentUpdateEntries(oldShipment, newShipment, oldCustomer, newCustomer, oldVendor, newVendor, currentCounters = {}) {
    let counters = { ...currentCounters };
    const actions = [];
    // ================= CUSTOMER SIDE =================
    if (!newShipment.isWalkIn) {
        if (!oldShipment.isWalkIn && oldShipment.customerId === newShipment.customerId && newShipment.customerId) {
            // Same customer: delta adjustment
            const delta = newShipment.revenue - oldShipment.revenue;
            if (delta !== 0) {
                const vType = 'JVR';
                const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
                counters = updatedCounters;
                actions.push({
                    target: 'customer',
                    entityId: newShipment.customerId,
                    transaction: {
                        date: newShipment.date,
                        description: `Adjustment - ${newShipment.awb}`,
                        type: delta > 0 ? 'debit' : 'credit',
                        amount: Math.abs(delta),
                        voucherType: vType,
                        voucherNo: voucherNoStr,
                        jobNo: newShipment.jobNo,
                    },
                });
            }
        }
        else {
            // Customer changed or converted from walk-in to account
            if (!oldShipment.isWalkIn && oldShipment.customerId && oldShipment.revenue > 0) {
                // Reverse old customer
                const vType = 'JVR';
                const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
                counters = updatedCounters;
                actions.push({
                    target: 'customer',
                    entityId: oldShipment.customerId,
                    transaction: {
                        date: newShipment.date,
                        description: `Reversal - ${oldShipment.awb} (moved customer)`,
                        type: 'credit',
                        amount: oldShipment.revenue,
                        voucherType: vType,
                        voucherNo: voucherNoStr,
                    },
                });
            }
            // New debit to new customer
            if (newShipment.customerId && newShipment.revenue > 0) {
                const vType = 'AE-LOC-INV';
                const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
                counters = updatedCounters;
                actions.push({
                    target: 'customer',
                    entityId: newShipment.customerId,
                    transaction: {
                        date: newShipment.date,
                        description: `Shipment ${newShipment.awb}`,
                        type: 'debit',
                        amount: newShipment.revenue,
                        voucherType: vType,
                        voucherNo: voucherNoStr,
                        jobNo: newShipment.jobNo,
                        branch: newCustomer?.branch || '',
                        orig: newShipment.origin || newCustomer?.branch || '',
                        dest: newShipment.destination,
                        pcsWeight: `${newShipment.pieces} / ${newShipment.weight}`,
                        shipInv: newShipment.shipInv,
                    },
                });
            }
        }
    }
    else {
        // New shipment is walk-in
        if (!oldShipment.isWalkIn && oldShipment.customerId && oldShipment.revenue > 0) {
            // Was account customer before, reverse it!
            const vType = 'JVR';
            const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
            counters = updatedCounters;
            actions.push({
                target: 'customer',
                entityId: oldShipment.customerId,
                transaction: {
                    date: newShipment.date,
                    description: `Reversal - ${oldShipment.awb} (converted to walk-in)`,
                    type: 'credit',
                    amount: oldShipment.revenue,
                    voucherType: vType,
                    voucherNo: voucherNoStr,
                },
            });
        }
    }
    // ================= VENDOR SIDE =================
    if ((oldShipment.courier || '').toLowerCase() === (newShipment.courier || '').toLowerCase() && newVendor) {
        // Same courier: delta adjustment
        const costDelta = (newShipment.cost || 0) - (oldShipment.cost || 0);
        if (costDelta !== 0) {
            const vType = 'JVR';
            const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
            counters = updatedCounters;
            actions.push({
                target: 'vendor',
                entityId: newVendor.id,
                transaction: {
                    date: newShipment.date,
                    description: `Adjustment - ${newShipment.awb}`,
                    type: costDelta > 0 ? 'debit' : 'credit',
                    amount: Math.abs(costDelta),
                    voucherType: vType,
                    voucherNo: voucherNoStr,
                    jobNo: newShipment.jobNo,
                },
            });
        }
    }
    else {
        // Courier changed: reverse old vendor and debit new vendor
        if (oldVendor && oldShipment.cost > 0) {
            const vType = 'JVR';
            const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
            counters = updatedCounters;
            actions.push({
                target: 'vendor',
                entityId: oldVendor.id,
                transaction: {
                    date: newShipment.date,
                    description: `Reversal - ${oldShipment.awb} (moved courier)`,
                    type: 'credit',
                    amount: oldShipment.cost,
                    voucherType: vType,
                    voucherNo: voucherNoStr,
                },
            });
        }
        if (newVendor && newShipment.cost > 0) {
            const vType = 'PINV';
            const { updatedCounters, voucherNoStr } = (0, vouchers_1.getNextVoucherNumber)(counters, vType);
            counters = updatedCounters;
            actions.push({
                target: 'vendor',
                entityId: newVendor.id,
                transaction: {
                    date: newShipment.date,
                    description: `Shipment ${newShipment.awb} — courier cost`,
                    type: 'debit',
                    amount: newShipment.cost,
                    voucherType: vType,
                    voucherNo: voucherNoStr,
                    jobNo: newShipment.jobNo,
                    shipInv: newShipment.shipInv,
                },
            });
        }
    }
    return { actions, updatedCounters: counters };
}
//# sourceMappingURL=ledger.js.map