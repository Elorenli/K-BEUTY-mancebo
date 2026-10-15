import { createServer } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { hashPassword, verifyPassword } from "./security.js";

const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const MAX_BODY_SIZE = 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error {
  constructor(status, message, headers = {}) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

function json(response, status, value, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(JSON.stringify(value));
}

function requireMethod(request, ...allowed) {
  if (!allowed.includes(request.method)) {
    throw new HttpError(405, "Método no permitido", { Allow: allowed.join(", ") });
  }
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
      throw new HttpError(413, "La solicitud supera el tamaño permitido");
    }
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new HttpError(400, "El cuerpo debe ser JSON válido");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "El cuerpo debe ser un objeto JSON");
  }
  return data;
}

function requiredString(data, key, maxLength) {
  const value = data[key];
  if (typeof value !== "string") throw new HttpError(422, `El campo ${key} es obligatorio`);
  const trimmed = value.trim();
  if (!trimmed || [...trimmed].length > maxLength) throw new HttpError(422, `El campo ${key} no es válido`);
  return trimmed;
}

function optionalString(data, key, maxLength) {
  const value = data[key] ?? "";
  if (typeof value !== "string" || [...value.trim()].length > maxLength) {
    throw new HttpError(422, `El campo ${key} no es válido`);
  }
  return value.trim();
}

function validEmail(value) {
  return typeof value === "string" &&
    Buffer.byteLength(value) <= 120 &&
    EMAIL_PATTERN.test(value.trim());
}

function cookieToken(request) {
  const cookieHeader = request.headers.cookie ?? "";
  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== "site_session") continue;
    return cookie.slice(separator + 1).trim();
  }
  return null;
}

function cookieHeader(request, token) {
  const secure = request.socket.encrypted ? "; Secure" : "";
  if (!token) return `site_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
  return `site_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_LIFETIME_MS / 1000}${secure}`;
}

function activeSession(database, request) {
  const token = cookieToken(request);
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) return null;

  const session = database.prepare(`
    SELECT s.token, s.csrf_token, s.expires_at, u.id, u.name, u.email, u.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(token);
  if (!session) return null;
  if (session.expires_at <= Date.now()) {
    database.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return {
    token: session.token,
    csrfToken: session.csrf_token,
    user: { id: session.id, nombre: session.name, correo: session.email, rol: session.role },
  };
}

function requireAdmin(database, request) {
  const session = activeSession(database, request);
  if (!session || session.user.rol !== "admin") {
    throw new HttpError(401, "Debes iniciar sesión como administrador");
  }
  return session;
}

function requireCsrf(session, request) {
  const provided = request.headers["x-csrf-token"];
  if (typeof provided !== "string" || provided.length !== session.csrfToken.length ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(session.csrfToken))) {
    throw new HttpError(403, "La sesión expiró. Inicia sesión nuevamente");
  }
}

function sendCookie(request, response, token) {
  response.setHeader("Set-Cookie", cookieHeader(request, token));
}

function uniqueConflict(error) {
  return error && typeof error === "object" && error.code === "ERR_SQLITE_ERROR" &&
    /UNIQUE constraint failed/.test(error.message);
}

function loginUser(user) {
  return { id: user.id, nombre: user.name, correo: user.email, rol: user.role };
}

