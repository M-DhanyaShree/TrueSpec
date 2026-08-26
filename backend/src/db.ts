import knex, { Knex } from 'knex';
import config from '../knexfile';
import { up as initializeSchema } from './migrations/20240101000000_create_truespec_schema';

let dbInstance: Knex | null = null;

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
    dbInstance = testKnex;
    return dbInstance;
  } catch (err: any) {
    console.warn(`[TrueSpec Backend] Notice: MySQL not reachable (${err.message}). Using local SQLite fallback database.`);
    await testKnex.destroy().catch(() => {});

    // Fallback to SQLite
    const sqliteConfig = config.sqlite_fallback;
    dbInstance = knex(sqliteConfig);

    // Ensure schema exists on SQLite fallback if needed
    const hasTable = await dbInstance.schema.hasTable('laptops');
    if (!hasTable) {
      console.log('[TrueSpec Backend] Initializing schema on SQLite database...');
      await initializeSchema(dbInstance);
    }
    return dbInstance;
  }
}

export default getDb;
