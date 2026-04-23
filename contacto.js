document.addEventListener("DOMContentLoaded", () => {

  /* ================= NAV ================= */
  const toggle = document.getElementById("menu-toggle");
  const sidenav = document.getElementById("sidenav");

  let overlay = document.getElementById("nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "nav-overlay";
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }

  function openNav() {
    sidenav.classList.add("active");
    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  function closeNav() {
    sidenav.classList.remove("active");
    overlay.classList.remove("visible");
    document.body.style.overflow = "";
  }

  if (toggle && sidenav) {
    toggle.addEventListener("click", () => {
      sidenav.classList.contains("active") ? closeNav() : openNav();
    });
  }

  overlay.addEventListener("click", closeNav);

  sidenav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeNav();
    });
  });

  /* ================= FORMULARIO ================= */

  /*
    👉 CONFIGURACIÓN:
    1. Ve a https://formspree.io y crea una cuenta gratis
    2. Crea un nuevo formulario y copia tu endpoint
    3. Pégalo aquí abajo reemplazando el texto
  */
  const FORMSPREE_URL = "https://formspree.io/f/maqapdre";

  const form = document.getElementById("contact-form");
  const submitBtn = document.getElementById("submit-btn");
  const status = document.getElementById("form-status");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    /* estado enviando */
    submitBtn.classList.add("sending");
    submitBtn.querySelector(".btn-text").textContent = "ENVIANDO";
    status.textContent = "";
    status.className = "form-status";

    const data = new FormData(form);

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });

      if (res.ok) {
        /* éxito */
        status.textContent = "MENSAJE ENVIADO — GRACIAS";
        status.classList.add("success");
        form.reset();
      } else {
        throw new Error("Error en el servidor");
      }

    } catch {
      status.textContent = "ALGO SALIÓ MAL — INTENTA DE NUEVO";
      status.classList.add("error");
    }

    /* restaurar botón */
    submitBtn.classList.remove("sending");
    submitBtn.querySelector(".btn-text").textContent = "ENVIAR";
  });

});
