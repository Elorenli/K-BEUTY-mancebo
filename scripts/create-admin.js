import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createDatabase } from "../server/db.js";
import { hashPassword } from "../server/security.js";

if (!stdin.isTTY || !stdout.isTTY) {
  console.error("Ejecuta npm run create-admin desde una terminal interactiva.");
  process.exit(1);
}

const readline = createInterface({ input: stdin, output: stdout });
const database = createDatabase();
try {
  const name = (await readline.question("Nombre: ")).trim();
  const email = (await readline.question("Correo: ")).trim().toLowerCase();
  const password = await readline.question("Contraseña (mínimo 12 caracteres): ");
  if (name.length < 2 || [...name].length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || Buffer.byteLength(email) > 120 ||
      Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 1024) {
    throw new Error("Nombre, correo o contraseña no válidos.");
  }

  database.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run(name, email, await hashPassword(password));
  console.log("Cuenta administradora creada correctamente.");
} catch (error) {
  if (error.code === "ERR_SQLITE_ERROR" && /UNIQUE constraint failed/.test(error.message)) {
    console.error("Ya existe una cuenta con ese correo.");
    process.exitCode = 1;
  } else {
    console.error(error.message);
    process.exitCode = 1;
  }
} finally {
  readline.close();
  database.close();
}
