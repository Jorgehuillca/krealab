const { pool } = require('../config/database');

// GET /api/sales
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, tipo, desde, hasta } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (tipo)  { where += ' AND tc.nombre_documento = ?'; params.push(tipo); }
    if (desde) { where += ' AND DATE(v.fecha_hora) >= ?'; params.push(desde); }
    if (hasta) { where += ' AND DATE(v.fecha_hora) <= ?'; params.push(hasta); }

    const [rows] = await pool.query(
      `SELECT v.id_venta, v.serie_documento, v.numero_documento,
              CONCAT(v.serie_documento,'-',v.numero_documento) AS comprobante,
              v.fecha_hora, v.subtotal, v.igv, v.total,
              tc.nombre_documento AS tipo_comprobante,
              c.nombres_razon_social AS cliente,
              c.numero_documento AS doc_cliente,
              CONCAT(e.nombres,' ',e.apellidos) AS vendedor
       FROM Ventas v
       JOIN Tipos_Comprobantes tc ON tc.id_tipo_comprobante = v.id_tipo_comprobante
       JOIN Clientes c            ON c.id_cliente           = v.id_cliente
       JOIN Usuarios u            ON u.id_usuario           = v.id_usuario
       JOIN Empleados e           ON e.id_empleado          = u.id_empleado
       ${where}
       ORDER BY v.fecha_hora DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM Ventas v
       JOIN Tipos_Comprobantes tc ON tc.id_tipo_comprobante = v.id_tipo_comprobante
       ${where}`, params
    );

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

// GET /api/sales/:id  (detalle completo)
const getById = async (req, res, next) => {
  try {
    const [ventas] = await pool.query(
      `SELECT v.*, tc.nombre_documento AS tipo_comprobante,
              CONCAT(v.serie_documento,'-',v.numero_documento) AS comprobante,
              c.nombres_razon_social AS cliente, c.numero_documento AS doc_cliente,
              c.direccion, c.telefono,
              CONCAT(e.nombres,' ',e.apellidos) AS vendedor, cr.nombre_cargo
       FROM Ventas v
       JOIN Tipos_Comprobantes tc ON tc.id_tipo_comprobante = v.id_tipo_comprobante
       JOIN Clientes c            ON c.id_cliente           = v.id_cliente
       JOIN Usuarios u            ON u.id_usuario           = v.id_usuario
       JOIN Empleados e           ON e.id_empleado          = u.id_empleado
       JOIN Cargos cr             ON cr.id_cargo            = e.id_cargo
       WHERE v.id_venta = ?`,
      [req.params.id]
    );
    if (!ventas.length) return res.status(404).json({ message: 'Venta no encontrada' });

    const [detalles] = await pool.query(
      `SELECT dv.*, p.nombre_comercial, p.color, m.nombre_material,
              bp.descripcion AS desc_base
       FROM Detalle_Ventas dv
       JOIN Productos p ON p.id_producto = dv.id_producto
       JOIN Materiales m ON m.id_material = p.id_material
       LEFT JOIN Base_Personalizada bp ON bp.id_base = dv.id_base
       WHERE dv.id_venta = ?`,
      [req.params.id]
    );

    res.json({ ...ventas[0], detalles });
  } catch (err) { next(err); }
};

// POST /api/sales  (crear venta completa)
const create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id_tipo_comprobante, id_cliente, items, id_base_global, texto_base_global } = req.body;
    const id_usuario = req.user.id;

    // Obtener serie y correlativo actual
    const [[tipo]] = await conn.query(
      'SELECT serie_actual, correlativo_actual FROM Tipos_Comprobantes WHERE id_tipo_comprobante = ? FOR UPDATE',
      [id_tipo_comprobante]
    );
    if (!tipo) throw { status: 400, message: 'Tipo de comprobante inválido' };

    const nuevo_correlativo = tipo.correlativo_actual + 1;
    const numero_documento  = String(nuevo_correlativo).padStart(8, '0');
    const serie_documento   = tipo.serie_actual;

    // Calcular totales
    let op_gravadas = 0;
    for (const item of items) {
      const base_precio = item.precio_base || 0;
      op_gravadas += (item.valor + base_precio) * item.cantidad;
    }
    const igv   = Math.round(op_gravadas * 0.18 * 100) / 100;
    const total = Math.round((op_gravadas + igv) * 100) / 100;

    // Insertar venta
    const [ventaResult] = await conn.query(
      `INSERT INTO Ventas (id_tipo_comprobante, serie_documento, numero_documento,
        id_cliente, id_usuario, op_gravadas, op_inafectas, op_exoneradas, subtotal, igv, total)
       VALUES (?,?,?,?,?,?,0,0,?,?,?)`,
      [id_tipo_comprobante, serie_documento, numero_documento,
       id_cliente, id_usuario, op_gravadas, op_gravadas, igv, total]
    );
    const id_venta = ventaResult.insertId;

    // Insertar detalles y descontar stock
    for (const item of items) {
      const base_precio = item.precio_base || 0;
      const subtotal_item = (item.valor + base_precio) * item.cantidad;
      const igv_item      = Math.round(subtotal_item * 0.18 * 100) / 100;
      const importe_item  = Math.round((subtotal_item + igv_item) * 100) / 100;

      await conn.query(
        `INSERT INTO Detalle_Ventas (id_venta, id_producto, id_producto_precio, id_base,
           texto_base, cantidad, valor, precio_base, subtotal, igv, importe)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id_venta, item.id_producto, item.id_producto_precio,
         item.id_base || null, item.texto_base || null,
         item.cantidad, item.valor, base_precio,
         subtotal_item, igv_item, importe_item]
      );

      // Descontar stock
      await conn.query(
        'UPDATE Productos SET stock_actual = stock_actual - ? WHERE id_producto = ?',
        [item.cantidad, item.id_producto]
      );
    }

    // Actualizar correlativo
    await conn.query(
      'UPDATE Tipos_Comprobantes SET correlativo_actual = ? WHERE id_tipo_comprobante = ?',
      [nuevo_correlativo, id_tipo_comprobante]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Venta registrada exitosamente',
      id_venta,
      comprobante: `${serie_documento}-${numero_documento}`,
      total,
    });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

// GET /api/sales/comprobantes  (series disponibles)
const getComprobantes = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_tipo_comprobante, nombre_documento, serie_actual, correlativo_actual FROM Tipos_Comprobantes'
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/sales/base-personalizada
const getBase = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT bp.*, m.nombre_material FROM Base_Personalizada bp
       JOIN Materiales m ON m.id_material = bp.id_material`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, getComprobantes, getBase };
