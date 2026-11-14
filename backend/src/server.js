// src/server.js — HTTP Server Startup
'use strict';

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info(`Hospital AI Automation API running on port ${config.port} in ${config.env} mode`);
  logger.info(`API Base URL: http://localhost:${config.port}/api`);
  logger.info(`Health check: http://localhost:${config.port}/health`);
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  logger.info(`${signal} signal received: closing HTTP server.`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close if graceful timeout exceeded
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason: reason ? reason.stack || reason : 'unknown' });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', { error: error.stack });
  process.exit(1);
});

module.exports = server;
