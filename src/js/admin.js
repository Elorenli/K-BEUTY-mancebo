import { getProducts, renderRecommendations, setProducts } from "./products.js";
import { initDemoAuth } from "./auth.js";
import { articles, renderArticles } from "./events.js";

const storageKeys = {
  products: "ipidb-demo-products",
  news: "ipidb-demo-news",
  users: "ipidb-demo-users",
};
// Integración futura: sustituir estos datos locales por fetch a /api/products, /api/news y /api/users.
// Las rutas y el contrato de base de datos todavía no existen; no se envían datos a un servidor.
const state = {
  products: getProducts(),
  news: loadDemoData(storageKeys.news, articles),
  users: loadDemoData(storageKeys.users, []),
  tab: "Resumen",
  editing: null,
  message: "",
  error: "",
};

function loadDemoData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`No se pudieron leer los datos locales de ${key}.`, error);
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function saveDemoData(key, value, property) {
  try {
    if (property === "products") setProducts(value);
    else localStorage.setItem(key, JSON.stringify(value));
    state[property] = value;
    state.message = "Cambios guardados en este navegador (modo demostración).";
    state.error = "";
    renderSiteContent();
    renderAdmin();
  } catch (error) {
    console.error(`No se pudieron guardar los datos locales de ${key}.`, error);
    state.error = "No se pudo guardar en este navegador. Revisa el espacio disponible e inténtalo de nuevo.";
    renderAdmin();
  }
}

function renderSiteContent() {
  renderRecommendations(state.products);
  renderArticles(state.news);
}

const adminView = document.querySelector("#admin-view");
const siteView = document.querySelector("#site-view");

function enterAdmin() {
  siteView.hidden = true;
  adminView.hidden = false;
  state.tab = "Resumen";
  state.editing = null;
  state.message = "";
  renderAdmin();
  window.scrollTo(0, 0);
}

function exitAdmin() {
  adminView.hidden = true;
  siteView.hidden = false;
  window.scrollTo(0, 0);
}

function renderAdminForm() {
  if (!state.editing) return "";
  const record = state.editing.record;
  const fields = state.editing.kind === "product"
    ? [
      ["category", "Categoría", "text", record.category],
      ["title", "Nombre del producto", "text", record.title],
      ["description", "Descripción breve", "textarea", record.description],
      ["image", "URL de imagen", "url", record.image],
      ["alt", "Texto alternativo de imagen", "text", record.alt],
      ["content", "Contenido y características", "textarea", record.content],
      ["use", "Modo de uso", "textarea", record.use],
      ["advantages", "Ventajas", "textarea", record.advantages],
      ["disadvantages", "Desventajas o precauciones", "textarea", record.disadvantages],
      ["officialUrl", "Enlace oficial del producto", "url", record.officialUrl],
    ]
    : state.editing.kind === "article"
      ? [["tag", "Categoría", "text", record.tag], ["title", "Título", "text", record.title], ["text", "Contenido", "textarea", record.text]]
      : [["name", "Nombre", "text", record.name], ["email", "Correo electrónico", "email", record.email], ["role", "Rol", "select", record.role]];
  const title = state.editing.kind === "product"
    ? (record.number ? "Editar recomendación" : "Nueva recomendación")
    : state.editing.kind === "article"
      ? (state.editing.original ? "Editar noticia" : "Nueva noticia")
      : (record.id ? "Editar usuario" : "Nuevo registro");

  return `<form class="admin-form" id="record-form" data-kind="${state.editing.kind}">
    <h3>${title}</h3>
    ${fields.map(([name, label, type, value]) => {
      const input = type === "textarea"
        ? `<textarea name="${name}" required>${escapeHtml(value)}</textarea>`
        : type === "select"
          ? `<select name="${name}"><option${value === "Estudiante" ? " selected" : ""}>Estudiante</option><option${value === "Docente" ? " selected" : ""}>Docente</option><option${value === "Administrador" ? " selected" : ""}>Administrador</option></select>`
          : `<input name="${name}" type="${type}"${name === "name" ? ' minlength="2"' : ""} required value="${escapeHtml(value)}"${name === "category" ? ' placeholder="HIDRATACIÓN"' : ""}>`;
      return `<label>${label}${input}</label>`;
    }).join("")}
    ${state.error ? `<p class="admin-error" role="alert">${escapeHtml(state.error)}</p>` : ""}
    <div class="admin-form-actions"><button class="admin-primary" type="submit">Guardar</button><button class="admin-secondary" type="button" data-action="cancel-edit">Cancelar</button></div>
  </form>`;
}

