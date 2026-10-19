import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client';
import { config } from '../../config';
import { CreateUserInput, UpdateUserInput } from './users.schema';
import { PageKey } from '@prisma/client';
import { serializeUser } from '../../lib/serialize';
import { badRequestError, conflictError, notFoundError } from '../../lib/httpErrors';

/** The User Accounts page is admin-only: it can never be stored as a permission of a normal user. */
function withoutAdminOnlyPermission(perms: string[]): PageKey[] {
  return perms.filter(p => p !== 'users_management') as PageKey[];
}

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return users.map(serializeUser);
}

export async function getUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFoundError('User not found');
  return serializeUser(user);
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { username: input.username } });
  if (existing) throw conflictError(`Username "${input.username}" is already taken`);

  const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      username: input.username,
      passwordHash,
      permissions: withoutAdminOnlyPermission(input.permissions as string[]),
    },
  });
  return serializeUser(user);
}

export async function updateUser(id: number, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFoundError('User not found');

  if (user.isProtected && input.permissions) {
    if (input.permissions.length < 9) {
      throw badRequestError('Cannot remove permissions from protected admin');
    }
  }

  const data: Record<string, unknown> = {};
  if (input.name) data.name = input.name;
  if (input.permissions) {
    // Protected admin keeps every page (including users_management); everyone else never gets it
    data.permissions = user.isProtected
      ? (input.permissions as PageKey[])
      : withoutAdminOnlyPermission(input.permissions as string[]);
  }
  if (input.password) data.passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);

  const updated = await prisma.user.update({ where: { id }, data });
  return serializeUser(updated);
}

export async function deleteUser(id: number, currentUserId?: number) {
  if (currentUserId && id === currentUserId) {
    throw badRequestError('Cannot delete yourself');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFoundError('User not found');
  if (user.isProtected) throw badRequestError('Cannot delete the protected admin account');

  await prisma.$transaction(async (tx) => {
    await tx.expense.updateMany({ where: { createdById: id }, data: { createdById: null } });
    await tx.auditLog.updateMany({ where: { userId: id }, data: { userId: null } });
    await tx.user.delete({ where: { id } });
  });
}
