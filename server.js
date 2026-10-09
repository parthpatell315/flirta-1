const app = require('./src/app');
const config = require('./src/config/config');
const { getDb } = require('./src/db/database');
const { seed } = require('./src/db/seed');

async function startServer() {
  // Ensure DB and seed are ready
  getDb();
  await seed();

  const server = app.listen(config.PORT, () => {
    console.log(`===============================================`);
    console.log(`  GarbaJodi Navratri 2026 Server Running       `);
    console.log(`  URL: http://localhost:${config.PORT}          `);
    console.log(`  Module: http://localhost:${config.PORT}/garba-partner`);
    console.log(`  Environment: ${config.NODE_ENV}              `);
    console.log(`===============================================`);
  });

  return server;
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { startServer };
