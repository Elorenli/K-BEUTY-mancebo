export function initContactForm() {
  document.querySelector("#contact-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#contact-status");
    if (!form.reportValidity()) return;
    status.textContent = "Los campos son válidos. Este formulario es una maqueta y aún no envía ni guarda mensajes.";
    form.reset();
    // Integración futura: reemplazar esta respuesta local por un envío a POST /api/contact.
  });
}