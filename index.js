document.addEventListener("DOMContentLoaded", () => {

  /* ================= NAV ================= */
  const toggle = document.getElementById("menu-toggle");
  const sidenav = document.getElementById("sidenav");

  if (toggle && sidenav) {
    toggle.addEventListener("click", () => {
      sidenav.classList.toggle("active");
    });
  }

  /* =================================================
     SLIDESHOW DE FONDO
     👉 Agrega o quita rutas aquí para cambiar las fotos
  ================================================= */
  const IMAGES = [
    "img/landing/landing-1.jpg",
    "img/landing/landing-2.jpg",
    /* "img/landing/foto3.jpg", */
  ];

  const INTERVAL = 5000;   /* tiempo entre fotos en ms (5000 = 5 seg) */
  const OVERLAY  = "rgba(0, 0, 0, 0.20), rgba(0,0,0,0.85)"; /* oscuridad del overlay */

  /* ---- si solo hay una imagen no hace falta slideshow ---- */
  if (IMAGES.length === 0) return;

  const body = document.body;
  let current = 0;

  /* crear dos capas para hacer crossfade suave */
  function createLayer(src) {
    const div = document.createElement("div");
    div.className = "bg-layer";
    div.style.backgroundImage = `linear-gradient(${OVERLAY}), url('${src}')`;
    body.appendChild(div);
    return div;
  }

  /* precargar todas las imágenes antes de arrancar */
  let loaded = 0;
  const cache = [];

  function startSlideshow() {
    if (IMAGES.length === 1) {
      /* solo una imagen, ponerla y ya */
      createLayer(IMAGES[0]).classList.add("visible");
      return;
    }

    /* capa activa inicial */
    let activeLayer = createLayer(IMAGES[0]);
    activeLayer.classList.add("visible");

    setInterval(() => {
      current = (current + 1) % IMAGES.length;

      const nextLayer = createLayer(IMAGES[current]);

      /* pequeño delay para que el navegador pinte el elemento antes de animar */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nextLayer.classList.add("visible");
          activeLayer.classList.remove("visible");

          /* eliminar capa vieja después de la transición */
          const old = activeLayer;
          setTimeout(() => old.remove(), 1200);

          activeLayer = nextLayer;
        });
      });

    }, INTERVAL);
  }

  /* precargar imágenes y arrancar cuando estén listas */
  IMAGES.forEach(src => {
    const img = new Image();
    img.onload = img.onerror = () => {
      loaded++;
      if (loaded === IMAGES.length) startSlideshow();
    };
    img.src = src;
    cache.push(img);
  });

});
