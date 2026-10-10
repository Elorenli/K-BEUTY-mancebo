export const articles = [
  { tag: "HTML", title: "Una web clara empieza con buena estructura", text: "Usar etiquetas como header, nav, main y section ayuda a organizar el contenido y facilita la navegación." },
  { tag: "DISEÑO RESPONSIVE", title: "Diseñar para móvil también es diseñar para todos", text: "Una presentación que se adapta a distintos tamaños hace que las recomendaciones sean fáciles de consultar." },
  { tag: "TECNOLOGÍA", title: "De una maqueta a una aplicación web", text: "HTML da la estructura; CSS, JavaScript, PHP y una base de datos pueden ampliar el proyecto en próximas etapas." },
];

const events = [
  { activity: "Actividad 1.1 · Maquetación HTML", date: "02/10/2025", status: "Fecha indicada en la planificación" },
  { activity: "Práctica individual y revisión de enlaces e imágenes", date: "Según planificación de clase", status: "Actividad formativa" },
  { activity: "Exposición y retroalimentación", date: "Según planificación de clase", status: "Por coordinar con el docente" },
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function renderArticles(items = articles) {
  document.querySelector("#articles-grid").innerHTML = items.map((article, index) => `
    <article class="journal-card">
      <span class="journal-number">0${index + 1}</span>
      <small>${escapeHtml(article.tag)}</small>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.text)}</p>
    </article>
  `).join("");
}

export function renderEvents() {
  document.querySelector("#events-body").innerHTML = events.map((event) => `
    <tr><td>${escapeHtml(event.activity)}</td><td>${escapeHtml(event.date)}</td><td>${escapeHtml(event.status)}</td></tr>
  `).join("");
}