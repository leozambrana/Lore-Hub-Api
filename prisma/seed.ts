import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const games = [
    { title: 'Elden Ring', slug: 'elden-ring' },
    { title: 'Dark Souls 3', slug: 'dark-souls-3' },
    { title: 'Blue Prince', slug: 'blue-prince' },
  ];

  console.log('Seed: Starting seeding...');

  // Create a test user (Simulating Supabase Auth ID)
  const user = await prisma.user.upsert({
    where: { email: 'contato@lorehub.test' },
    update: {},
    create: {
      id: '67c7423e-6d11-471a-8e2b-f8f411cd72ec',
      email: 'contato@lorehub.test',
      username: 'lore_master',
      avatarUrl: 'https://github.com/nutlope.png',
    },
  });
  console.log(`Seed: Created/Updated user: ${user.username}`);

  for (const game of games) {
    const upsertedGame = await prisma.game.upsert({
      where: { slug: game.slug },
      update: {},
      create: game,
    });
    console.log(`Seed: Created/Updated game: ${upsertedGame.title}`);
  }

  console.log('Seed: Finished seeding.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Explicit exit as we are using a custom pool/adapter
    process.exit(0);
  });
