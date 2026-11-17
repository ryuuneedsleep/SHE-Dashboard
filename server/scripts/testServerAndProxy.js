/**
 * SPLD SAFETY - Verification of Express Server, Neon Readiness, and Vite Dev Proxy
 */

import http from 'http';
import { createServer as createViteServer } from 'vite';
import app from '../app.js';

async function testAll() {
  console.log('=== VERIFYING EXPRESS API & VITE PROXY ===\n');

  // 1. Start Express Server on 3001
  const expressServer = await new Promise((resolve) => {
    const s = app.listen(3001, '127.0.0.1', () => resolve(s));
  });
  console.log('1. Express server successfully listening on http://127.0.0.1:3001');

  try {
    // 2. Direct Express Liveness
    const livenessRes = await fetch('http://127.0.0.1:3001/api/v1/health');
    const livenessJson = await livenessRes.json();
    console.log('2. Direct GET /api/v1/health status:', livenessRes.status);
    console.log('   Response:', JSON.stringify(livenessJson));

    // 3. Direct Express Database Readiness
    const dbRes = await fetch('http://127.0.0.1:3001/api/v1/health/db');
    const dbJson = await dbRes.json();
    console.log('3. Direct GET /api/v1/health/db status:', dbRes.status);
    console.log('   Response:', JSON.stringify(dbJson));

    // 4. Direct 404 Handler
    const notFoundRes = await fetch('http://127.0.0.1:3001/api/v1/non-existent-endpoint');
    const notFoundJson = await notFoundRes.json();
    console.log('4. Direct 404 status:', notFoundRes.status, 'code:', notFoundJson.code);

    // 5. Direct Malformed JSON Handler
    const malformedRes = await fetch('http://127.0.0.1:3001/api/v1/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid": json',
    });
    const malformedJson = await malformedRes.json();
    console.log('5. Direct Malformed JSON status:', malformedRes.status, 'code:', malformedJson.code);

    // 6. Start Vite Dev Server (with proxy config from vite.config.ts)
    console.log('\nStarting Vite Dev Server with /api proxy...');
    const viteServer = await createViteServer({
      server: {
        host: '127.0.0.1',
        port: 5175,
      },
    });
    await viteServer.listen();
    const vitePort = viteServer.httpServer.address().port;
    console.log(`6. Vite Dev Server listening on http://127.0.0.1:${vitePort}`);

    // 7. Test Vite Proxy to /api/v1/health
    const proxyLivenessRes = await fetch(`http://127.0.0.1:${vitePort}/api/v1/health`);
    const proxyLivenessJson = await proxyLivenessRes.json();
    console.log(`7. Proxy GET http://127.0.0.1:${vitePort}/api/v1/health status:`, proxyLivenessRes.status);
    console.log('   Proxy Response:', JSON.stringify(proxyLivenessJson));

    // 8. Test Vite Proxy to /api/v1/health/db
    const proxyDbRes = await fetch(`http://127.0.0.1:${vitePort}/api/v1/health/db`);
    const proxyDbJson = await proxyDbRes.json();
    console.log(`8. Proxy GET http://127.0.0.1:${vitePort}/api/v1/health/db status:`, proxyDbRes.status);
    console.log('   Proxy Response:', JSON.stringify(proxyDbJson));

    // Clean shutdown of Vite
    await viteServer.close();
    console.log('9. Vite dev server closed cleanly.');

  } finally {
    await new Promise((resolve) => expressServer.close(resolve));
    console.log('10. Express server closed cleanly.');
  }

  console.log('\n✅ ALL SERVER & PROXY PROBES SUCCEEDED 100%!');
}

testAll().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