function positiveInteger(value) {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function productImageIsValid(image) {
  try {
    const url = new URL(image);
    if (["http:", "https:"].includes(url.protocol)) return true;
  } catch {
    return image.startsWith("./images/") && !image.includes("..");
  }
  return false;
}

function getProductInput(data) {
  const name = requiredString(data, "nombre", 150);
  const description = requiredString(data, "descripcion", 2000);
  const image = requiredString(data, "imagen", 255);
  const ingredients = optionalString(data, "ingredientes", 2000);
  const skinType = optionalString(data, "tipoPiel", 120);
  const price = Number(data.precio);
  const stock = Number(data.stock);
  const brandId = positiveInteger(data.marcaId);
  const categoryId = positiveInteger(data.categoriaId);
  if (data.precio === "" || data.precio == null || !Number.isFinite(price) || price < 0 || price > 999999.99 ||
      data.stock === "" || data.stock == null || !Number.isSafeInteger(stock) || stock < 0 ||
      !brandId || !categoryId || !productImageIsValid(image)) {
    throw new HttpError(422, "Precio, existencia, marca o categoría no válidos");
  }
  return { name, description, image, ingredients, skinType, price, stock, brandId, categoryId };
}

function sendMissing(message) {
  throw new HttpError(404, message);
}

async function handleAuth(database, request, response, url) {
  if (url.pathname === "/api/auth/session") {
    requireMethod(request, "GET");
    const session = activeSession(database, request);
    json(response, 200, {
      user: session ? session.user : null,
      csrfToken: session ? session.csrfToken : null,
    });
    return;
  }

  if (url.pathname === "/api/auth/login") {
    requireMethod(request, "POST");
    const data = await readJson(request);
    const email = validEmail(data.correo) ? data.correo.trim().toLowerCase() : null;
    const password = data.password;
    if (!email || typeof password !== "string" || !password || Buffer.byteLength(password) > 1024) {
      throw new HttpError(401, "Correo o contraseña incorrectos");
    }

    const user = database.prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ?").get(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new HttpError(401, "Correo o contraseña incorrectos");
    }

    const previousToken = cookieToken(request);
    if (previousToken) database.prepare("DELETE FROM sessions WHERE token = ?").run(previousToken);
    const token = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(32).toString("hex");
    database.prepare("INSERT INTO sessions (token, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)")
      .run(token, user.id, csrfToken, Date.now() + SESSION_LIFETIME_MS);
    sendCookie(request, response, token);
    json(response, 200, { user: loginUser(user), csrfToken });
    return;
  }

  if (url.pathname === "/api/auth/register") {
    requireMethod(request, "POST");
    const data = await readJson(request);
    const name = requiredString(data, "nombre", 80);
    const email = validEmail(data.correo) ? data.correo.trim().toLowerCase() : null;
    const password = data.password;
    const confirmation = data.confirmacion;
    if ([...name].length < 2 || !email || typeof password !== "string" ||
        Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 1024 ||
        typeof confirmation !== "string" || password !== confirmation) {
      throw new HttpError(422, "Revisa los datos. La contraseña debe tener al menos 12 caracteres y ambas deben coincidir.");
    }

    try {
      database.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'cliente')")
        .run(name, email, await hashPassword(password));
    } catch (error) {
      if (uniqueConflict(error)) throw new HttpError(409, "Ya existe una cuenta con ese correo");
      throw error;
    }
    json(response, 201, { message: "Cuenta creada. Ahora puedes iniciar sesión." });
    return;
  }

  if (url.pathname === "/api/auth/logout") {
    requireMethod(request, "POST");
    const session = activeSession(database, request);
    if (!session) throw new HttpError(401, "No hay una sesión iniciada");
    requireCsrf(session, request);
    database.prepare("DELETE FROM sessions WHERE token = ?").run(session.token);
    sendCookie(request, response, null);
    json(response, 200, { message: "Sesión cerrada" });
    return;
  }

  throw new HttpError(404, "Recurso no encontrado");
}

