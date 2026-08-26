import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import { ingestCsvDatasetsToMySql } from './csvSeeder';
import { resetAndSeedCleanDataset } from './defaultData';

async function main() {
  console.log('[TrueSpec Seed Runner] Initializing database connection...');
  const db = await getDb();
  
  const csvPath = path.resolve(__dirname, '../../../data/raw/laptops_cleaned.csv');
  if (fs.existsSync(csvPath)) {
    console.log('[TrueSpec Seed Runner] Found raw dataset CSV files. Ingesting and scoring directly into MySQL...');
    await ingestCsvDatasetsToMySql(db);
  } else {
    console.log('[TrueSpec Seed Runner] CSV files not found. Using structured dataset seeder...');
    await resetAndSeedCleanDataset(db);
  }

  console.log(' [TrueSpec Seed Runner] Database successfully seeded with dataset into MySQL!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[TrueSpec Seed Runner] Error:', err);
  process.exit(1);
});
