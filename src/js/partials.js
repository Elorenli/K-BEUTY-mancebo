const partialNames = ["header", "home", "about", "services", "portfolio", "resources", "events", "contact", "footer", "general"];

export async function loadPartials() {
  await Promise.all(partialNames.map(async (name) => {
    const response = await fetch(`${import.meta.env.BASE_URL}partials/${name}.html`);
    if (!response.ok) throw new Error(`No se pudo cargar la sección ${name}: HTTP ${response.status}`);
    const target = document.querySelector(`[data-partial="${name}"]`);
    target.innerHTML = await response.text();
  }));
}