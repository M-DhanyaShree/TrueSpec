import { getDb } from '../db';
import { resetAndSeedCleanDataset } from './defaultData';

async function main() {
  console.log('[TrueSpec Seed Runner] Initializing database connection...');
  const db = await getDb();
  await resetAndSeedCleanDataset(db);
  console.log(' [TrueSpec Seed Runner] Database successfully seeded with 36+ verified laptops, authentic INR pricing, and sentiment scores!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[TrueSpec Seed Runner] Error:', err);
  process.exit(1);
});
