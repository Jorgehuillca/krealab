const { pool } = require('../config/database');

const getMaterials = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Materiales ORDER BY nombre_material');
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getMaterials };
