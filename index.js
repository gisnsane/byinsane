document.addEventListener("DOMContentLoaded", () => {

  /* ================= NAV ================= */
  const toggle  = document.getElementById("menu-toggle");
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
    toggle?.setAttribute("aria-expanded", "true");
  }

  function closeNav() {
    sidenav.classList.remove("active");
    overlay.classList.remove("visible");
    document.body.style.overflow = "";
    toggle?.setAttribute("aria-expanded", "false");
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

  /* =================================================
     SLIDESHOW DE FONDO
     👉 Agrega o quita rutas aquí para cambiar las fotos
  ================================================= */
  /* En móvil servimos imágenes más pequeñas (w_900) para no
     descargar 3MB en una pantalla de 390px. En desktop w_1600. */
  const isMobile = window.innerWidth <= 768;
  const cld      = "https://res.cloudinary.com/dkicubwax/image/upload";
  const params   = isMobile ? "w_900,q_auto,f_auto" : "w_1600,q_auto,f_auto";

  const IMAGES = [
    `${cld}/${params}/v1777000095/landing-1_q6fqnb.webp`,
    `${cld}/${params}/v1777000094/landing-2_lzcpje.jpg`,
  ];

  const INTERVAL = 5000;  /* ms entre fotos */
  const OVERLAY  = "rgba(0, 0, 0, 0.20), rgba(0,0,0,0.85)";

  if (IMAGES.length === 0) return;

  const body = document.body;
  let current = 0;

  /* ── OPTIMIZACIÓN: crear ambas capas una sola vez y reutilizarlas ──
     En lugar de crear/destruir un div en cada ciclo (causa reflow y
     garbage collection), alternamos entre dos capas fijas. */
  function createLayer(src, visible) {
    const div = document.createElement("div");
    div.className = "bg-layer" + (visible ? " visible" : "");
    div.style.backgroundImage = `linear-gradient(${OVERLAY}), url('${src}')`;
    /* OPTIMIZACIÓN: hint al compositor para que prepare la capa en GPU */
    div.style.willChange = "opacity";
    body.appendChild(div);
    return div;
  }

  function startSlideshow() {
    if (IMAGES.length === 1) {
      createLayer(IMAGES[0], true);
      return;
    }

    /* Crear ambas capas desde el inicio */
    let layerA = createLayer(IMAGES[0], true);
    let layerB = createLayer(IMAGES[1], false);

    /* Precargar el resto de imágenes (si hay más de 2) */
    for (let i = 2; i < IMAGES.length; i++) {
      const img = new Image();
      img.src = IMAGES[i];
    }

    setInterval(() => {
      current = (current + 1) % IMAGES.length;
      const next = (current + 1) % IMAGES.length;

      /* La capa inactiva recibe la imagen siguiente antes de mostrarse */
      layerB.style.backgroundImage = `linear-gradient(${OVERLAY}), url('${IMAGES[current]}')`;

      /* Precargar la que vendrá después */
      const preload = new Image();
      preload.src = IMAGES[next];

      /* Intercambiar visibilidad — solo cambia opacity, sin reflow */
      requestAnimationFrame(() => {
        layerB.classList.add("visible");
        layerA.classList.remove("visible");
        /* Rotar referencias */
        [layerA, layerB] = [layerB, layerA];
      });

    }, INTERVAL);
  }

  /* Precargar primera imagen (ya fue declarada con <link rel="preload">
     en el HTML, pero la tenemos aquí también como fallback) */
  const firstImg = new Image();
  firstImg.onload = startSlideshow;
  firstImg.onerror = startSlideshow; /* arrancar igual aunque falle */
  firstImg.src = IMAGES[0];


  /* =====================================================
     PRELOAD ESPECULATIVO — Projects & Exhibitions thumbs
     Se ejecuta en segundo plano mientras el usuario está
     en la landing page, para que al navegar a projects o
     exhibitions las imágenes ya estén en caché del browser
     y la animación se vea completamente fluida.
     requestIdleCallback garantiza que no compite con el
     slideshow ni con ninguna interacción del usuario.
  ===================================================== */
  const THUMBS_TO_PRELOAD = [
    "img/proyectos/lucy/lucy-1-thumb.webp",
    "img/proyectos/alex/alex-1-thumb.webp",
    "img/proyectos/akira/akira-1-thumb.webp",
    "img/proyectos/ad/ad-1-thumb.webp",
    "img/proyectos/emilio/emilio-1-thumb.webp",
    "img/proyectos/cri/cri-1-thumb.webp",
    "img/proyectos/aptbs/aptbs-1-thumb.webp",
    "img/proyectos/hds/hds-1-thumb.webp",
    "img/exhibitions/photopolis/photopolis-1-thumb.webp",
    "img/exhibitions/ruido/ruido-1-thumb.webp",
    "img/exhibitions/klpa/klpa-1-thumb.webp",
  ];

  function speculativePreload(srcs) {
    let i = 0;
    function loadNext(deadline) {
      while (i < srcs.length && (deadline.timeRemaining() > 4 || deadline.didTimeout)) {
        new Image().src = srcs[i++];
      }
      if (i < srcs.length) {
        requestIdleCallback(loadNext, { timeout: 2000 });
      }
    }
    /* Esperar 1.5s para no competir con la primera imagen del slideshow */
    setTimeout(() => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(loadNext, { timeout: 2000 });
      } else {
        /* Fallback para Safari */
        srcs.forEach((src, idx) => setTimeout(() => { new Image().src = src; }, idx * 150));
      }
    }, 1500);
  }

  speculativePreload(THUMBS_TO_PRELOAD);

});
