/**
 * SPLD SAFETY - Run Forward Migration Script
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured.');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const migrationPath = path.join(__dirname, '../database/migrations/001_phase_2_1_schema_alignment.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('=== RUNNING MIGRATION 001_phase_2_1_schema_alignment.sql ===\n');

  // Strip line comments
  const cleanSql = migrationSql.replace(/--.*$/gm, '');

  // Split statements by semicolon and run sequentially
  const statements = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    console.log(`Executing:\n${statement}\n`);
    await sql.query(statement);
  }

  console.log('✅ Migration executed successfully!');
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
