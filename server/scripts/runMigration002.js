/**
 * SPLD SAFETY - Run Migration 002: Schema Contract Alignment
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
  const migrationPath = path.join(__dirname, '../database/migrations/002_schema_contract_alignment.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('=== RUNNING MIGRATION 002_schema_contract_alignment.sql ===\n');

  // Extract individual DO $$ ... END $$ blocks
  const blocks = migrationSql.match(/DO \$\$[\s\S]*?END \$\$;/g) || [];

  if (blocks.length === 0) {
    console.warn('No DO blocks found in migration file.');
    return;
  }

  console.log(`Found ${blocks.length} migration blocks to execute.\n`);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    // Find block title from comment right above it if any
    console.log(`Executing Block ${i + 1}/${blocks.length}...`);
    await sql.query(block);
    console.log(`✓ Block ${i + 1} completed.`);
  }

  console.log('\n✅ All Migration 002 blocks executed successfully!');
}

run().catch(err => {
  console.error('Migration 002 failed:', err.message);
  process.exit(1);
});
