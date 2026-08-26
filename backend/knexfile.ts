import dotenv from 'dotenv';
import path from 'path';
import type { Knex } from 'knex';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'truespec',
      charset: 'utf8mb4'
    },
    migrations: {
      directory: path.resolve(__dirname, 'src/migrations'),
      extension: 'ts'
    },
    pool: {
      min: 2,
      max: 10
    }
  },
  sqlite_fallback: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, '../data/truespec.db')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'src/migrations'),
      extension: 'ts'
    }
  },
  test: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'src/migrations'),
      extension: 'ts'
    }
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'truespec',
      charset: 'utf8mb4'
    },
    migrations: {
      directory: path.resolve(__dirname, 'dist/migrations'),
      extension: 'js'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;
