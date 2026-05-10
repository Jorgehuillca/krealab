const { pool } = require('../config/database');

const getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Categorias ORDER BY nombre_categoria');
    res.json(rows);
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const { nombre_categoria, descripcion } = req.body;
    const [r] = await pool.query(
      'INSERT INTO Categorias (nombre_categoria, descripcion) VALUES (?,?)',
      [nombre_categoria, descripcion || null]
    );
    res.status(201).json({ id: r.insertId, nombre_categoria });
  } catch (err) { next(err); }
};

module.exports = { getCategories, createCategory };
