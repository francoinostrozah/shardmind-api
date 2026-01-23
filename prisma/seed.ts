import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const gens = [
    { id: 1, name: 'Generation I', dexFrom: 1, dexTo: 151 },
    { id: 2, name: 'Generation II', dexFrom: 152, dexTo: 251 },
    { id: 3, name: 'Generation III', dexFrom: 252, dexTo: 386 },
    { id: 4, name: 'Generation IV', dexFrom: 387, dexTo: 493 },
    { id: 5, name: 'Generation V', dexFrom: 494, dexTo: 649 },
    { id: 6, name: 'Generation VI', dexFrom: 650, dexTo: 721 },
    { id: 7, name: 'Generation VII', dexFrom: 722, dexTo: 809 },
    { id: 8, name: 'Generation VIII', dexFrom: 810, dexTo: 905 },
    { id: 9, name: 'Generation IX', dexFrom: 906, dexTo: 1025 }
  ];

  for (const g of gens) {
    await prisma.generation.upsert({
      where: { id: g.id },
      create: g,
      update: { name: g.name, dexFrom: g.dexFrom, dexTo: g.dexTo }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
