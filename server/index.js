import { createDatabase } from "./db.js";
import { createApplicationServer } from "./app.js";

const port = Number(process.env.API_PORT || 8000);
const host = process.env.API_HOST || "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("API_PORT debe ser un puerto válido entre 1 y 65535");
}

const database = createDatabase();
const server = createApplicationServer(database);

server.on("error", (error) => {
  console.error("No se pudo iniciar el servidor de la API:", error.message);
  database.close();
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`API lista en http://${host}:${port} (SQLite)`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
