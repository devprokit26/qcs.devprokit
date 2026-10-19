"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCustomerCredit = checkCustomerCredit;
const balance_1 = require("./balance");
const aging_1 = require("./aging");
function checkCustomerCredit(customer, transactions = [], additionalAmount = 0, asOfDate = new Date()) {
    if (!customer) {
        return {
            exceed: false,
            customer: 'Unknown',
            creditLimit: 0,
            currentBalance: 0,
            newBalance: 0,
            exceedBy: 0,
            daysLateBreach: false,
            oldestDaysOverdue: 0,
            creditDays: 30,
        };
    }
    const currentBalance = (0, balance_1.calculateCustomerBalance)(customer, transactions);
    const newBalance = currentBalance + additionalAmount;
    const exceed = newBalance > customer.creditLimit;
    const exceedBy = Math.max(0, newBalance - customer.creditLimit);
    const aging = (0, aging_1.calculateCustomerAging)(customer, transactions, asOfDate);
    const daysLateBreach = aging.oldestDaysOverdue > 0;
    return {
        exceed,
        customer: customer.name,
        creditLimit: customer.creditLimit,
        currentBalance,
        newBalance,
        exceedBy,
        daysLateBreach,
        oldestDaysOverdue: aging.oldestDaysOverdue,
        creditDays: customer.creditDays || 30,
    };
}
//# sourceMappingURL=credit.js.map