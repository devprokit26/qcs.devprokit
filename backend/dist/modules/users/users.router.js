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
    (0, response_1.ok)(res, await (0, users_service_1.listUsers)());
});
router.get('/:id', async (req, res) => {
    (0, response_1.ok)(res, await (0, users_service_1.getUser)(parseInt(req.params.id, 10)));
});
router.post('/', (0, validate_1.validate)(users_schema_1.createUserSchema), async (req, res) => {
    (0, response_1.created)(res, await (0, users_service_1.createUser)(req.body));
});
const handleUpdateUser = async (req, res) => {
    (0, response_1.ok)(res, await (0, users_service_1.updateUser)(parseInt(req.params.id, 10), req.body));
};
router.put('/:id', (0, validate_1.validate)(users_schema_1.updateUserSchema), handleUpdateUser);
router.patch('/:id', (0, validate_1.validate)(users_schema_1.updateUserSchema), handleUpdateUser);
router.delete('/:id', async (req, res) => {
    await (0, users_service_1.deleteUser)(parseInt(req.params.id, 10), req.user.id);
    (0, response_1.noContent)(res);
});
//# sourceMappingURL=users.router.js.map