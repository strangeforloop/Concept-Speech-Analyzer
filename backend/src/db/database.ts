import Database from 'better-sqlite3';

export type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Opens (or creates) the SQLite database at `databasePath`.
 * Schema application and migrations will be implemented later.
 */
export function openDatabase(_databasePath: string): SqliteDatabase {
  void _databasePath;
  throw new Error('Not implemented');
}

/** Singleton accessor — wiring TBD */
export function getDatabase(): SqliteDatabase {
  throw new Error('Not implemented');
}

export { Database };
