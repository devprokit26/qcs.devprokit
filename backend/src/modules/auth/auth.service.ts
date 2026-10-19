import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';
import { config } from '../../config';
import { LoginInput } from './auth.schema';

/** Maps DB user fields to the shape expected by the frontend types.ts */
function mapUser(user: { id: number; name: string; username: string; permissions: string[]; isProtected: boolean; createdAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    // DB stores underscores, frontend uses hyphens (e.g. users-management)
    permissions: user.permissions.map(p => p.replace(/_/g, '-')),
    protected: user.isProtected,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function loginService(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { username: input.username } });
  if (!user) throw new Error('Incorrect username or password. Please try again.');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new Error('Incorrect username or password. Please try again.');

  const token = jwt.sign({ sub: user.id }, config.jwtSecret as string, {
    expiresIn: (config.jwtExpiresIn || '7d') as unknown as number,
  });

  return { token, user: mapUser(user) };
}

export async function meService(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, username: true, permissions: true, isProtected: true, createdAt: true },
  });
  return mapUser(user);
}

/**
 * Sliding refresh: if the token has less than 2 days left, issue a fresh 7-day token.
 * Returns null if no refresh is needed or if the token cannot be decoded.
 */
export function maybeRefreshToken(token: string): { token: string } | null {
  try {
    const decoded = jwt.decode(token) as { sub?: number; exp?: number } | null;
    if (!decoded?.sub || !decoded?.exp) return null;

    const expiresInMs = decoded.exp * 1000 - Date.now();
    const twoDaysMs   = 2 * 24 * 60 * 60 * 1000;

    if (expiresInMs > twoDaysMs) return null; // no refresh needed

    const fresh = jwt.sign({ sub: decoded.sub }, config.jwtSecret as string, {
      expiresIn: (config.jwtExpiresIn || '7d') as unknown as number,
    });
    return { token: fresh };
  } catch {
    return null;
  }
}
