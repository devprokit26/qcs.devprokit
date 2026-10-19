"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weightProformaRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.weightProformaRouter = router;
router.use(auth_1.authenticate);
const dummyData = [];
let nextId = 1;
router.get('/', (_req, res) => {
    (0, response_1.ok)(res, dummyData);
});
router.get('/:id', (req, res) => {
    const item = dummyData.find(d => d.id === parseInt(req.params.id, 10));
    (0, response_1.ok)(res, item || null);
});
router.post('/', (req, res) => {
    const item = { ...req.body, id: nextId++ };
    dummyData.push(item);
    (0, response_1.created)(res, item);
});
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const idx = dummyData.findIndex(d => d.id === id);
    if (idx !== -1) {
        dummyData[idx] = { ...dummyData[idx], ...req.body, id };
        (0, response_1.ok)(res, dummyData[idx]);
    }
    else {
        (0, response_1.ok)(res, null);
    }
});
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const idx = dummyData.findIndex(d => d.id === id);
    if (idx !== -1) {
        dummyData.splice(idx, 1);
    }
    (0, response_1.noContent)(res);
});
//# sourceMappingURL=weightProforma.router.js.map