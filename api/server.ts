/**
 * local server entry file, for local development
 */
import app from './app.js';
import { createServer } from 'http';
import { initializeWebSocketServer } from './websocket.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
const wsServer = initializeWebSocketServer(8083);

// Start server
server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;