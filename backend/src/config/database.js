const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             process.env.DB_PORT     || 3306,
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'KreaLab_Final',
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  timezone:         '-05:00', // Perú
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado a MySQL:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌ Error de conexión a MySQL:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
