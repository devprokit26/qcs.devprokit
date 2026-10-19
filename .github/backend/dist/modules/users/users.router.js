"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const users_schema_1 = require("./users.schema");
const users_service_1 = require("./users.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.usersRouter = router;
router.use(auth_1.authenticate, auth_1.requireAdmin);
router.get('/', async (_req, res) => {
    const users = await (0, users_service_1.listUsers)();
    return (0, response_1.ok)(res, users);
});
router.post('/', (0, validate_1.validate)(users_schema_1.createUserSchema), async (req, res) => {
    try {
        const user = await (0, users_service_1.createUser)(req.body);
        return (0, response_1.created)(res, user);
    }
    catch (err) {
        return (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed to create user');
    }
});
router.put('/:id', (0, validate_1.validate)(users_schema_1.updateUserSchema), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const user = await (0, users_service_1.updateUser)(id, req.body);
        return (0, response_1.ok)(res, user);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update user';
        if (msg.includes('not found'))
            return (0, response_1.notFound)(res, msg);
        return (0, response_1.badRequest)(res, msg);
    }
});
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        await (0, users_service_1.deleteUser)(id);
        return (0, response_1.noContent)(res);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete user';
        if (msg.includes('not found'))
            return (0, response_1.notFound)(res, msg);
        return (0, response_1.badRequest)(res, msg);
    }
});
//# sourceMappingURL=users.router.js.map