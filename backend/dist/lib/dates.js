"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todayStr = todayStr;
exports.shiftDateStr = shiftDateStr;
const config_1 = require("../config");
function todayStr(asOfDate = new Date(), timeZone = config_1.config.timezone) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(asOfDate);
}
function shiftDateStr(baseDateStr, daysDelta) {
    const [y, m, d] = baseDateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + daysDelta));
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
//# sourceMappingURL=dates.js.map