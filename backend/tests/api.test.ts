import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma/client';

describe('Health and API sanity checks', () => {
  beforeAll(async () => {
    // Clear the DB or do any setup if needed
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return OK from GET /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
  });

  it('should reject unauthorized access', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });
});
