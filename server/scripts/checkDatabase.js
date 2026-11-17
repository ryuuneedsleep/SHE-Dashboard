/**
 * SPLD SAFETY - Database Connectivity Verification Script
 * Run with: npm run db:check
 */

import dotenv from 'dotenv';
import { sql, isDatabaseConfigured } from '../config/database.js';

dotenv.config();

async function runDatabaseCheck() {
  console.log('=== CHECKING NEON POSTGRESQL CONNECTIVITY ===\n');

  if (!isDatabaseConfigured()) {
    console.warn('⚠️ WARNING: DATABASE_URL is not set in your .env file.');
    console.warn('To connect to Neon:');
    console.warn('1. Copy .env.example to .env');
    console.warn('2. Paste your Neon pooled connection string into DATABASE_URL');
    console.warn('3. Re-run: npm run db:check\n');
    process.exit(1);
  }

  console.log('Connecting to Neon PostgreSQL over HTTPS...');

  try {
    const result = await sql`
      SELECT 
        NOW() AS database_time,
        current_database() AS db_name,
        version() AS pg_version;
    `;

    const row = result[0];
    console.log('✅ Connection Successful!');
    console.log(`- Database Name: ${row.db_name}`);
    console.log(`- Database Time: ${row.database_time}`);
    console.log(`- PostgreSQL Version: ${row.pg_version.split(',')[0]}`);
    console.log('\nNeon PostgreSQL connection is healthy and ready for migrations.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed!');
    console.error(`Error: ${err.message}`);
    console.error('\nPlease check that:');
    console.error('1. Your Neon project is active (not paused/suspended)');
    console.error('2. Your DATABASE_URL contains correct credentials');
    console.error('3. Your network allows outbound HTTPS connections to Neon\n');
    process.exit(1);
  }
}

runDatabaseCheck();
