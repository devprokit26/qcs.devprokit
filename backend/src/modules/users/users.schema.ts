import { z } from 'zod';
import { mapPageKeyToKey } from '../../lib/enums';

const permissionItemTransform = z.string().transform((val, ctx) => {
  const key = mapPageKeyToKey(val);
  if (!key) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid page permission key: ${val}` });
    return z.NEVER;
  }
  return key;
});

const permissionsTransform = z.array(permissionItemTransform);

export const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  username: z.string().min(1).max(100).regex(/^[a-z0-9._-]+$/, 'Only lowercase letters, numbers, dots, underscores, hyphens'),
  password: z.string().min(6).max(200),
  permissions: permissionsTransform.default(['dashboard']),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  password: z.string().optional().transform(val => (val === '' || val === undefined ? undefined : val)).pipe(z.string().min(6).max(200).optional()),
  permissions: permissionsTransform.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
