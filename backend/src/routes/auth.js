// ============================================================
// src/routes/auth.js — Register, Login, /me
// ============================================================
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '8h';

const ROLE_DEPARTMENT_MAP = {
  engineering:    'TMS',
  traction:       'TDMS',
  signal:         'SMMS',
  control_office: 'COA',
  admin:          'ADMIN',
};

router.use(authLimiter);

// POST /api/auth/register
router.post('/register', registerLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.validated.body;

    const resolvedDepartment = department || ROLE_DEPARTMENT_MAP[role];
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, password_hash, role, department: resolvedDepartment },
      select: { id: true, name: true, email: true, role: true, department: true, created_at: true },
    });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const token = jwt.sign(
      { user_id: user.id, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — returns current user from token
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
