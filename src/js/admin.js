import { apiRequest } from "./api.js";
import { initAuth } from "./auth.js";
import { renderArticles } from "./events.js";
import { renderRecommendations } from "./products.js";

const state = {
  products: [],
  news: [],
  users: [],
  catalogs: { marcas: [], categorias: [] },
  tab: "Resumen",
  editing: null,
  message: "",
  error: "",
};

const adminView = document.querySelector("#admin-view");
const siteView = document.querySelector("#site-view");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function productForAdmin(product) {
  return {
    ...product,
    number: String(product.id).padStart(2, "0"),
    title: product.nombre,
    category: product.categoria,
    description: product.descripcion,
    image: product.imagen,
    price: product.precio,
    brand: product.marca,
    stock: product.stock,
  };
}

function renderAdminForm() {
  if (!state.editing) return "";
  const { kind, record, original } = state.editing;
  const title = kind === "product"
    ? (original ? "Editar producto" : "Nuevo producto")
    : kind === "article"
      ? (original ? "Editar noticia" : "Nueva noticia")
      : (original ? "Editar usuario" : "Nueva cuenta");

  if (kind === "product") {
    const options = (items, selected) => items.map((item) =>
      `<option value="${item.id}"${Number(selected) === Number(item.id) ? " selected" : ""}>${escapeHtml(item.nombre)}</option>`
    ).join("");
    return `<form class="admin-form" id="record-form" data-kind="product">
      <h3>${title}</h3>
      <label>Nombre del producto<input name="nombre" maxlength="150" required value="${escapeHtml(record.title)}"></label>
      <label>Marca<select name="marcaId" required><option value="">Selecciona una marca</option>${options(state.catalogs.marcas, record.marcaId)}</select></label>
      <label>Categoría<select name="categoriaId" required><option value="">Selecciona una categoría</option>${options(state.catalogs.categorias, record.categoriaId)}</select></label>
      <label>Precio<input name="precio" type="number" min="0" step="0.01" required value="${escapeHtml(record.price)}"></label>
      <label>Existencias<input name="stock" type="number" min="0" step="1" required value="${escapeHtml(record.stock)}"></label>
      <label>Tipo de piel<input name="tipoPiel" maxlength="120" value="${escapeHtml(record.tipoPiel)}"></label>
      <label>Ingredientes<textarea name="ingredientes" maxlength="2000">${escapeHtml(record.ingredientes)}</textarea></label>
      <label>Descripción<textarea name="descripcion" maxlength="2000" required>${escapeHtml(record.description)}</textarea></label>
      <label>URL o ruta de imagen<input name="imagen" type="text" maxlength="255" required value="${escapeHtml(record.image)}"></label>
      ${renderFormFeedback()}
      <div class="admin-form-actions"><button class="admin-primary" type="submit">Guardar</button><button class="admin-secondary" type="button" data-action="cancel-edit">Cancelar</button></div>
    </form>`;
  }

  if (kind === "article") {
    return `<form class="admin-form" id="record-form" data-kind="article">
      <h3>${title}</h3>
      <label>Categoría<input name="tag" maxlength="80" required value="${escapeHtml(record.tag)}"></label>
      <label>Título<input name="title" maxlength="150" required value="${escapeHtml(record.title)}"></label>
      <label>Contenido<textarea name="text" maxlength="10000" required>${escapeHtml(record.text)}</textarea></label>
      ${renderFormFeedback()}
      <div class="admin-form-actions"><button class="admin-primary" type="submit">Guardar</button><button class="admin-secondary" type="button" data-action="cancel-edit">Cancelar</button></div>
    </form>`;
  }

  const role = record.role === "Administrador" ? "admin" : "cliente";
  return `<form class="admin-form" id="record-form" data-kind="user">
    <h3>${title}</h3>
    <label>Nombre<input name="name" maxlength="80" minlength="2" required value="${escapeHtml(record.name)}"></label>
    <label>Correo electrónico<input name="email" type="email" maxlength="120" required value="${escapeHtml(record.email)}"></label>
    <label>Rol<select name="role"><option value="cliente"${role === "cliente" ? " selected" : ""}>Cliente</option><option value="admin"${role === "admin" ? " selected" : ""}>Administrador</option></select></label>
    <label>${original ? "Nueva contraseña (opcional)" : "Contraseña"}<input name="password" type="password" minlength="12" autocomplete="new-password"${original ? "" : " required"} placeholder="Al menos 12 caracteres"></label>
    ${renderFormFeedback()}
    <div class="admin-form-actions"><button class="admin-primary" type="submit">Guardar</button><button class="admin-secondary" type="button" data-action="cancel-edit">Cancelar</button></div>
  </form>`;
}

