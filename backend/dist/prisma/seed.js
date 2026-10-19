"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const adminPasswordHash = await bcryptjs_1.default.hash('admin123', 12);
    const opsPasswordHash = await bcryptjs_1.default.hash('user123', 12);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            name: 'System Admin',
            username: 'admin',
            passwordHash: adminPasswordHash,
            isProtected: true,
            permissions: Object.values(client_1.PageKey),
        },
    });
    console.log(`Upserted admin user: ${admin.username}`);
    const ops = await prisma.user.upsert({
        where: { username: 'ops.tariq' },
        update: {},
        create: {
            name: 'Tariq Mehmood',
            username: 'ops.tariq',
            passwordHash: opsPasswordHash,
            isProtected: false,
            permissions: [client_1.PageKey.dashboard, client_1.PageKey.shipments, client_1.PageKey.weightproforma],
        },
    });
    console.log(`Upserted ops user: ${ops.username}`);
    // Create some initial carton types if they don't exist
    const smallBox = await prisma.cartonType.upsert({
        where: { name: 'Small Box (10x10x10)' },
        update: {},
        create: {
            name: 'Small Box (10x10x10)',
            lengthCm: 10,
            widthCm: 10,
            heightCm: 10,
            lowStockThreshold: 50,
        }
    });
    const mediumBox = await prisma.cartonType.upsert({
        where: { name: 'Medium Box (20x20x20)' },
        update: {},
        create: {
            name: 'Medium Box (20x20x20)',
            lengthCm: 20,
            widthCm: 20,
            heightCm: 20,
            lowStockThreshold: 20,
        }
    });
    console.log(`Upserted carton types: ${smallBox.name}, ${mediumBox.name}`);
    // Expense Categories
    const categories = ['Fuel & Transport', 'Office Supplies', 'Utilities', 'Maintenance', 'Meals & Entertainment'];
    for (const cat of categories) {
        await prisma.expenseCategory.upsert({
            where: { name: cat },
            update: {},
            create: { name: cat, isActive: true },
        });
    }
    console.log(`Upserted expense categories.`);
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map