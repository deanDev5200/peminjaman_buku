import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const dbPath = path.join(__dirname, 'library.db');
const db = new Database(dbPath);

// Read and execute schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Execute schema
db.exec(schema);

console.log('Database initialized successfully at:', dbPath);
console.log('Database schema created from:', schemaPath);

// Close connection
db.close();

process.exit(0);