async function handleProducts(database, request, response, url) {
  requireMethod(request, "GET", "POST", "PUT", "DELETE");
  if (request.method === "GET") {
    const rows = database.prepare(`
      SELECT p.id, p.name AS nombre, p.price AS precio, p.stock, p.skin_type AS tipoPiel,
             p.ingredients AS ingredientes, p.description AS descripcion, p.image AS imagen,
             p.brand_id AS marcaId, p.category_id AS categoriaId,
             b.name AS marca, c.name AS categoria
      FROM products p JOIN brands b ON b.id = p.brand_id
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.id
    `).all();
    json(response, 200, rows);
    return;
  }

  const session = requireAdmin(database, request);
  requireCsrf(session, request);
  if (request.method === "DELETE") {
    const id = positiveInteger(url.searchParams.get("id"));
    if (!id) throw new HttpError(422, "Falta un identificador de producto válido");
    if (!database.prepare("DELETE FROM products WHERE id = ?").run(id).changes) sendMissing("No se encontró el producto");
    json(response, 200, { message: "Producto eliminado" });
    return;
  }

  const data = await readJson(request);
  const product = getProductInput(data);
  if (!database.prepare("SELECT 1 FROM brands WHERE id = ?").get(product.brandId) ||
      !database.prepare("SELECT 1 FROM categories WHERE id = ?").get(product.categoryId)) {
    throw new HttpError(422, "La marca o categoría seleccionada no existe");
  }
  const values = [product.name, product.brandId, product.categoryId, product.price, product.stock,
    product.skinType, product.ingredients, product.description, product.image];

  if (request.method === "POST") {
    const result = database.prepare(`
      INSERT INTO products (name, brand_id, category_id, price, stock, skin_type, ingredients, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(...values);
    json(response, 201, { id: Number(result.lastInsertRowid) });
    return;
  }

  const id = positiveInteger(data.id);
  if (!id) throw new HttpError(422, "Falta un identificador de producto válido");
  const result = database.prepare(`
    UPDATE products SET name = ?, brand_id = ?, category_id = ?, price = ?, stock = ?,
      skin_type = ?, ingredients = ?, description = ?, image = ? WHERE id = ?
  `).run(...values, id);
  if (!result.changes && !database.prepare("SELECT 1 FROM products WHERE id = ?").get(id)) {
    sendMissing("No se encontró el producto");
  }
  json(response, 200, { message: "Producto actualizado" });
}

async function handleNews(database, request, response, url) {
  requireMethod(request, "GET", "POST", "PUT", "DELETE");
  if (request.method === "GET") {
    const rows = database.prepare(`
      SELECT id, category AS tag, title, content AS text FROM news
      ORDER BY created_at DESC, id DESC
    `).all();
    json(response, 200, rows);
    return;
  }

  const session = requireAdmin(database, request);
  requireCsrf(session, request);
  if (request.method === "DELETE") {
    const id = positiveInteger(url.searchParams.get("id"));
    if (!id) throw new HttpError(422, "Falta un identificador de noticia válido");
    if (!database.prepare("DELETE FROM news WHERE id = ?").run(id).changes) sendMissing("No se encontró la noticia");
    json(response, 200, { message: "Noticia eliminada" });
    return;
  }

  const data = await readJson(request);
  const category = requiredString(data, "tag", 80);
  const title = requiredString(data, "title", 150);
  const content = requiredString(data, "text", 10000);
  if (request.method === "POST") {
    const result = database.prepare("INSERT INTO news (category, title, content) VALUES (?, ?, ?)")
      .run(category, title, content);
    json(response, 201, { id: Number(result.lastInsertRowid) });
    return;
  }

  const id = positiveInteger(data.id);
  if (!id) throw new HttpError(422, "Falta un identificador de noticia válido");
  const result = database.prepare("UPDATE news SET category = ?, title = ?, content = ? WHERE id = ?")
    .run(category, title, content, id);
  if (!result.changes && !database.prepare("SELECT 1 FROM news WHERE id = ?").get(id)) {
    sendMissing("No se encontró la noticia");
  }
  json(response, 200, { message: "Noticia actualizada" });
}

async function handleUsers(database, request, response, url) {
  requireMethod(request, "GET", "POST", "PUT", "DELETE");
  const session = requireAdmin(database, request);
  if (request.method === "GET") {
    const rows = database.prepare(`
      SELECT id, name AS name, email AS email,
        CASE role WHEN 'admin' THEN 'Administrador' ELSE 'Cliente' END AS role
      FROM users ORDER BY name
    `).all();
    json(response, 200, rows);
    return;
  }
  requireCsrf(session, request);

  if (request.method === "DELETE") {
    const id = positiveInteger(url.searchParams.get("id"));
    if (!id) throw new HttpError(422, "Falta un identificador de usuario válido");
    if (id === session.user.id) throw new HttpError(422, "No puedes eliminar tu propia cuenta");
    const target = database.prepare("SELECT role FROM users WHERE id = ?").get(id);
    if (!target) sendMissing("No se encontró el usuario");
    if (target.role === "admin" && database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count <= 1) {
      throw new HttpError(422, "Debe quedar al menos una cuenta administradora");
    }
    database.prepare("DELETE FROM users WHERE id = ?").run(id);
    json(response, 200, { message: "Usuario eliminado" });
    return;
  }

  const data = await readJson(request);
  const name = requiredString(data, "name", 80);
  const email = validEmail(data.email) ? data.email.trim().toLowerCase() : null;
  const role = data.role;
  if ([...name].length < 2 || !email || !["cliente", "admin"].includes(role)) {
    throw new HttpError(422, "Correo o rol no válido");
  }

  if (request.method === "POST") {
    const password = data.password;
    if (typeof password !== "string" || Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 1024) {
      throw new HttpError(422, "La contraseña debe tener al menos 12 caracteres");
    }
    try {
      const result = database.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
        .run(name, email, await hashPassword(password), role);
      json(response, 201, { id: Number(result.lastInsertRowid) });
    } catch (error) {
      if (uniqueConflict(error)) throw new HttpError(409, "Ya existe una cuenta con ese correo");
      throw error;
    }
    return;
  }

  const id = positiveInteger(data.id);
  if (!id) throw new HttpError(422, "Falta un identificador de usuario válido");
  const password = data.password ?? "";
  if (typeof password !== "string" ||
      (password !== "" && (Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 1024))) {
    throw new HttpError(422, "La nueva contraseña debe tener al menos 12 caracteres");
  }
  if (id === session.user.id && role !== "admin") {
    throw new HttpError(422, "No puedes quitarte el rol de administradora mientras tienes la sesión abierta");
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    const target = database.prepare("SELECT id, role FROM users WHERE id = ?").get(id);
    if (!target) sendMissing("No se encontró el usuario");
    if (target.role === "admin" && role !== "admin" &&
        database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count <= 1) {
      throw new HttpError(422, "Debe quedar al menos una cuenta administradora");
    }
    database.prepare("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?").run(name, email, role, id);
    if (password) {
      database.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(password), id);
      database.prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?").run(id, session.token);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    if (uniqueConflict(error)) throw new HttpError(409, "Ya existe una cuenta con ese correo");
    throw error;
  }
  json(response, 200, { message: "Usuario actualizado" });
}

async function handleRequest(database, request, response) {
  let url;
  try {
    url = new URL(request.url, "http://localhost");
  } catch {
    throw new HttpError(400, "La dirección de solicitud no es válida");
  }
  if (url.pathname === "/api/health") {
    requireMethod(request, "GET");
    database.prepare("SELECT 1").get();
    json(response, 200, { status: "ok", database: "sqlite" });
    return;
  }
  if (url.pathname.startsWith("/api/auth/")) return handleAuth(database, request, response, url);
  if (url.pathname === "/api/products") return handleProducts(database, request, response, url);
  if (url.pathname === "/api/news") return handleNews(database, request, response, url);
  if (url.pathname === "/api/events") {
    requireMethod(request, "GET");
    const rows = database.prepare(`
      SELECT id, title AS titulo, date AS fecha, type AS tipo, description AS descripcion
      FROM events ORDER BY date IS NULL, date, id
    `).all();
    json(response, 200, rows);
    return;
  }
  if (url.pathname === "/api/contact") {
    requireMethod(request, "POST");
    const data = await readJson(request);
    const name = requiredString(data, "nombre", 80);
    const email = validEmail(data.correo) ? data.correo.trim().toLowerCase() : null;
    const message = requiredString(data, "mensaje", 5000);
    if ([...name].length < 2 || !email || [...message].length < 10) {
      throw new HttpError(422, "Revisa el nombre, correo y mensaje e inténtalo de nuevo");
    }
    database.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)")
      .run(name, email, message);
    json(response, 201, { message: "Mensaje recibido correctamente" });
    return;
  }
  if (url.pathname === "/api/catalogs") {
    requireMethod(request, "GET");
    json(response, 200, {
      marcas: database.prepare("SELECT id, name AS nombre FROM brands ORDER BY name").all(),
      categorias: database.prepare("SELECT id, name AS nombre FROM categories ORDER BY name").all(),
    });
    return;
  }
  if (url.pathname === "/api/users") return handleUsers(database, request, response, url);
  throw new HttpError(404, "Recurso no encontrado");
}

export function createApplicationServer(database) {
  return createServer((request, response) => {
    handleRequest(database, request, response).catch((error) => {
      if (response.headersSent) {
        response.destroy(error);
        return;
      }
      if (error instanceof HttpError) {
        json(response, error.status, { error: error.message }, error.headers);
        return;
      }
      console.error("Error de API:", error);
      json(response, 500, { error: "Ocurrió un error interno en el servidor" });
    });
  });
}
