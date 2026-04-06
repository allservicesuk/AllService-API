/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Development-only seed script that provisions the default admin user and the root tenant idempotently.
 */
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const DEFAULT_ARGON2_MEMORY_COST = 65536;
const DEFAULT_ARGON2_TIME_COST = 3;
const DEFAULT_ARGON2_PARALLELISM = 4;

const ADMIN_EMAIL = 'admin@allservices.cc';
const ADMIN_PASSWORD = 'ChangeMe!AdminPass1';
const ADMIN_FIRST_NAME = 'Admin';
const ADMIN_LAST_NAME = 'User';
const TENANT_NAME = 'AllServices';
const TENANT_SLUG = 'allservices';

const logger = new Logger('Seed');

async function main(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Seed script must not run with NODE_ENV=production');
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await seedTenant(prisma);
    await seedAdminUser(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedTenant(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (existing) {
    logger.log(`tenant exists: ${TENANT_SLUG}`);
    return;
  }
  await prisma.tenant.create({
    data: { name: TENANT_NAME, slug: TENANT_SLUG, isActive: true },
  });
  logger.log(`tenant created: ${TENANT_SLUG}`);
}

async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    logger.log(`admin exists: ${ADMIN_EMAIL}`);
    return;
  }
  const passwordHash = await argon2.hash(ADMIN_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: parseInt(
      process.env['ARGON2_MEMORY_COST'] ?? String(DEFAULT_ARGON2_MEMORY_COST),
      10,
    ),
    timeCost: parseInt(process.env['ARGON2_TIME_COST'] ?? String(DEFAULT_ARGON2_TIME_COST), 10),
    parallelism: parseInt(
      process.env['ARGON2_PARALLELISM'] ?? String(DEFAULT_ARGON2_PARALLELISM),
      10,
    ),
  });
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      emailVerified: true,
      roles: ['admin'],
      isActive: true,
    },
  });
  logger.log(`admin created: ${ADMIN_EMAIL}`);
}

main()
  .then(() => {
    logger.log('seed complete');
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`seed failed: ${message}`);
    process.exit(1);
  });
