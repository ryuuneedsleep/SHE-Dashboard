/**
 * SPLD SAFETY - Local Development Server Listener
 * Runs the Express server locally on port 3001 (or configured API_PORT)
 */

import dotenv from 'dotenv';
import app from './app.js';
import { isDatabaseConfigured } from './config/database.js';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.API_PORT, 10) || 3001;

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SPLD SAFETY Backend API is running!`);
  console.log(`📡 URL: http://127.0.0.1:${PORT}`);
  console.log(`🩺 Liveness: http://127.0.0.1:${PORT}/api/v1/health`);
  console.log(`💾 Database: http://127.0.0.1:${PORT}/api/v1/health/db`);
  console.log(`🔌 Database Configured: ${isDatabaseConfigured() ? 'YES' : 'NO (check .env)'}`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping backend server gracefully...');
  server.close(() => {
    console.log('Backend server stopped.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
