require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 4000;

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 KreaLab API corriendo en http://localhost:${PORT}`);
    console.log(`📦 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  });
})();
