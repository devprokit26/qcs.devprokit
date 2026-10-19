"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCustomerAging = calculateCustomerAging;
exports.calculateVendorAging = calculateVendorAging;
function calculateCustomerAging(customer, transactions = [], asOfDate = new Date()) {
    const termDays = customer?.creditDays ?? 30;
    const debits = transactions
        .filter(t => t.type === 'debit')
        .map(t => ({ date: t.date, description: t.description, remaining: t.amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (customer && customer.openingBalance && customer.openingBalance > 0) {
        const earliestDate = debits.length
            ? debits[0].date
            : (transactions.length ? transactions[0].date : asOfDate.toISOString().split('T')[0]);
        debits.unshift({
            date: earliestDate,
            description: 'Opening Balance',
            remaining: customer.openingBalance,
        });
    }
    let creditPool = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
    for (const d of debits) {
        if (creditPool <= 0)
            break;
        const applied = Math.min(d.remaining, creditPool);
        d.remaining -= applied;
        creditPool -= applied;
    }
    const buckets = {
        current: 0,
        d1_30: 0,
        d31_60: 0,
        d60plus: 0,
    };
    let oldestDaysOverdue = 0;
    const overdueInvoices = [];
    const asOfTime = asOfDate.getTime();
    debits.forEach(d => {
        if (d.remaining <= 0.01)
            return;
        const invoiceDate = new Date(d.date + 'T00:00:00').getTime();
        const daysSince = Math.floor((asOfTime - invoiceDate) / (1000 * 60 * 60 * 24));
        const daysOverdue = daysSince - termDays;
        if (daysOverdue <= 0) {
            buckets.current += d.remaining;
        }
        else if (daysOverdue <= 30) {
            buckets.d1_30 += d.remaining;
        }
        else if (daysOverdue <= 60) {
            buckets.d31_60 += d.remaining;
        }
        else {
            buckets.d60plus += d.remaining;
        }
        if (daysOverdue > 0) {
            if (daysOverdue > oldestDaysOverdue)
                oldestDaysOverdue = daysOverdue;
            overdueInvoices.push({
                date: d.date,
                description: d.description,
                amount: Math.round(d.remaining),
                daysOverdue,
            });
        }
    });
    overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);
    const totalOverdue = buckets.d1_30 + buckets.d31_60 + buckets.d60plus;
    return {
        current: Math.round(buckets.current),
        d1_30: Math.round(buckets.d1_30),
        d31_60: Math.round(buckets.d31_60),
        d60plus: Math.round(buckets.d60plus),
        totalOverdue: Math.round(totalOverdue),
        oldestDaysOverdue,
        termDays,
        overdueInvoices,
    };
}
function calculateVendorAging(vendor, transactions = [], asOfDate = new Date()) {
    const termDays = vendor?.creditDays ?? 30;
    const debits = transactions
        .filter(t => t.type === 'debit')
        .map(t => ({ date: t.date, description: t.description, remaining: t.amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (vendor && vendor.openingBalance && vendor.openingBalance > 0) {
        const earliestDate = debits.length
            ? debits[0].date
            : (transactions.length ? transactions[0].date : asOfDate.toISOString().split('T')[0]);
        debits.unshift({
            date: earliestDate,
            description: 'Opening Balance',
            remaining: vendor.openingBalance,
        });
    }
    let creditPool = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
    for (const d of debits) {
        if (creditPool <= 0)
            break;
        const applied = Math.min(d.remaining, creditPool);
        d.remaining -= applied;
        creditPool -= applied;
    }
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d60plus: 0 };
    let oldestDaysOverdue = 0;
    const overdueInvoices = [];
    const asOfTime = asOfDate.getTime();
    debits.forEach(d => {
        if (d.remaining <= 0.01)
            return;
        const billDate = new Date(d.date + 'T00:00:00').getTime();
        const daysSince = Math.floor((asOfTime - billDate) / (1000 * 60 * 60 * 24));
        const daysOverdue = daysSince - termDays;
        if (daysOverdue <= 0)
            buckets.current += d.remaining;
        else if (daysOverdue <= 30)
            buckets.d1_30 += d.remaining;
        else if (daysOverdue <= 60)
            buckets.d31_60 += d.remaining;
        else
            buckets.d60plus += d.remaining;
        if (daysOverdue > 0) {
            if (daysOverdue > oldestDaysOverdue)
                oldestDaysOverdue = daysOverdue;
            overdueInvoices.push({
                date: d.date,
                description: d.description,
                amount: Math.round(d.remaining),
                daysOverdue,
            });
        }
    });
    overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);
    return {
        current: Math.round(buckets.current),
        d1_30: Math.round(buckets.d1_30),
        d31_60: Math.round(buckets.d31_60),
        d60plus: Math.round(buckets.d60plus),
        totalOverdue: Math.round(buckets.d1_30 + buckets.d31_60 + buckets.d60plus),
        oldestDaysOverdue,
        termDays,
        overdueInvoices,
    };
}
//# sourceMappingURL=aging.js.map