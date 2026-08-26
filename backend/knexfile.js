"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '.env') });
const config = {
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
            directory: path_1.default.resolve(__dirname, 'src/migrations'),
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
            filename: path_1.default.resolve(__dirname, '../data/truespec.db')
        },
        useNullAsDefault: true,
        migrations: {
            directory: path_1.default.resolve(__dirname, 'src/migrations'),
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
            directory: path_1.default.resolve(__dirname, 'src/migrations'),
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
            directory: path_1.default.resolve(__dirname, 'dist/migrations'),
            extension: 'js'
        },
        pool: {
            min: 2,
            max: 10
        }
    }
};
exports.default = config;
