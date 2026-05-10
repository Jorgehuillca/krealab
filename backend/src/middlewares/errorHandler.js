// Middleware global de manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Error de validación express-validator
  if (err.type === 'validation') {
    return res.status(400).json({ message: 'Error de validación', errors: err.errors });
  }

  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token inválido' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expirado, inicia sesión nuevamente' });
  }

  // Error MySQL duplicado
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'El registro ya existe en la base de datos' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
