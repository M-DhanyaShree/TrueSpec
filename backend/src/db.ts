import knex, { Knex } from 'knex';
import config from '../knexfile';
import { up as initializeSchema } from './migrations/20240101000000_create_truespec_schema';
import { seedDefaultLaptopsIfEmpty } from './seeds/defaultData';

let dbInstance: Knex | null = null;

async function ensureSchemaAndSeed(db: Knex): Promise<void> {
  const hasLaptops = await db.schema.hasTable('laptops');
  const hasScores = await db.schema.hasTable('laptop_scores');
  const hasReviews = await db.schema.hasTable('reviews');

  if (!hasLaptops || !hasScores || !hasReviews) {
    console.log('[TrueSpec Backend] Database tables missing. Initializing schema tables...');
    await initializeSchema(db);
    console.log('[TrueSpec Backend] Schema tables initialized successfully.');
  }

  // Ensure default data is populated if empty
  await seedDefaultLaptopsIfEmpty(db);
}

export async function getDb(): Promise<Knex> {
  if (dbInstance) {
    return dbInstance;
  }

  // Attempt MySQL first
  const mysqlConfig = config.development || config.production;
  const testKnex = knex(mysqlConfig);

  try {
    // Quick test query with short timeout
    await testKnex.raw('SELECT 1');
    console.log(`[TrueSpec Backend] Connected to MySQL database (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306})`);
    
    // Ensure all tables and seed data exist in MySQL
    await ensureSchemaAndSeed(testKnex);
    
    dbInstance = testKnex;
    return dbInstance;
  } catch (err: any) {
    console.warn(`[TrueSpec Backend] Notice: MySQL not reachable (${err.message}). Using local SQLite fallback database.`);
    await testKnex.destroy().catch(() => {});

    // Fallback to SQLite
    const sqliteConfig = config.sqlite_fallback;
    dbInstance = knex(sqliteConfig);

    // Ensure schema and seed exist on SQLite fallback
    await ensureSchemaAndSeed(dbInstance);
    return dbInstance;
  }
}

export default getDb;