function renderAdminRecords(kind, records) {
  if (!records.length) return '<p class="admin-empty">No hay registros. Añade uno para probar la gestión de demostración.</p>';
  return `<div class="admin-record-list">${records.map((record, index) => {
    const isProduct = kind === "product";
    const identifier = isProduct ? record.number : kind === "article" ? record.title : record.id;
    const details = isProduct
      ? `<img src="${escapeHtml(record.image)}" alt=""><div><small>${escapeHtml(record.category)}</small><h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.description)}</p></div>`
      : `<div><small>${escapeHtml(kind === "article" ? record.tag : record.role)}</small><h3>${escapeHtml(kind === "article" ? record.title : record.name)}</h3><p>${escapeHtml(kind === "article" ? record.text : record.email)}</p></div>`;
    return `<article class="admin-record${isProduct ? "" : " admin-text-record"}">
      ${details}
      <button type="button" data-action="edit" data-kind="${kind}" data-index="${index}">Editar</button>
      <button type="button" class="admin-delete" data-action="delete" data-kind="${kind}" data-id="${escapeHtml(identifier)}">Eliminar</button>
    </article>`;
  }).join("")}</div>`;
}

function renderAdminContent() {
  if (state.tab === "Resumen") {
    return `<section class="admin-content">
      <div class="admin-summary-intro"><p>GESTIÓN DEL CONTENIDO</p><h2>Administración del sitio</h2><span>Desde aquí puedes probar la edición local de los contenidos.</span></div>
      <div class="admin-stats"><article><span>Recomendaciones</span><b>${state.products.length}</b></article><article><span>Noticias</span><b>${state.news.length}</b></article><article><span>Usuarios registrados en esta demo</span><b>${state.users.length}</b></article></div>
      <div class="admin-security-note"><b>Para una publicación real</b><p>El inicio de sesión, los permisos y la gestión de cuentas deben implementarse en un servidor con PHP/API y base de datos. Nunca uses este acceso de demostración con información real.</p></div>
    </section>`;
  }

  const details = {
    Productos: { kind: "product", label: "CATÁLOGO EDUCATIVO", heading: "Recomendaciones", records: state.products },
    Noticias: { kind: "article", label: "CONTENIDO EDITORIAL", heading: "Noticias y recursos", records: state.news },
    Usuarios: { kind: "user", label: "DIRECTORIO DE DEMOSTRACIÓN", heading: "Usuarios", records: state.users },
  }[state.tab];
  const addLabel = details.kind === "product" ? "producto" : details.kind === "article" ? "noticia" : "usuario";
  const emptyRecord = details.kind === "product"
    ? { number: "", category: "", title: "", description: "", image: "", alt: "", content: "", use: "", advantages: "", disadvantages: "", officialUrl: "" }
    : details.kind === "article" ? { tag: "", title: "", text: "" } : { id: "", name: "", email: "", role: "Estudiante" };
  const userWarning = details.kind === "user"
    ? '<p class="admin-security-note">Este directorio solo guarda nombre, correo y rol en el navegador. No crea cuentas, contraseñas ni sesiones.</p>'
    : "";

  return `<section class="admin-content">
    <div class="admin-section-title"><div><p>${details.label}</p><h2>${details.heading}</h2></div><button type="button" class="admin-primary" data-action="add" data-kind="${details.kind}">+ Añadir ${addLabel}</button></div>
    ${userWarning}${renderAdminForm()}${renderAdminRecords(details.kind, details.records)}
  </section>`;
}

