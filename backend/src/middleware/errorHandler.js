// ============================================================
// src/middleware/errorHandler.js — Global error handler
// Must be the LAST middleware registered in server.js
// ============================================================

function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err.message, err.stack);

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A record with this value already exists',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Record not found',
    });
  }

  // JWT errors (in case they bubble up)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', message: err.message });
  }

  // Default: internal server error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
}

module.exports = errorHandler;
