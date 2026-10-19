"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.created = created;
exports.noContent = noContent;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.conflict = conflict;
exports.serverError = serverError;
function ok(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}
function created(res, data) {
    return ok(res, data, 201);
}
function noContent(res) {
    return res.status(204).send();
}
function badRequest(res, message, errors) {
    return res.status(400).json({ success: false, message, errors });
}
function unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({ success: false, message });
}
function forbidden(res, message = 'Forbidden') {
    return res.status(403).json({ success: false, message });
}
function notFound(res, message = 'Not found') {
    return res.status(404).json({ success: false, message });
}
function conflict(res, message) {
    return res.status(409).json({ success: false, message });
}
function serverError(res, message = 'Internal server error') {
    return res.status(500).json({ success: false, message });
}
//# sourceMappingURL=response.js.map