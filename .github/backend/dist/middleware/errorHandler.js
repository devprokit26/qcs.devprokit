"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    logger_1.logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
    return (0, response_1.serverError)(res, err.message || 'Internal server error');
}
function notFoundHandler(req, res) {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
}
//# sourceMappingURL=errorHandler.js.map