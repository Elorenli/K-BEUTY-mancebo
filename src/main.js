import { loadPartials } from "./js/partials.js";
import { initNavigation } from "./js/navigation.js";
import { renderRecommendations } from "./js/products.js";
import { renderArticles, renderEvents } from "./js/events.js";
import { initContactForm } from "./js/contact-form.js";
import { initAdmin } from "./js/admin.js";

async function init() {
  await loadPartials();
  initNavigation();
  renderRecommendations();
  renderArticles();
  renderEvents();
  initContactForm();
  initAdmin();
}

init().catch((error) => {
  console.error("No se pudo iniciar el sitio web.", error);
  document.body.insertAdjacentHTML("afterbegin", '<p role="alert">No se pudo cargar el sitio. Intenta recargar la página.</p>');
});
