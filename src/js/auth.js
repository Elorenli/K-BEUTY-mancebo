import { apiRequest, setCsrfToken } from "./api.js";

export function initAuth(onAuthenticated) {
  const overlay = document.querySelector("#admin-login-overlay");
  const loginForm = document.querySelector("#admin-login-form");
  const loginError = document.querySelector("#login-error");
  const status = document.querySelector("#auth-status");
  const forms = document.querySelector("#auth-forms");
  const loggedIn = document.querySelector("#auth-logged-in");
  const welcome = document.querySelector("#auth-welcome");
  const description = document.querySelector("#auth-description");
  const openButton = document.querySelector("#open-admin");

  function showLogin(message = "") {
    loginForm.hidden = false;
    status.textContent = message;
    loginError.hidden = true;
  }

  function showSignedIn(user) {
    forms.hidden = true;
    loggedIn.hidden = false;
    description.textContent = "Tu sesión está activa.";
    const isAdmin = user.rol === "admin";
    welcome.textContent = isAdmin
      ? `Hola, ${user.nombre}. Iniciaste sesión como administradora.`
      : `Hola, ${user.nombre}.`;
    openButton.textContent = "Administración";
  }

  function showSignedOut() {
    forms.hidden = false;
    loggedIn.hidden = true;
    description.textContent = "Ingresa con el correo y la contraseña de una cuenta administradora. Las cuentas de cliente no pueden acceder al panel.";
    openButton.textContent = "Administración";
    showLogin();
  }

  openButton.addEventListener("click", () => {
    overlay.hidden = false;
    loginError.hidden = true;
    if (!loggedIn.hidden) {
      document.querySelector("#auth-logout").focus();
    } else {
      loginForm.querySelector('[name="email"]').focus();
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

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = loginForm.querySelector('[type="submit"]');
    const data = new FormData(loginForm);
    submit.disabled = true;
    loginError.hidden = true;
    status.textContent = "Verificando tus datos…";
    try {
      const result = await apiRequest("auth/login", {
        method: "POST",
        body: { correo: data.get("email"), password: data.get("password") },
      });
      setCsrfToken(result.csrfToken);
      loginForm.reset();
      if (result.user.rol === "admin") {
        overlay.hidden = true;
        onAuthenticated(result.user);
      } else {
        await apiRequest("auth/logout", { method: "POST" });
        setCsrfToken(null);
        showLogin();
        loginError.textContent = "Esta cuenta no tiene permisos de administración. Usa una cuenta administradora.";
        loginError.hidden = false;
      }
    } catch (error) {
      status.textContent = "";
      loginError.textContent = error.message;
      loginError.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector("#auth-logout").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await apiRequest("auth/logout", { method: "POST" });
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
  apiRequest("auth/session").then((result) => {
    if (!result.user) return;
    setCsrfToken(result.csrfToken);
    if (result.user.rol === "admin") {
      showSignedIn(result.user);
      onAuthenticated(result.user);
      return;
    }
    return apiRequest("auth/logout", { method: "POST" }).then(() => {
      setCsrfToken(null);
      showSignedOut();
      status.textContent = "La cuenta activa no tiene permisos de administración.";
    });
  }).catch((error) => {
    console.error("No se pudo verificar la sesión de usuario.", error);
  });
}
