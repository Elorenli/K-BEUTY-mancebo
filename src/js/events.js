export const articles = [
  { tag: "HTML", title: "Una web clara empieza con buena estructura", text: "Usar etiquetas como header, nav, main y section ayuda a organizar el contenido y facilita la navegación." },
  { tag: "DISEÑO RESPONSIVE", title: "Diseñar para móvil también es diseñar para todos", text: "Una presentación que se adapta a distintos tamaños hace que las recomendaciones sean fáciles de consultar." },
  { tag: "TECNOLOGÍA", title: "De una maqueta a una aplicación web", text: "HTML da la estructura; CSS, JavaScript, PHP y una base de datos pueden ampliar el proyecto en próximas etapas." },
];

const events = [
  { activity: "Actividad 1.1 · Maquetación HTML", date: "2025-10-02", type: "Entrega / actividad", status: "Fecha indicada en la planificación" },
  { activity: "Práctica individual y revisión de enlaces e imágenes", date: null, type: "Actividad formativa", status: "Según planificación de clase" },
  { activity: "Exposición y retroalimentación", date: null, type: "Exposición", status: "Por coordinar con el docente" },
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

function formatEventDate(date) {
  if (!date) return "Por confirmar";
  const parsedDate = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? "Por confirmar"
    : parsedDate.toLocaleDateString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function renderEvents(items = events) {
  const status = document.querySelector("#events-status");
  if (!items.length) {
    status.textContent = "El calendario todavía no tiene actividades registradas.";
    document.querySelector("#events-body").replaceChildren();
    return;
  }
  status.textContent = "";
  document.querySelector("#events-body").innerHTML = items.map((event) => `
    <tr><td>${escapeHtml(event.activity)}</td><td>${escapeHtml(formatEventDate(event.date))}</td><td>${escapeHtml(event.type)}</td><td>${escapeHtml(event.status)}</td></tr>
  `).join("");
}

export async function loadEventsFromApi() {
  const status = document.querySelector("#events-status");

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}api/eventos.php`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("La API devolvió un formato inesperado.");

    renderEvents(data.map((event) => ({
      activity: event.titulo,
      date: event.fecha || null,
      type: event.tipo,
      status: event.descripcion || "Actividad académica",
    })));
    return true;
  } catch (error) {
    console.error("No se pudo cargar el calendario desde la API PHP.", error);
    renderEvents();
    status.textContent = "No se pudo conectar con el calendario de la base de datos. Se muestran las actividades de ejemplo.";
    return false;
  }
}

export function initVideoPreview() {
  const input = document.querySelector("#project-video-file");
  const video = document.querySelector("#project-video");
  const status = document.querySelector("#video-status");
  let previewUrl;

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      status.textContent = "Selecciona un archivo de video compatible.";
      input.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    video.src = previewUrl;
    video.load();
    status.textContent = `Previsualizando: ${file.name}. El archivo no se ha subido.`;
  });
}