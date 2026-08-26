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

  // Ensure all columns exist in `reviews` table (auto-heal older schemas)
  if (await db.schema.hasTable('reviews')) {
    const hasSentiment = await db.schema.hasColumn('reviews', 'sentiment_label');
    const hasFlagged = await db.schema.hasColumn('reviews', 'is_flagged');
    const hasSource = await db.schema.hasColumn('reviews', 'source');
    const hasVerified = await db.schema.hasColumn('reviews', 'verified_purchase');

    if (!hasSentiment || !hasFlagged || !hasSource || !hasVerified) {
      console.log('[TrueSpec Backend] Adding missing columns to reviews table...');
      await db.schema.alterTable('reviews', (table) => {
        if (!hasSentiment) table.string('sentiment_label', 50).nullable().index();
        if (!hasFlagged) table.boolean('is_flagged').notNullable().defaultTo(false).index();
        if (!hasSource) table.string('source', 100).nullable().defaultTo('Verified Customer');
        if (!hasVerified) table.boolean('verified_purchase').notNullable().defaultTo(true);
      });
      console.log('[TrueSpec Backend] Reviews table schema updated.');
    }
  }

  // Ensure all columns exist in `laptop_scores` table
  if (await db.schema.hasTable('laptop_scores')) {
    const hasConf = await db.schema.hasColumn('laptop_scores', 'confidence_score');
    const hasWilson = await db.schema.hasColumn('laptop_scores', 'wilson_lower_bound');
    const hasPositive = await db.schema.hasColumn('laptop_scores', 'positive_ratio');

    if (!hasConf || !hasWilson || !hasPositive) {
      console.log('[TrueSpec Backend] Adding missing columns to laptop_scores table...');
      await db.schema.alterTable('laptop_scores', (table) => {
        if (!hasConf) table.float('confidence_score').notNullable().defaultTo(50.0).index();
        if (!hasWilson) table.float('wilson_lower_bound').notNullable().defaultTo(0.5);
        if (!hasPositive) table.float('positive_ratio').notNullable().defaultTo(50.0);
      });
      console.log('[TrueSpec Backend] laptop_scores table schema updated.');
    }
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