function renderFormFeedback() {
  return state.error ? `<p class="admin-error" role="alert">${escapeHtml(state.error)}</p>` : "";
}

function getKindRecords(kind) {
  return kind === "product" ? state.products : kind === "article" ? state.news : state.users;
}

function recordId(kind, record) {
  return kind === "product" || kind === "user" ? record.id : record.id;
}

function renderAdminRecords(kind, records) {
  if (!records.length) return '<p class="admin-empty">No hay registros para mostrar.</p>';
  return `<div class="admin-record-list">${records.map((record, index) => {
    const isProduct = kind === "product";
    const heading = isProduct ? record.title : kind === "article" ? record.title : record.name;
    const category = isProduct ? record.category : kind === "article" ? record.tag : record.role;
    const summary = isProduct ? `${record.brand} · $${Number(record.price).toFixed(2)} · ${record.stock} unidades`
      : kind === "article" ? record.text : record.email;
    const details = isProduct
      ? `<img src="${escapeHtml(record.image)}" alt=""><div><small>${escapeHtml(category)}</small><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(summary)}</p></div>`
      : `<div><small>${escapeHtml(category)}</small><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(summary)}</p></div>`;
    return `<article class="admin-record${isProduct ? "" : " admin-text-record"}">
      ${details}
      <button type="button" data-action="edit" data-kind="${kind}" data-index="${index}">Editar</button>
      <button type="button" class="admin-delete" data-action="delete" data-kind="${kind}" data-id="${escapeHtml(recordId(kind, record))}">Eliminar</button>
    </article>`;
  }).join("")}</div>`;
}

function renderAdminContent() {
  if (state.tab === "Resumen") {
    return `<section class="admin-content">
      <div class="admin-summary-intro"><p>GESTIÓN DEL CONTENIDO</p><h2>Administración del sitio</h2><span>Los cambios se guardan en la base de datos del servidor.</span></div>
      <div class="admin-stats"><article><span>Productos</span><b>${state.products.length}</b></article><article><span>Noticias</span><b>${state.news.length}</b></article><article><span>Cuentas</span><b>${state.users.length}</b></article></div>
      <div class="admin-security-note"><b>Acceso protegido</b><p>Las modificaciones requieren una sesión de administrador en el servidor.</p></div>
    </section>`;
  }

  const details = {
    Productos: { kind: "product", label: "CATÁLOGO", heading: "Productos", records: state.products },
    Noticias: { kind: "article", label: "CONTENIDO EDITORIAL", heading: "Noticias y recursos", records: state.news },
    Usuarios: { kind: "user", label: "CUENTAS", heading: "Usuarios", records: state.users },
  }[state.tab];
  const addLabel = details.kind === "product" ? "producto" : details.kind === "article" ? "noticia" : "usuario";
  const emptyRecord = details.kind === "product"
    ? { id: "", title: "", category: "", description: "", image: "", price: "", stock: "", brand: "", marcaId: "", categoriaId: "", tipoPiel: "", ingredientes: "" }
    : details.kind === "article" ? { id: "", tag: "", title: "", text: "" }
      : { id: "", name: "", email: "", role: "Cliente" };

  return `<section class="admin-content">
    <div class="admin-section-title"><div><p>${details.label}</p><h2>${details.heading}</h2></div><button type="button" class="admin-primary" data-action="add" data-kind="${details.kind}">+ Añadir ${addLabel}</button></div>
    ${renderAdminForm()}${renderAdminRecords(details.kind, details.records)}
  </section>`;
}

function renderAdmin() {
  const tabs = ["Resumen", "Productos", "Noticias", "Usuarios"];
  adminView.innerHTML = `<div class="admin-shell">
    <aside class="admin-sidebar">
      <a class="school-logo admin-logo" href="#" data-action="exit"><span class="school-logo-mark">DB</span><span class="school-logo-copy"><b>IPIDB</b><small>Administración</small></span></a>
      <p class="admin-nav-title">PANEL DE CONTROL</p>
      <nav aria-label="Secciones administrativas">${tabs.map((tab) => `<button type="button" class="${state.tab === tab ? "active" : ""}" data-action="tab" data-tab="${tab}">${tab}</button>`).join("")}</nav>
      <button class="admin-exit" type="button" data-action="exit">← Cerrar sesión</button>
    </aside>
    <main class="admin-main">
      <header class="admin-heading"><div><p class="eyebrow">INSTITUTO POLITÉCNICO INDUSTRIAL DON BOSCO</p><h1>${state.tab}</h1></div><span class="admin-demo-tag">ADMINISTRACIÓN</span></header>
      ${state.message ? `<p class="admin-message" role="status">${escapeHtml(state.message)}</p>` : ""}
      ${state.error && !state.editing ? `<p class="admin-error" role="alert">${escapeHtml(state.error)}</p>` : ""}
      ${renderAdminContent()}
    </main>
  </div>`;
}

