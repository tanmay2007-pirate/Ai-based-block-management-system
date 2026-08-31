// src/middleware/roleCheck.js -- Role-based access control
const DEPARTMENT_ROLE_MAP = {
  TMS:  ['engineering', 'admin'],
  TDMS: ['traction', 'admin'],
  SMMS: ['signal', 'admin'],
  COA:  ['control_office', 'admin'],
  ADMIN: ['admin'],
};

function roleCheck(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
    }
    // Admin bypasses all role checks
    if (req.user.role === 'admin') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      const msg = 'Role ' + req.user.role + ' not permitted. Required: ' + roles.join(' or ');
      return res.status(403).json({ error: 'Forbidden', message: msg });
    }
    next();
  };
}

function departmentCheck(department) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
    }
    const allowedRoles = DEPARTMENT_ROLE_MAP[department] || [];
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      const msg = 'Only ' + department + ' members can perform this action';
      return res.status(403).json({ error: 'Forbidden', message: msg });
    }
    next();
  };
}

module.exports = { roleCheck, departmentCheck, DEPARTMENT_ROLE_MAP };