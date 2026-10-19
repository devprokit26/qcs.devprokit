import { prisma } from '../../prisma/client';
import { WeightProformaInput } from './weightProforma.schema';
import { serializeWeightProforma } from '../../lib/serialize';
import { notFoundError } from '../../lib/httpErrors';

export async function listWeightProformas(search?: string) {
  const where = search ? {
    OR: [
      { cnNo: { contains: search, mode: 'insensitive' as const } },
      { shipper: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {};

  const list = await prisma.weightProforma.findMany({
    where,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });

  return list.map(serializeWeightProforma);
}

export async function getWeightProforma(id: number) {
  const wp = await prisma.weightProforma.findUnique({ where: { id } });
  if (!wp) throw notFoundError('Weight Proforma not found');
  return serializeWeightProforma(wp);
}

export async function createWeightProforma(input: WeightProformaInput) {
  const wp = await prisma.weightProforma.create({
    data: input as any,
  });
  return serializeWeightProforma(wp);
}

export async function updateWeightProforma(id: number, input: Partial<WeightProformaInput>) {
  const wp = await prisma.weightProforma.update({
    where: { id },
    data: input as any,
  });
  return serializeWeightProforma(wp);
}

export async function deleteWeightProforma(id: number) {
  await prisma.weightProforma.delete({ where: { id } });
}
