import 'reflect-metadata';
import { prisma } from './prisma';

beforeAll(async () => {
  // Global e2e setup logic
  // await prisma.$connect();
});

afterAll(async () => {
  // await prisma.$disconnect();
});
