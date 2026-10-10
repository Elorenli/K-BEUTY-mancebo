const demoCredentials = { username: "admin@ipidb.edu.do", password: "demo1234" };

export function initDemoAuth(onAuthenticated) {
  const loginOverlay = document.querySelector("#admin-login-overlay");

  document.querySelector("#open-admin").addEventListener("click", () => {
    loginOverlay.hidden = false;
    document.querySelector("#login-error").hidden = true;
    document.querySelector('#admin-login-form [name="username"]').focus();
  });

  document.querySelector("#close-admin").addEventListener("click", () => {
    loginOverlay.hidden = true;
  });

  loginOverlay.addEventListener("click", (event) => {
    if (event.target === loginOverlay) loginOverlay.hidden = true;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !loginOverlay.hidden) loginOverlay.hidden = true;
  });

  document.querySelector("#admin-login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // Para producción, validar credenciales mediante POST /api/auth/login; nunca guardar contraseñas en el cliente.
    if (data.get("username") === demoCredentials.username && data.get("password") === demoCredentials.password) {
      loginOverlay.hidden = true;
      onAuthenticated();
      return;
    }
    const error = document.querySelector("#login-error");
    error.textContent = "Correo o contraseña de demostración incorrectos.";
    error.hidden = false;
  });
}