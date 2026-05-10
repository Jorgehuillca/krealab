const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.rol !== 'Administrador') {
    return res.status(403).json({ message: 'Acceso solo para administradores' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };
