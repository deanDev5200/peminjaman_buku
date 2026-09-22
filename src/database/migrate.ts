import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_TABLES = ['borrowings', 'settings', 'security_logs', 'borrowing_history'];
const EXPECTED_SETTINGS = [
  'borrow_limit_pelajaran',
  'borrow_limit_bacaan',
  'borrow_limit_guru',
  'root_view_days',
  'app_title',
  'app_subtitle',
];

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

function listTables(db: Database.Database): string[] {
  const rows = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all() as { name: string }[];
  return rows.map((row) => row.name);
}

function listSettingKeys(db: Database.Database): string[] {
  const rows = db.prepare('SELECT key FROM settings ORDER BY key').all() as { key: string }[];
  return rows.map((row) => row.key);
}

function countRows(db: Database.Database, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get() as { count: number };
  return row.count;
}

function main(): void {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  // Optional first argument: path to the database file to migrate.
  // Defaults to library.db next to this script.
  const dbPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(__dirname, 'library.db');

  const dbExisted = fs.existsSync(dbPath);

  if (dbExisted) {
    const backupPath = `${dbPath}.backup-${timestamp()}`;
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Backup created at: ${backupPath}`);
  } else {
    console.log(`No database found at ${dbPath}; a new one will be created.`);
  }

  const db = new Database(dbPath);

  try {
    db.pragma('foreign_keys = ON');

    // Pre-check: refuse to migrate a corrupt database.
    const integrity = db.prepare('PRAGMA quick_check').get() as { quick_check: string };
    if (integrity.quick_check !== 'ok') {
      console.error(`Integrity check failed (${integrity.quick_check}). Migration aborted.`);
      process.exit(1);
    }

    const tablesBefore = dbExisted ? listTables(db) : [];
    const settingsBefore = tablesBefore.includes('settings') ? listSettingKeys(db) : [];

    const schema = fs.readFileSync(schemaPath, 'utf8');

    // DDL is transactional in SQLite: on error everything rolls back
    // and the original file is left untouched.
    db.exec('BEGIN');
    try {
      db.exec(schema);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    const tablesAfter = listTables(db);
    const settingsAfter = listSettingKeys(db);
    const createdTables = tablesAfter.filter((table) => !tablesBefore.includes(table));
    const seededSettings = settingsAfter.filter((key) => !settingsBefore.includes(key));

    console.log(`\nMigration applied to: ${dbPath}`);
    console.log(
      createdTables.length > 0
        ? `Tables created: ${createdTables.join(', ')}`
        : 'Tables created: none (all already present)'
    );
    console.log(
      seededSettings.length > 0
        ? `Settings seeded: ${seededSettings.join(', ')}`
        : 'Settings seeded: none (all already present)'
    );

    console.log('\nRow counts:');
    for (const table of EXPECTED_TABLES) {
      console.log(`  ${table}: ${countRows(db, table)}`);
    }

    const missingTables = EXPECTED_TABLES.filter((table) => !tablesAfter.includes(table));
    const missingSettings = EXPECTED_SETTINGS.filter((key) => !settingsAfter.includes(key));

    if (missingTables.length > 0 || missingSettings.length > 0) {
      console.error('\nVerification FAILED.');
      if (missingTables.length > 0) console.error(`  Missing tables: ${missingTables.join(', ')}`);
      if (missingSettings.length > 0) console.error(`  Missing settings: ${missingSettings.join(', ')}`);
      process.exit(1);
    }

    console.log('\nVerification passed: all expected tables and settings are present.');
  } catch (error) {
    console.error('\nMigration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    db.close();
  }

  process.exit(0);
}

main();
