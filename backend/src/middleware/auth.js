// ============================================================
// src/middleware/auth.js — JWT Bearer token verification
// Attaches req.user = { id, role, department } on success
// ============================================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {throw new Error('JWT_SECRET env var is required');}

function auth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No Bearer token provided',
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.user_id,
      role: payload.role,
      department: payload.department,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
    }
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

module.exports = auth;
