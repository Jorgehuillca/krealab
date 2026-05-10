const { pool } = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (numero_documento LIKE ? OR nombres_razon_social LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const [rows] = await pool.query(
      `SELECT * FROM Clientes ${where} ORDER BY nombres_razon_social LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM Clientes ${where}`, params
    );
    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

const getByDoc = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Clientes WHERE numero_documento = ?', [req.params.doc]
    );
    if (!rows.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { numero_documento, nombres_razon_social, direccion, telefono } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Clientes (numero_documento, nombres_razon_social, direccion, telefono) VALUES (?,?,?,?)',
      [numero_documento, nombres_razon_social, direccion || null, telefono || null]
    );
    res.status(201).json({ message: 'Cliente creado', id: result.insertId });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { nombres_razon_social, direccion, telefono } = req.body;
    await pool.query(
      'UPDATE Clientes SET nombres_razon_social=?, direccion=?, telefono=? WHERE id_cliente=?',
      [nombres_razon_social, direccion || null, telefono || null, req.params.id]
    );
    res.json({ message: 'Cliente actualizado' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM Clientes WHERE id_cliente = ?', [req.params.id]);
    res.json({ message: 'Cliente eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getByDoc, create, update, remove };
