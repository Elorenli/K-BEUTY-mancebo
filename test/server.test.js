import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApplicationServer } from "../server/app.js";
import { createDatabase } from "../server/db.js";
import { hashPassword } from "../server/security.js";

test("API de sitio y panel con SQLite", async (t) => {
  const database = createDatabase(":memory:");
  const password = "una-clave-segura-123";
  database.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run("Administradora", "admin@ejemplo.com", await hashPassword(password), "admin");

  const server = createApplicationServer(database);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => {
    server.close();
    database.close();
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const request = (path, options = {}) => fetch(`${baseUrl}/api/${path}`, options);
  const post = (path, body, extraHeaders = {}) => request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });

  const healthResponse = await request("health");
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: "ok", database: "sqlite" });

  const productsResponse = await request("products");
  assert.equal(productsResponse.status, 200);
  const products = await productsResponse.json();
  assert.equal(products.length, 5);
  assert.equal(products[0].marca, "Beauty of Joseon");
  assert.ok(Number.isInteger(products[0].marcaId));

  const eventsResponse = await request("events");
  assert.equal((await eventsResponse.json()).length, 4);
  const newsResponse = await request("news");
  assert.equal((await newsResponse.json()).length, 3);
  assert.equal((await request("catalogs")).status, 200);
  assert.equal((await post("contact", {
    nombre: "Visitante",
    correo: "visita@example.com",
    mensaje: "Tengo una consulta para el equipo.",
  })).status, 201);

  const protectedResponse = await request("users");
  assert.equal(protectedResponse.status, 401);
  const badRegistration = await post("auth/register", {
    nombre: "Cliente",
    correo: "cliente@example.com",
    password: "una-clave-segura-123",
    confirmacion: "no-coincide",
  });
  assert.equal(badRegistration.status, 422);
  const registration = await post("auth/register", {
    nombre: "Cliente",
    correo: "cliente@example.com",
    password: "una-clave-segura-123",
    confirmacion: "una-clave-segura-123",
  });
  assert.equal(registration.status, 201);
  const duplicateRegistration = await post("auth/register", {
    nombre: "Cliente",
    correo: "CLIENTE@example.com",
    password: "una-clave-segura-123",
    confirmacion: "una-clave-segura-123",
  });
  assert.equal(duplicateRegistration.status, 409);

  const clientLogin = await post("auth/login", {
    correo: "cliente@example.com",
    password: "una-clave-segura-123",
  });
  assert.equal(clientLogin.status, 200);
  assert.equal((await clientLogin.json()).user.rol, "cliente");
  const clientCookie = clientLogin.headers.get("set-cookie").split(";")[0];
  const clientSession = await request("users", { headers: { Cookie: clientCookie } });
  assert.equal(clientSession.status, 401);
  const clientData = await request("auth/session", { headers: { Cookie: clientCookie } });
  const clientSessionData = await clientData.json();
  assert.equal((await post("auth/logout", {}, {
    Cookie: clientCookie,
    "X-CSRF-Token": clientSessionData.csrfToken,
  })).status, 200);

  const invalidLogin = await post("auth/login", { correo: "admin@ejemplo.com", password: "incorrecta" });
  assert.equal(invalidLogin.status, 401);

  const loginResponse = await post("auth/login", { correo: "ADMIN@ejemplo.com", password });
  assert.equal(loginResponse.status, 200);
  const login = await loginResponse.json();
  assert.equal(login.user.rol, "admin");
  const cookie = loginResponse.headers.get("set-cookie").split(";")[0];
  const authenticatedHeaders = { Cookie: cookie, "X-CSRF-Token": login.csrfToken };

  const sessionResponse = await request("auth/session", { headers: { Cookie: cookie } });
  assert.equal((await sessionResponse.json()).user.rol, "admin");
  const adminUsers = await request("users", { headers: { Cookie: cookie } });
  const userList = await adminUsers.json();
  assert.deepEqual(userList.map((user) => user.role), ["Administrador", "Cliente"]);
  const selfDelete = await request("users?id=1", { method: "DELETE", headers: authenticatedHeaders });
  assert.equal(selfDelete.status, 422);
  const badCsrf = await post("news", { tag: "TEST", title: "Protegido", text: "Prueba." }, {
    Cookie: cookie,
    "X-CSRF-Token": "incorrecto",
  });
  assert.equal(badCsrf.status, 403);

  const newProductResponse = await post("products", {
    nombre: "Producto de prueba",
    descripcion: "Descripción del producto de prueba.",
    imagen: "./images/SKIN1004.png",
    ingredientes: "Centella.",
    tipoPiel: "Todo tipo de piel",
    precio: 20,
    stock: 12,
    marcaId: 104,
    categoriaId: 5,
  }, authenticatedHeaders);
  assert.equal(newProductResponse.status, 201);
  const newProductId = (await newProductResponse.json()).id;
  const deleteProduct = await request(`products?id=${newProductId}`, {
    method: "DELETE",
    headers: authenticatedHeaders,
  });
  assert.equal(deleteProduct.status, 200);

  const newArticle = await post("news", { tag: "TEST", title: "Noticia de prueba", text: "Contenido de prueba." }, authenticatedHeaders);
  assert.equal(newArticle.status, 201);
  const newArticleId = (await newArticle.json()).id;
  const updateArticle = await request("news", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authenticatedHeaders },
    body: JSON.stringify({ id: newArticleId, tag: "TEST", title: "Noticia editada", text: "Contenido actualizado." }),
  });
  assert.equal(updateArticle.status, 200);
  const deleteArticle = await request(`news?id=${newArticleId}`, {
    method: "DELETE",
    headers: authenticatedHeaders,
  });
  assert.equal(deleteArticle.status, 200);

  const logout = await post("auth/logout", {}, authenticatedHeaders);
  assert.equal(logout.status, 200);
  const loggedOut = await request("auth/session", { headers: { Cookie: cookie } });
  assert.equal((await loggedOut.json()).user, null);
});
