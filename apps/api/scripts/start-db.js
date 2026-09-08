const epModule = require("embedded-postgres");
const EmbeddedPostgres = epModule.default || epModule;
const path = require("path");
const fs = require("fs");

async function main() {
  const dataDir = path.resolve(__dirname, "../../../.postgres_data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: 5432,
    user: "postgres",
    password: "postgres",
    name: "freelancehub",
    persistent: true,
  });

  console.log("Checking local PostgreSQL instance...");
  try {
    await pg.initialise();
  } catch (err) {
    // Already initialized
  }

  try {
    await pg.start();
    console.log("PostgreSQL server running on port 5432.");
  } catch (err) {
    console.log("PostgreSQL start notice:", err.message);
  }

  try {
    await pg.createDatabase("freelancehub");
    console.log("Database 'freelancehub' confirmed/created.");
  } catch (err) {
    // Database may already exist
  }

  console.log("READY_FOR_CONNECTIONS");

  // Keep node process alive to maintain postgres daemon
  setInterval(() => {}, 1000 * 60 * 60);
}

main().catch((err) => {
  console.error("Failed to start PostgreSQL:", err);
  process.exit(1);
});
