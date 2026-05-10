const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.username, e.dni, e.nombres, e.apellidos,
              c.nombre_cargo AS rol, e.id_empleado
       FROM Usuarios u
       JOIN Empleados e ON e.id_empleado = u.id_empleado
       JOIN Cargos c    ON c.id_cargo    = e.id_cargo
       ORDER BY e.nombres`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getCargos = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Cargos ORDER BY nombre_cargo');
    res.json(rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { username, password, nombres, apellidos, dni, id_cargo } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const [empResult] = await conn.query(
      'INSERT INTO Empleados (dni, nombres, apellidos, id_cargo) VALUES (?,?,?,?)',
      [dni, nombres, apellidos, id_cargo]
    );
    await conn.query(
      'INSERT INTO Usuarios (username, password_hash, id_empleado) VALUES (?,?,?)',
      [username, hash, empResult.insertId]
    );
    await conn.commit();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

const update = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { username, password, nombres, apellidos, dni, id_cargo, id_empleado } = req.body;

    await conn.query(
      'UPDATE Empleados SET dni=?, nombres=?, apellidos=?, id_cargo=? WHERE id_empleado=?',
      [dni, nombres, apellidos, id_cargo, id_empleado]
    );
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await conn.query(
        'UPDATE Usuarios SET username=?, password_hash=? WHERE id_usuario=?',
        [username, hash, req.params.id]
      );
    } else {
      await conn.query(
        'UPDATE Usuarios SET username=? WHERE id_usuario=?',
        [username, req.params.id]
      );
    }
    await conn.commit();
    res.json({ message: 'Usuario actualizado' });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

const remove = async (req, res, next) => {
  try {
    const [[u]] = await pool.query('SELECT id_empleado FROM Usuarios WHERE id_usuario=?', [req.params.id]);
    await pool.query('DELETE FROM Usuarios WHERE id_usuario=?', [req.params.id]);
    if (u) await pool.query('DELETE FROM Empleados WHERE id_empleado=?', [u.id_empleado]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getCargos, create, update, remove };