function renderAdmin() {
  const tabs = ["Resumen", "Productos", "Noticias", "Usuarios"];
  adminView.innerHTML = `<div class="admin-shell">
    <aside class="admin-sidebar">
      <a class="school-logo admin-logo" href="#" data-action="exit"><span class="school-logo-mark">DB</span><span class="school-logo-copy"><b>IPIDB</b><small>Administración</small></span></a>
      <p class="admin-nav-title">PANEL DE CONTROL</p>
      <nav aria-label="Secciones administrativas">${tabs.map((tab) => `<button type="button" class="${state.tab === tab ? "active" : ""}" data-action="tab" data-tab="${tab}">${tab}</button>`).join("")}</nav>
      <button class="admin-exit" type="button" data-action="exit">← Volver al sitio</button>
    </aside>
    <main class="admin-main">
      <header class="admin-heading"><div><p class="eyebrow">INSTITUTO POLITÉCNICO INDUSTRIAL DON BOSCO</p><h1>${state.tab}</h1></div><span class="admin-demo-tag">MODO DEMOSTRACIÓN</span></header>
      <p class="admin-warning"><b>Importante:</b> panel de práctica; los cambios se guardan solo en este navegador. No es un sistema de acceso seguro ni se conecta a una base de datos.</p>
      ${state.message ? `<p class="admin-message" role="status">${escapeHtml(state.message)}</p>` : ""}
      ${state.error && !state.editing ? `<p class="admin-error" role="alert">${escapeHtml(state.error)}</p>` : ""}
      ${renderAdminContent()}
    </main>
  </div>`;
}

function getKindRecords(kind) {
  if (kind === "product") return state.products;
  if (kind === "article") return state.news;
  return state.users;
}

function setKindRecords(kind, records) {
  const property = kind === "product" ? "products" : kind === "article" ? "news" : "users";
  saveDemoData(storageKeys[property], records, property);
}

function handleAdminAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, kind, index, id, tab } = button.dataset;
  state.error = "";
  state.message = "";

  if (action === "exit") return exitAdmin();
  if (action === "tab") {
    state.tab = tab;
    state.editing = null;
  } else if (action === "add") {
    const defaults = kind === "product"
      ? { number: "", category: "", title: "", description: "", image: "", alt: "", content: "", use: "", advantages: "", disadvantages: "", officialUrl: "" }
      : kind === "article" ? { tag: "", title: "", text: "" } : { id: "", name: "", email: "", role: "Estudiante" };
    state.editing = { kind, record: defaults, original: null };
  } else if (action === "edit") {
    state.editing = { kind, record: getKindRecords(kind)[Number(index)], original: getKindRecords(kind)[Number(index)] };
  } else if (action === "cancel-edit") {
    state.editing = null;
  } else if (action === "delete") {
    const records = getKindRecords(kind);
    const filtered = kind === "product" ? records.filter((item) => item.number !== id)
      : kind === "article" ? records.filter((item) => item.title !== id)
        : records.filter((item) => item.id !== id);
    setKindRecords(kind, filtered);
    return;
  }
  renderAdmin();
}

function handleRecordSubmit(event) {
  if (event.target.id !== "record-form") return;
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  for (const key in data) data[key] = String(data[key]).trim();
  const { kind, record: previous } = state.editing;
  const records = getKindRecords(kind);
  let updated;

  if (kind === "product") {
    if (records.some((item) => item.title === data.title && item.number !== previous.number)) {
      state.error = "Ya existe una recomendación con ese nombre.";
      return renderAdmin();
    }
    const nextNumber = String(Math.max(0, ...records.map((item) => Number(item.number) || 0)) + 1).padStart(2, "0");
    updated = { ...data, number: previous.number || nextNumber };
  } else if (kind === "article") {
    if (records.some((item) => item.title === data.title && item.title !== previous.title)) {
      state.error = "Ya existe una noticia con ese título.";
      return renderAdmin();
    }
    updated = data;
  } else {
    data.email = data.email.toLowerCase();
    if (records.some((item) => item.email.toLowerCase() === data.email && item.id !== previous.id)) {
      state.error = "Ya existe un registro con ese correo.";
      return renderAdmin();
    }
    updated = { ...data, id: previous.id || String(Date.now()) };
  }

  const identifier = kind === "product" ? "number" : kind === "article" ? "title" : "id";
  const nextRecords = previous[identifier]
    ? records.map((item) => item[identifier] === previous[identifier] ? updated : item)
    : [...records, updated];
  state.editing = null;
  setKindRecords(kind, nextRecords);
}

export function initAdmin() {
  adminView.addEventListener("click", handleAdminAction);
  adminView.addEventListener("submit", handleRecordSubmit);
  initDemoAuth(enterAdmin);
  renderSiteContent();
}
