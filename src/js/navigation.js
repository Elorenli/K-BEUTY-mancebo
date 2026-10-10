export function initNavigation() {
  const menuButton = document.querySelector("#menu-button");
  const mainNav = document.querySelector("#main-nav");

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mainNav.classList.toggle("nav-open", open);
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      mainNav.classList.remove("nav-open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}