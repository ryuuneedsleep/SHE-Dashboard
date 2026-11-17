/**
 * SPLD SAFETY - Express Application Factory
 * Decoupled from server listener for modular testing and Vercel Serverless adaptation
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import originMiddleware from './middleware/originMiddleware.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import findingRoutes from './routes/findingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import notFoundMiddleware from './middleware/notFoundMiddleware.js';
import errorMiddleware from './middleware/errorMiddleware.js';

const app = express();

// Middleware: Origin & CSRF validation with strict non-wildcard CORS
app.use(originMiddleware);

// Middleware: Body parsing with reasonable size limit
app.use(express.json({ limit: '5mb' }));

// Middleware: Cookie parsing for secure session tokens
app.use(cookieParser());

// Base API v1 routing
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/findings', findingRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/profile', profileRoutes);

// Centralized 404 handler for unmatched routes
app.use(notFoundMiddleware);

// Centralized Error handler
app.use(errorMiddleware);

export default app;
