const { pool } = require('../config/database');

const getStats = async (req, res, next) => {
  try {
    const [[ventasHoy]] = await pool.query(
      `SELECT COUNT(*) AS cantidad, COALESCE(SUM(total),0) AS monto
       FROM Ventas WHERE DATE(fecha_hora) = CURDATE()`
    );
    const [[ventasMes]] = await pool.query(
      `SELECT COUNT(*) AS cantidad, COALESCE(SUM(total),0) AS monto
       FROM Ventas WHERE MONTH(fecha_hora)=MONTH(CURDATE()) AND YEAR(fecha_hora)=YEAR(CURDATE())`
    );
    const [[{ total_productos }]] = await pool.query('SELECT COUNT(*) AS total_productos FROM Productos');
    const [[{ total_clientes }]]  = await pool.query('SELECT COUNT(*) AS total_clientes FROM Clientes');
    const [[{ alertas_stock }]]   = await pool.query(
      'SELECT COUNT(*) AS alertas_stock FROM Productos WHERE stock_actual <= stock_minimo'
    );

    // Ventas últimos 7 días
    const [ventasSemana] = await pool.query(
      `SELECT DATE(fecha_hora) AS fecha, COUNT(*) AS cantidad, SUM(total) AS monto
       FROM Ventas
       WHERE fecha_hora >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(fecha_hora) ORDER BY fecha`
    );

    // Top 5 productos más vendidos
    const [topProductos] = await pool.query(
      `SELECT p.nombre_comercial, SUM(dv.cantidad) AS total_vendido
       FROM Detalle_Ventas dv
       JOIN Productos p ON p.id_producto = dv.id_producto
       GROUP BY p.id_producto ORDER BY total_vendido DESC LIMIT 5`
    );

    // Últimas 5 ventas
    const [ultimasVentas] = await pool.query(
      `SELECT v.id_venta, CONCAT(v.serie_documento,'-',v.numero_documento) AS comprobante,
              v.fecha_hora, v.total, tc.nombre_documento AS tipo,
              c.nombres_razon_social AS cliente
       FROM Ventas v
       JOIN Tipos_Comprobantes tc ON tc.id_tipo_comprobante = v.id_tipo_comprobante
       JOIN Clientes c            ON c.id_cliente           = v.id_cliente
       ORDER BY v.fecha_hora DESC LIMIT 5`
    );

    res.json({
      ventasHoy,
      ventasMes,
      total_productos,
      total_clientes,
      alertas_stock,
      ventasSemana,
      topProductos,
      ultimasVentas,
    });
  } catch (err) { next(err); }
};

// GET productos con stock bajo
const getStockAlerts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id_producto, p.nombre_comercial, p.stock_actual, p.stock_minimo,
              c.nombre_categoria, m.nombre_material
       FROM Productos p
       JOIN Categorias c ON c.id_categoria = p.id_categoria
       JOIN Materiales m ON m.id_material  = p.id_material
       WHERE p.stock_actual <= p.stock_minimo
       ORDER BY p.stock_actual ASC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getStats, getStockAlerts };
