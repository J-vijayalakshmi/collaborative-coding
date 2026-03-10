import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import executeRoutes from './routes/executeRoutes';

// Initialize Express app
const app: Application = express();

// Get port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/execute', executeRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.path}`
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 Collaborative Code Editor Backend Server                ║
║                                                              ║
║   Server running on: http://localhost:${PORT}                  ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                              ║
║   Endpoints:                                                 ║
║   - POST /api/auth/signup     - Create new user              ║
║   - GET  /api/auth/user       - Get current user             ║
║   - POST /api/rooms/create    - Create room                  ║
║   - GET  /api/rooms/list      - List user rooms              ║
║   - POST /api/rooms/:id/join  - Join room                    ║
║   - POST /api/rooms/:id/leave - Leave room                   ║
║   - POST /api/rooms/:id/close - Close room (owner)           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
