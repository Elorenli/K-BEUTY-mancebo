import { apiRequest } from "./api.js";

export function initContactForm() {
  const form = document.querySelector("#contact-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("#contact-status");
    if (!form.reportValidity()) return;
    const submit = form.querySelector('[type="submit"]');
    const data = new FormData(form);
    submit.disabled = true;
    status.textContent = "Enviando mensaje…";
    try {
      const result = await apiRequest("contacto.php", {
        method: "POST",
        body: {
          nombre: data.get("name"),
          correo: data.get("email"),
          mensaje: data.get("message"),
        },
      });
      status.textContent = result.message;
      form.reset();
    } catch (error) {
      console.error("No se pudo guardar el mensaje de contacto.", error);
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
}