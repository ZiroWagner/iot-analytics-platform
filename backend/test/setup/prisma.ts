// Setup Testcontainers and Prisma Client here later for real DB integration tests.
export const prisma = {} as any;

// Ensure DB is disconnected when tests finish
afterAll(async () => {
  if (prisma.$disconnect) {
    await prisma.$disconnect();
  }
});