async function refreshData() {
  const [products, news, users, catalogs] = await Promise.all([
    apiRequest("products"),
    apiRequest("news"),
    apiRequest("users"),
    apiRequest("catalogs"),
  ]);
  if (![products, news, users].every(Array.isArray)) {
    throw new Error("El servidor devolvió datos administrativos en un formato inesperado.");
  }
  state.products = products.map(productForAdmin);
  state.news = news;
  state.users = users;
  state.catalogs = catalogs;
  renderRecommendations(products.map((product) => ({
    ...product,
    number: String(product.id).padStart(2, "0"),
    category: product.categoria,
    title: product.nombre,
    alt: `Producto ${product.nombre}`,
    image: product.imagen,
    source: "database",
  })));
  renderArticles(news);
}

function enterAdmin() {
  siteView.hidden = true;
  adminView.hidden = false;
  state.tab = "Resumen";
  state.editing = null;
  state.message = "";
  state.error = "";
  refreshData().then(renderAdmin).catch((error) => {
    state.error = `No se pudo cargar el panel: ${error.message}`;
    renderAdmin();
  });
  window.scrollTo(0, 0);
}

async function exitAdmin() {
  state.error = "";
  try {
    await apiRequest("auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("auth:logout"));
    adminView.hidden = true;
    siteView.hidden = false;
    window.scrollTo(0, 0);
  } catch (error) {
    state.error = error.message;
    renderAdmin();
  }
}

function handleAdminAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, kind, index, id, tab } = button.dataset;
  state.error = "";
  state.message = "";

  if (action === "exit") {
    void exitAdmin();
    return;
  }
  if (action === "tab") {
    state.tab = tab;
    state.editing = null;
  } else if (action === "add") {
    const record = kind === "product"
      ? { id: "", title: "", category: "", description: "", image: "", price: "", stock: "", brand: "", marcaId: "", categoriaId: "", tipoPiel: "", ingredientes: "" }
      : kind === "article" ? { id: "", tag: "", title: "", text: "" }
        : { id: "", name: "", email: "", role: "Cliente" };
    state.editing = { kind, record, original: null };
  } else if (action === "edit") {
    const original = getKindRecords(kind)[Number(index)];
    state.editing = { kind, record: { ...original }, original };
  } else if (action === "cancel-edit") {
    state.editing = null;
  } else if (action === "delete") {
    void deleteRecord(kind, id);
    return;
  }
  renderAdmin();
}

async function deleteRecord(kind, id) {
  const endpoint = kind === "product" ? "products" : kind === "article" ? "news" : "users";
  try {
    await apiRequest(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    state.message = "Registro eliminado del servidor.";
    await refreshData();
  } catch (error) {
    state.error = error.message;
  }
  renderAdmin();
}

async function handleRecordSubmit(event) {
  if (event.target.id !== "record-form") return;
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  for (const key in data) data[key] = String(data[key]).trim();
  const { kind, original } = state.editing;
  const endpoint = kind === "product" ? "products" : kind === "article" ? "news" : "users";
  const method = original ? "PUT" : "POST";
  if (original) data.id = original.id;

  if (kind === "product") {
    data.precio = Number(data.precio);
    data.stock = Number(data.stock);
    data.marcaId = Number(data.marcaId);
    data.categoriaId = Number(data.categoriaId);
  } else if (kind === "user" && !data.password) {
    delete data.password;
  }

  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    await apiRequest(endpoint, { method, body: kind === "user" ? { ...data, role: data.role } : data });
    state.editing = null;
    state.message = "Cambios guardados en la base de datos.";
    state.error = "";
    await refreshData();
  } catch (error) {
    state.error = error.message;
  } finally {
    renderAdmin();
  }
}

export function initAdmin() {
  adminView.addEventListener("click", handleAdminAction);
  adminView.addEventListener("submit", (event) => void handleRecordSubmit(event));
  initAuth((user) => {
    if (user.rol === "admin") enterAdmin();
  });
}
