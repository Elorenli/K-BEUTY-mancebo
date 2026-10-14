import { apiRequest, setCsrfToken } from "./api.js";

export function initAuth(onAuthenticated) {
  const overlay = document.querySelector("#admin-login-overlay");
  const loginForm = document.querySelector("#admin-login-form");
  const registerForm = document.querySelector("#admin-register-form");
  const loginError = document.querySelector("#login-error");
  const registerError = document.querySelector("#register-error");
  const status = document.querySelector("#auth-status");
  const forms = document.querySelector("#auth-forms");
  const loggedIn = document.querySelector("#auth-logged-in");
  const welcome = document.querySelector("#auth-welcome");
  const description = document.querySelector("#auth-description");
  const openButton = document.querySelector("#open-admin");

  function showLogin(message = "") {
    loginForm.hidden = false;
    registerForm.hidden = true;
    document.querySelector("#show-login").setAttribute("aria-pressed", "true");
    document.querySelector("#show-register").setAttribute("aria-pressed", "false");
    document.querySelector("#admin-login-title").textContent = "Inicia sesión";
    status.textContent = message;
    loginError.hidden = true;
    registerError.hidden = true;
  }

  function showRegister() {
    loginForm.hidden = true;
    registerForm.hidden = false;
    document.querySelector("#show-login").setAttribute("aria-pressed", "false");
    document.querySelector("#show-register").setAttribute("aria-pressed", "true");
    document.querySelector("#admin-login-title").textContent = "Crear cuenta";
    status.textContent = "";
    loginError.hidden = true;
    registerError.hidden = true;
    registerForm.querySelector('[name="name"]').focus();
  }

  function showSignedIn(user) {
    forms.hidden = true;
    loggedIn.hidden = false;
    description.textContent = "Tu sesión está activa.";
    const isAdmin = user.rol === "admin";
    welcome.textContent = isAdmin
      ? `Hola, ${user.nombre}. Iniciaste sesión como administradora.`
      : `Hola, ${user.nombre}. Iniciaste sesión con tu cuenta de cliente.`;
    openButton.textContent = isAdmin ? "Administración" : "Mi cuenta";
  }

  function showSignedOut() {
    forms.hidden = false;
    loggedIn.hidden = true;
    description.textContent = "Entra a tu cuenta o crea una nueva para este sitio.";
    openButton.textContent = "Iniciar sesión / Crear cuenta";
    showLogin();
  }

  openButton.addEventListener("click", () => {
    overlay.hidden = false;
    loginError.hidden = true;
    registerError.hidden = true;
    if (!loggedIn.hidden) {
      document.querySelector("#auth-logout").focus();
    } else if (!registerForm.hidden) {
      registerForm.querySelector('[name="name"]').focus();
    } else {
      loginForm.querySelector('[name="username"]').focus();
    }
  });

  document.querySelector("#close-admin").addEventListener("click", () => {
    overlay.hidden = true;
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.hidden = true;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) overlay.hidden = true;
  });

  document.querySelector("#show-login").addEventListener("click", () => showLogin());
  document.querySelector("#show-register").addEventListener("click", showRegister);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = loginForm.querySelector('[type="submit"]');
    const data = new FormData(loginForm);
    submit.disabled = true;
    loginError.hidden = true;
    status.textContent = "Verificando tus datos…";
    try {
      const result = await apiRequest("auth/login.php", {
        method: "POST",
        body: { correo: data.get("username"), password: data.get("password") },
      });
      setCsrfToken(result.csrfToken);
      loginForm.reset();
      if (result.user.rol === "admin") {
        overlay.hidden = true;
        onAuthenticated(result.user);
      } else {
        showSignedIn(result.user);
      }
    } catch (error) {
      status.textContent = "";
      loginError.textContent = error.message;
      loginError.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = registerForm.querySelector('[type="submit"]');
    const data = new FormData(registerForm);
    submit.disabled = true;
    registerError.hidden = true;
    status.textContent = "Creando tu cuenta…";
    try {
      const result = await apiRequest("auth/register.php", {
        method: "POST",
        body: {
          nombre: data.get("name"),
          correo: data.get("email"),
          password: data.get("password"),
          confirmacion: data.get("confirmacion"),
        },
      });
      const email = data.get("email");
      registerForm.reset();
      showLogin(result.message);
      loginForm.querySelector('[name="username"]').value = email;
      loginForm.querySelector('[name="password"]').focus();
    } catch (error) {
      status.textContent = "";
      registerError.textContent = error.message;
      registerError.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector("#auth-logout").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await apiRequest("auth/logout.php", { method: "POST" });
      setCsrfToken(null);
      showSignedOut();
      status.textContent = "Has cerrado sesión.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  window.addEventListener("auth:logout", () => {
    setCsrfToken(null);
    showSignedOut();
  });

  showSignedOut();
  apiRequest("auth/session.php").then((result) => {
    if (!result.user) return;
    setCsrfToken(result.csrfToken);
    showSignedIn(result.user);
    if (result.user.rol === "admin") onAuthenticated(result.user);
  }).catch((error) => {
    console.error("No se pudo verificar la sesión de usuario.", error);
  });
}
