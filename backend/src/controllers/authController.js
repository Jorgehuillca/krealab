const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });

    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.username, u.password_hash,
              e.nombres, e.apellidos, c.nombre_cargo AS rol
       FROM Usuarios u
       JOIN Empleados e ON e.id_empleado = u.id_empleado
       JOIN Cargos c    ON c.id_cargo    = e.id_cargo
       WHERE u.username = ?`,
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: 'Credenciales incorrectas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: user.id_usuario, username: user.username, rol: user.rol,
        nombre: `${user.nombres} ${user.apellidos}` },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: { id: user.id_usuario, username: user.username,
              nombre: `${user.nombres} ${user.apellidos}`, rol: user.rol }
    });
  } catch (err) { next(err); }
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.username, e.nombres, e.apellidos, c.nombre_cargo AS rol
       FROM Usuarios u
       JOIN Empleados e ON e.id_empleado = u.id_empleado
       JOIN Cargos c    ON c.id_cargo    = e.id_cargo
       WHERE u.id_usuario = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    const u = rows[0];
    res.json({ id: u.id_usuario, username: u.username,
               nombre: `${u.nombres} ${u.apellidos}`, rol: u.rol });
  } catch (err) { next(err); }
};

module.exports = { login, me };
