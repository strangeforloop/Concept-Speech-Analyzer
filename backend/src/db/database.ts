import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

export type SqliteDatabase = InstanceType<typeof Database>;
export type SqlParams = Record<string, unknown> | unknown[];
export type SqlRunResult = ReturnType<ReturnType<SqliteDatabase['prepare']>['run']>;

const DEFAULT_DATABASE_PATH = './storage/database.db';
const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const SCHEMA_PATH = path.resolve(path.dirname(CURRENT_FILE_PATH), 'schema.sql');
const DATABASE_PATH = process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH;

let dbInstance: SqliteDatabase | null = null;

function withDbError<T>(operation: string, fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Database operation failed (${operation}): ${message}`);
  }
}

function initializeSchema(db: SqliteDatabase): void {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schemaSql);
}

/**
 * Opens (or creates) the SQLite database and applies schema.
 */
export function openDatabase(databasePath: string = DATABASE_PATH): SqliteDatabase {
  return withDbError('openDatabase', () => {
    const resolvedPath = path.resolve(databasePath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

    const db = new Database(resolvedPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initializeSchema(db);
    return db;
  });
}

/** Singleton accessor */
export function getDatabase(): SqliteDatabase {
  if (dbInstance === null) {
    dbInstance = openDatabase();
  }
  return dbInstance;
}

export const db: SqliteDatabase = getDatabase();

export function queryAll<T>(sql: string, params?: SqlParams): T[] {
  return withDbError('queryAll', () => {
    const statement = db.prepare(sql);
    return params === undefined
      ? statement.all() as T[]
      : statement.all(params as never) as T[];
  });
}

/** Alias for queryAll to match route-layer naming */
export const query = queryAll;

export function queryOne<T>(sql: string, params?: SqlParams): T | undefined {
  return withDbError('queryOne', () => {
    const statement = db.prepare(sql);
    return params === undefined
      ? statement.get() as T | undefined
      : statement.get(params as never) as T | undefined;
  });
}

export function run(sql: string, params?: SqlParams): SqlRunResult {
  return withDbError('run', () => {
    const statement = db.prepare(sql);
    return params === undefined
      ? statement.run()
      : statement.run(params as never);
  });
}

export function transaction<T>(fn: (database: SqliteDatabase) => T): T {
  return withDbError('transaction', () => {
    const tx = db.transaction(() => fn(db));
    return tx();
  });
}
