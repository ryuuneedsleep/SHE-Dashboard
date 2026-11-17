/**
 * SPLD SAFETY - Detailed Neon PostgreSQL Introspection
 * For Phase 2.2 Schema Alignment Finalization
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function introspect() {
  console.log('=== DETAILED INTROSPECTION OF NEON POSTGRESQL ===\n');

  const tables = ['admin_users', 'admin_sessions', 'findings', 'finding_evidence', 'finding_status_history'];

  // 1. Row counts
  console.log('--- 1. ROW COUNTS ---');
  for (const table of tables) {
    const res = await sql.query(`SELECT COUNT(*)::int as count FROM ${table}`);
    console.log(`Table ${table}: ${res[0].count} rows`);
  }

  // 2. Columns per table
  console.log('\n--- 2. COLUMNS ---');
  for (const table of tables) {
    const cols = await sql.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length, 
        is_nullable, 
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${table}'
      ORDER BY ordinal_position;
    `);
    console.log(`\nTable ${table} (${cols.length} columns):`);
    cols.forEach(c => {
      const len = c.character_maximum_length ? `(${c.character_maximum_length})` : '';
      console.log(`  - ${c.column_name}: ${c.data_type}${len} | Nullable: ${c.is_nullable} | Default: ${c.column_default}`);
    });
  }

  // 3. Constraints per table
  console.log('\n--- 3. TABLE CONSTRAINTS ---');
  for (const table of tables) {
    const constraints = await sql.query(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        pg_get_constraintdef(c.oid) as definition
      FROM information_schema.table_constraints tc
      JOIN pg_constraint c ON c.conname = tc.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = '${table}'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `);
    console.log(`\nTable ${table} constraints:`);
    constraints.forEach(c => {
      console.log(`  - [${c.constraint_type}] ${c.constraint_name}: ${c.definition}`);
    });
  }

  // 4. Foreign Key Referential Actions
  console.log('\n--- 4. REFERENTIAL CONSTRAINTS (FOREIGN KEYS) ---');
  const fkeys = await sql.query(`
    SELECT 
      tc.table_name, 
      kcu.column_name, 
      c.conname,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN pg_constraint c ON c.conname = tc.constraint_name
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `);
  fkeys.forEach(f => {
    console.log(`  - ${f.table_name}.${f.column_name} -> ${f.foreign_table_name}.${f.foreign_column_name} [ON DELETE ${f.delete_rule}] (Constraint: ${f.conname})`);
  });

  // 5. Indexes
  console.log('\n--- 5. INDEXES ---');
  const indexes = await sql.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);
  indexes.forEach(idx => {
    console.log(`  - ${idx.tablename} -> ${idx.indexname}: ${idx.indexdef}`);
  });

  // 6. Sequences
  console.log('\n--- 6. SEQUENCES ---');
  const sequences = await sql.query(`
    SELECT sequence_name, data_type, start_value, minimum_value, maximum_value, increment
    FROM information_schema.sequences
    WHERE sequence_schema = 'public';
  `);
  sequences.forEach(s => {
    console.log(`  - ${s.sequence_name} (${s.data_type}) start: ${s.start_value}, inc: ${s.increment}`);
  });

  // 7. Triggers
  console.log('\n--- 7. TRIGGERS ---');
  const triggers = await sql.query(`
    SELECT 
      event_object_table, 
      trigger_name, 
      event_manipulation, 
      action_timing,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `);
  triggers.forEach(t => {
    console.log(`  - ON ${t.event_object_table}: ${t.trigger_name} [${t.action_timing} ${t.event_manipulation}] -> ${t.action_statement}`);
  });

  console.log('\n=== INTROSPECTION COMPLETED ===');
}

introspect().catch(err => {
  console.error('Introspection failed:', err);
  process.exit(1);
});
