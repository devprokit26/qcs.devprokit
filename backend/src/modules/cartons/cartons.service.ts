import { prisma } from '../../prisma/client';
import { CartonTypeInput, CartonTypeCreateInput, CartonMovementInput } from './cartons.schema';
import { todayStr } from '../../lib/dates';
import { MovementType } from '@prisma/client';
import { serializeCartonType, serializeCartonMovement } from '../../lib/serialize';
import { notFoundError, badRequestError } from '../../lib/httpErrors';

export async function listCartonTypes() {
  const types = await prisma.cartonType.findMany({ orderBy: { name: 'asc' } });
  return types.map(serializeCartonType);
}

export async function listCartonMovements() {
  const movements = await prisma.cartonMovement.findMany({ 
    orderBy: { date: 'desc' },
    include: { cartonType: true }
  });
  return movements.map(serializeCartonMovement);
}

export async function createCartonType(input: CartonTypeCreateInput, username = 'system') {
  const { openingQuantity, openingUnitCost, ...typeData } = input;

  // Create the type and (optionally) its first stock in ONE transaction,
  // so we never end up with a box type that is missing its opening stock.
  const ct = await prisma.$transaction(async (tx) => {
    const created = await tx.cartonType.create({ data: typeData });
    if (openingQuantity && openingQuantity > 0) {
      await tx.cartonMovement.create({
        data: {
          cartonTypeId: created.id,
          date: todayStr(),
          movementType: 'RECEIVED' as MovementType,
          quantity: openingQuantity,
          unitCost: openingUnitCost ?? null,
          note: 'Opening stock',
          createdBy: username,
        },
      });
    }
    return created;
  });
  return serializeCartonType(ct);
}

export async function updateCartonType(id: number, input: Partial<CartonTypeInput>) {
  const existing = await prisma.cartonType.findUnique({ where: { id } });
  if (!existing) throw notFoundError('Carton type not found');
  const ct = await prisma.cartonType.update({ where: { id }, data: input });
  return serializeCartonType(ct);
}

/**
 * Deletes a carton type and its stock movements.
 * Refused when the box type has been used in shipments (history must stay intact).
 */
export async function deleteCartonType(id: number) {
  const ct = await prisma.cartonType.findUnique({ where: { id } });
  if (!ct) throw notFoundError('Carton type not found');

  const used = await prisma.cartonMovement.findMany({
    where: { cartonTypeId: id, shipmentId: { not: null } },
    select: { shipmentId: true },
    distinct: ['shipmentId'],
  });
  if (used.length > 0) {
    throw badRequestError(
      `"${ct.name}" is used in ${used.length} shipment(s) and cannot be deleted. Edit it and mark it inactive instead.`
    );
  }

  await prisma.$transaction([
    prisma.cartonMovement.deleteMany({ where: { cartonTypeId: id } }),
    prisma.cartonType.delete({ where: { id } }),
  ]);
}

export async function addCartonMovement(input: CartonMovementInput, username: string) {
  const mov = await prisma.cartonMovement.create({
    data: {
      ...input,
      movementType: input.movementType as MovementType,
      createdBy: username
    },
    include: { cartonType: true }
  });
  return serializeCartonMovement(mov);
}
