/**
 * SPLD SAFETY - Neon Database Inspection Script
 * READ-ONLY inspection of schema, columns, constraints, and data presence
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  console.log('=== INSPECTING NEON DATABASE ===\n');

  // 1. Check Row Counts
  const tables = ['admin_users', 'admin_sessions', 'findings', 'finding_evidence', 'finding_status_history'];
  for (const table of tables) {
    const countRes = await sql.query(`SELECT COUNT(*)::int as count FROM ${table}`);
    console.log(`Table ${table}: ${countRes[0].count} rows`);
  }

  console.log('\n--- COLUMNS ---');
  // 2. Check Columns
  for (const table of tables) {
    const cols = await sql.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${table}'
      ORDER BY ordinal_position;
    `);
    console.log(`\nTable ${table} columns:`);
    cols.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable}, default: ${c.column_default})`);
    });
  }

  console.log('\n--- CONSTRAINTS ---');
  // 3. Check Constraints
  for (const table of tables) {
    const constraints = await sql.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = '${table}'::regclass;
    `);
    console.log(`\nTable ${table} constraints:`);
    constraints.forEach(c => {
      console.log(`  - ${c.conname} (${c.contype}): ${c.def}`);
    });
  }

  console.log('\n--- TRIGGERS ---');
  const triggers = await sql.query(`
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
  `);
  triggers.forEach(t => {
    console.log(`  - ${t.trigger_name} ON ${t.event_object_table} (${t.event_manipulation})`);
  });

  console.log('\n--- SEQUENCES ---');
  const seqs = await sql.query(`
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public';
  `);
  seqs.forEach(s => {
    console.log(`  - ${s.sequence_name}`);
  });
}

inspect().catch(err => {
  console.error('Inspection error:', err.message);
  process.exit(1);
});
