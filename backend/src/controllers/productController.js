const { pool } = require('../config/database');

// GET /api/products
const getAll = async (req, res, next) => {
  try {
    const { search, categoria, material, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (p.nombre_comercial LIKE ? OR p.descripcion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoria) { where += ' AND p.id_categoria = ?'; params.push(categoria); }
    if (material)  { where += ' AND p.id_material = ?';  params.push(material); }

    const [rows] = await pool.query(
      `SELECT p.id_producto, p.nombre_comercial, p.descripcion, p.color,
              p.stock_actual, p.stock_minimo,
              c.nombre_categoria, m.nombre_material,
              pp.id_producto_precio, pp.precio_venta,
              ROUND(pp.precio_venta * 1.18, 2) AS precio_con_igv,
              IF(p.stock_actual <= p.stock_minimo, 1, 0) AS alerta_stock
       FROM Productos p
       JOIN Categorias c       ON c.id_categoria = p.id_categoria
       JOIN Materiales m       ON m.id_material  = p.id_material
       LEFT JOIN Productos_Precios pp ON pp.id_producto = p.id_producto
       ${where}
       ORDER BY p.nombre_comercial
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM Productos p ${where}`, params
    );

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

// GET /api/products/:id
const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.nombre_categoria, m.nombre_material,
              pp.id_producto_precio, pp.precio_venta,
              ROUND(pp.precio_venta * 1.18, 2) AS precio_con_igv
       FROM Productos p
       JOIN Categorias c       ON c.id_categoria = p.id_categoria
       JOIN Materiales m       ON m.id_material  = p.id_material
       LEFT JOIN Productos_Precios pp ON pp.id_producto = p.id_producto
       WHERE p.id_producto = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/products
const create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { nombre_comercial, descripcion, color, stock_actual, stock_minimo,
            id_categoria, id_material, precio_venta } = req.body;

    const [result] = await conn.query(
      `INSERT INTO Productos (nombre_comercial, descripcion, color, stock_actual, stock_minimo, id_categoria, id_material)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre_comercial, descripcion || null, color || null,
       stock_actual || 0, stock_minimo || 3, id_categoria, id_material]
    );
    const id = result.insertId;

    await conn.query(
      'INSERT INTO Productos_Precios (id_producto, precio_venta) VALUES (?, ?)',
      [id, precio_venta]
    );

    await conn.commit();
    res.status(201).json({ message: 'Producto creado', id });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

// PUT /api/products/:id
const update = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { nombre_comercial, descripcion, color, stock_actual, stock_minimo,
            id_categoria, id_material, precio_venta } = req.body;

    await conn.query(
      `UPDATE Productos SET nombre_comercial=?, descripcion=?, color=?,
       stock_actual=?, stock_minimo=?, id_categoria=?, id_material=?
       WHERE id_producto=?`,
      [nombre_comercial, descripcion || null, color || null,
       stock_actual, stock_minimo, id_categoria, id_material, req.params.id]
    );

    await conn.query(
      'UPDATE Productos_Precios SET precio_venta=? WHERE id_producto=?',
      [precio_venta, req.params.id]
    );

    await conn.commit();
    res.json({ message: 'Producto actualizado' });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

// DELETE /api/products/:id
const remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM Productos WHERE id_producto = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) { next(err); }
};

// GET /api/products/search?q=
const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const [rows] = await pool.query(
      `SELECT p.id_producto, p.nombre_comercial, p.color, p.stock_actual,
              m.nombre_material, pp.id_producto_precio, pp.precio_venta,
              ROUND(pp.precio_venta * 1.18, 2) AS precio_con_igv
       FROM Productos p
       JOIN Materiales m ON m.id_material = p.id_material
       LEFT JOIN Productos_Precios pp ON pp.id_producto = p.id_producto
       WHERE p.nombre_comercial LIKE ? AND p.stock_actual > 0
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, search };
