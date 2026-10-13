import { loadPartials } from "./js/partials.js";
import { initNavigation } from "./js/navigation.js";
import { loadProductsFromApi, renderRecommendations } from "./js/products.js";
import { initVideoPreview, loadEventsFromApi, renderArticles } from "./js/events.js";
import { initContactForm } from "./js/contact-form.js";
import { initAdmin } from "./js/admin.js";

async function init() {
  await loadPartials();
  initNavigation();
  await loadProductsFromApi();
  renderRecommendations();
  renderArticles();
  await loadEventsFromApi();
  initVideoPreview();
  initContactForm();
  initAdmin();
}

init().catch((error) => {
  console.error("No se pudo iniciar el sitio web.", error);
  document.body.insertAdjacentHTML("afterbegin", '<p role="alert">No se pudo cargar el sitio. Intenta recargar la página.</p>');
});
