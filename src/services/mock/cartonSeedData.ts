import { CartonType, CartonMovement } from '@/models/types';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

export const SEED_CARTON_TYPES: CartonType[] = [
  { id: 1, name: 'Small 30×20×20 cm', lengthCm: 30, widthCm: 20, heightCm: 20, lowStockThreshold: 10, isActive: true },
  { id: 2, name: 'Medium 45×35×30 cm', lengthCm: 45, widthCm: 35, heightCm: 30, lowStockThreshold: 8, isActive: true },
  { id: 3, name: 'Large 60×45×40 cm', lengthCm: 60, widthCm: 45, heightCm: 40, lowStockThreshold: 5, isActive: true },
  { id: 4, name: 'XL 80×60×50 cm', lengthCm: 80, widthCm: 60, heightCm: 50, lowStockThreshold: 3, isActive: true },
  { id: 5, name: 'Courier Flat Bag', lowStockThreshold: 20, isActive: true },
];

export const SEED_CARTON_MOVEMENTS: CartonMovement[] = [
  // Received in bulk
  { id: 1, cartonTypeId: 1, date: weekAgo, movementType: 'RECEIVED', quantity: 100, unitCost: 45, note: 'Initial stock', createdBy: 'admin', createdAt: weekAgo },
  { id: 2, cartonTypeId: 2, date: weekAgo, movementType: 'RECEIVED', quantity: 80, unitCost: 85, note: 'Initial stock', createdBy: 'admin', createdAt: weekAgo },
  { id: 3, cartonTypeId: 3, date: weekAgo, movementType: 'RECEIVED', quantity: 50, unitCost: 150, note: 'Initial stock', createdBy: 'admin', createdAt: weekAgo },
  { id: 4, cartonTypeId: 4, date: weekAgo, movementType: 'RECEIVED', quantity: 30, unitCost: 220, note: 'Initial stock', createdBy: 'admin', createdAt: weekAgo },
  { id: 5, cartonTypeId: 5, date: weekAgo, movementType: 'RECEIVED', quantity: 200, unitCost: 25, note: 'Initial stock', createdBy: 'admin', createdAt: weekAgo },
  // Used in shipments
  { id: 6, cartonTypeId: 1, date: yesterday, movementType: 'USED', quantity: 15, shipmentId: 1, note: 'Shipment batch', createdBy: 'admin', createdAt: yesterday },
  { id: 7, cartonTypeId: 2, date: yesterday, movementType: 'USED', quantity: 12, shipmentId: 1, note: 'Shipment batch', createdBy: 'admin', createdAt: yesterday },
  { id: 8, cartonTypeId: 3, date: yesterday, movementType: 'USED', quantity: 8, shipmentId: 2, note: 'Shipment batch', createdBy: 'admin', createdAt: yesterday },
  { id: 9, cartonTypeId: 5, date: yesterday, movementType: 'USED', quantity: 30, shipmentId: 3, note: 'Courier bags', createdBy: 'admin', createdAt: yesterday },
  // Today's usage
  { id: 10, cartonTypeId: 1, date: today, movementType: 'USED', quantity: 5, note: 'Walk-in orders', createdBy: 'admin', createdAt: today },
  { id: 11, cartonTypeId: 4, date: today, movementType: 'USED', quantity: 4, note: 'Bulk shipment', createdBy: 'admin', createdAt: today },
  // Low stock adjustment (makes cartonType 4 go low)
  { id: 12, cartonTypeId: 4, date: today, movementType: 'USED', quantity: 22, note: 'Weekend dispatch', createdBy: 'admin', createdAt: today },
];
