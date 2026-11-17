/**
 * SPLD SAFETY - Vercel Serverless Function Catch-All Handler
 * Forwards all incoming /api/* requests to the centralized Express app
 */

import app from '../server/app.js';

export default function handler(req, res) {
  // Normalize req.url to guarantee the /api prefix is retained for Express router
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  // Prevent express.json from re-reading a stream pre-consumed by Vercel Node runtime
  if (req.body && typeof req.body === 'object') {
    req._body = true;
  }

  // Forward request and response directly to the unified Express app
  return app(req, res);
}
