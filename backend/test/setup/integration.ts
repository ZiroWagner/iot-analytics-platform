import 'reflect-metadata';
import { prisma } from './prisma';

beforeAll(async () => {
  // Global integration setup logic
  // await prisma.$connect();
});

afterAll(async () => {
  // await prisma.$disconnect();
});
