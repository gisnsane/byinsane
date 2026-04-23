document.addEventListener("DOMContentLoaded", () => {

  /* ================= NAV ================= */
  const toggle  = document.getElementById("menu-toggle");
  const sidenav = document.getElementById("sidenav");

  /* Overlay para móvil: se crea una sola vez y se reutiliza */
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
    if (window.innerWidth <= 768) document.body.style.overflow = "hidden";
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

  /* Cerrar nav al hacer clic en un link (útil en móvil) */
  sidenav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeNav();
    });
  });

  /* ============== PROJECTS ============== */
  const projects = document.querySelectorAll(".project");
  if (!projects.length) return;

  const viewer        = document.getElementById("viewer");
  const viewerContent = document.getElementById("viewer-content");
  const viewerTitle   = document.getElementById("viewer-title");
  const viewerDesc    = document.getElementById("viewer-desc");
  const closeBtn      = document.getElementById("viewer-close");
  const nextProjectBtn = document.getElementById("next");
  const prevProjectBtn = document.getElementById("prev");
  const nextimgBtn     = document.getElementById("img-next");
  const previmgBtn     = document.getElementById("img-prev");

  let currentProject = 0;
  let currentSlide   = 0;
  let slides = [];
  const preloadCache = new Set();

  /* ================= SVG ICONS ================= */
  const SVG_PLAY  = `<svg width="10" height="12" viewBox="0 0 10 12" fill="none"><polygon points="0,0 10,6 0,12" fill="white"/></svg>`;
  const SVG_PAUSE = `<svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="0" y="0" width="3" height="12" rx="1" fill="white"/><rect x="7" y="0" width="3" height="12" rx="1" fill="white"/></svg>`;
  const SVG_VOL_ON  = `<svg width="16" height="13" viewBox="0 0 16 13" fill="none"><polygon points="0,3.5 4,3.5 7.5,0.5 7.5,12.5 4,9.5 0,9.5" fill="white"/><path d="M10 4Q13 6.5 10 9" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M12 2Q17 6.5 12 11" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`;
  const SVG_VOL_OFF = `<svg width="16" height="13" viewBox="0 0 16 13" fill="none"><polygon points="0,3.5 4,3.5 7.5,0.5 7.5,12.5 4,9.5 0,9.5" fill="white"/><line x1="11" y1="3.5" x2="16" y2="9.5" stroke="white" stroke-width="1.3" stroke-linecap="round"/><line x1="16" y1="3.5" x2="11" y2="9.5" stroke="white" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  const SVG_FS = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><polyline points="0,3.5 0,0 3.5,0" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="9.5,0 13,0 13,3.5" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="13,9.5 13,13 9.5,13" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="3.5,13 0,13 0,9.5" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /* ================= PRELOAD ================= */
  function preloadImage(src) {
    if (!src || preloadCache.has(src)) return;
    preloadCache.add(src);
    new Image().src = src;
  }
  function preloadProjectImages(i) {
    if (i < 0 || i >= projects.length) return;
    const p = projects[i];
    const cover = p.querySelector("img")?.src;
    if (cover) preloadImage(cover);
    if (p.dataset.images) p.dataset.images.split(",").map(s => s.trim()).filter(Boolean).forEach(preloadImage);
  }

  /* ================= HELPERS ================= */
  function getViewerimg() { return viewerContent.querySelector("img"); }

  function buildSlides(p) {
    const result = [];
    if (p.dataset.images) {
      p.dataset.images.split(",").map(s => s.trim()).filter(Boolean).forEach(src => result.push({ type: "image", src }));
    } else {
      const cover = p.querySelector("img")?.src;
      if (cover) result.push({ type: "image", src: cover });
    }
    const videoSrc = (p.dataset.video || "").trim();
    if (videoSrc) result.push({ type: "video", src: videoSrc });
    return result;
  }

  /* ================= RENDER SLIDE ================= */
  function renderSlide() {
    closeZoom();
    const slide = slides[currentSlide];
    if (!slide) return;

    if (slide.type === "video") {
      viewerContent.innerHTML = `
        <video class="custom-video" src="${slide.src}" autoplay muted playsinline preload="none"></video>
        <div class="video-controls">
          <button class="video-play" title="Play/Pause">${SVG_PLAY}</button>
          <div class="video-progress"><div class="video-bar"></div></div>
          <div class="volume-wrap">
            <button class="video-mute-btn" title="Volumen">${SVG_VOL_OFF}</button>
            <div class="volume-slider-box">
              <input type="range" class="video-volume-range" min="0" max="1" step="0.05" value="0">
            </div>
          </div>
          <button class="video-fullscreen" title="Pantalla completa">${SVG_FS}</button>
        </div>
      `;

      const video    = viewerContent.querySelector(".custom-video");
      const playBtn  = viewerContent.querySelector(".video-play");
      const muteBtn  = viewerContent.querySelector(".video-mute-btn");
      const volBox   = viewerContent.querySelector(".volume-slider-box");
      const volRange = viewerContent.querySelector(".video-volume-range");
      const fsBtn    = viewerContent.querySelector(".video-fullscreen");
      const bar      = viewerContent.querySelector(".video-bar");

      // PLAY / PAUSE — iniciar en pausa ya que el video tiene autoplay
      playBtn.innerHTML = SVG_PAUSE;
      playBtn.addEventListener("click", () => {
        if (video.paused) { video.play(); playBtn.innerHTML = SVG_PAUSE; }
        else              { video.pause(); playBtn.innerHTML = SVG_PLAY; }
      });
      // si el autoplay es bloqueado por el navegador, volver a play icon
      video.addEventListener("pause", () => { if (video.currentTime === 0) playBtn.innerHTML = SVG_PLAY; });

      // Sincronizar icono de volumen
      function syncVolumeUI() {
        const muted = video.muted || video.volume === 0;
        muteBtn.innerHTML = muted ? SVG_VOL_OFF : SVG_VOL_ON;
        volRange.value = muted ? 0 : video.volume;
      }

      // Click en icono: solo mute/unmute
      muteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        if (!video.muted && video.volume === 0) video.volume = 0.7;
        syncVolumeUI();
      });

      // Hover sobre volume-wrap: mostrar/ocultar slider vertical
      const volumeWrap = viewerContent.querySelector(".volume-wrap");
      let hideTimer = null;

      volumeWrap.addEventListener("mouseenter", () => {
        clearTimeout(hideTimer);
        volBox.classList.add("open");
      });
      volumeWrap.addEventListener("mouseleave", () => {
        hideTimer = setTimeout(() => volBox.classList.remove("open"), 200);
      });

      // Slider de volumen
      volRange.addEventListener("input", () => {
        video.volume = parseFloat(volRange.value);
        video.muted  = video.volume === 0;
        syncVolumeUI();
      });

      syncVolumeUI();

      // FULLSCREEN
      fsBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) video.requestFullscreen();
        else document.exitFullscreen();
      });

      // BARRA DE PROGRESO
      video.addEventListener("timeupdate", () => {
        if (video.duration) bar.style.width = (video.currentTime / video.duration * 100) + "%";
      });

    } else {
      const currentP = projects[currentProject];
      const altText = currentP?.dataset?.title || "";
      const isMobile = window.innerWidth <= 768;
      // En móvil: sin zoom, cursor normal. En desktop: zoom habilitado.
      viewerContent.innerHTML = `<img src="${slide.src}" alt="${altText}" style="cursor:${isMobile ? 'default' : 'zoom-in'};">`;
      const img = getViewerimg();
      if (img && !isMobile) {
        img.addEventListener("click", (e) => { e.stopPropagation(); openZoom(); });
      }
    }

    updateMiniControls();
  }

  function updateMiniControls() {
    const miniControls = document.querySelector(".viewer-controls-mini");
    if (!miniControls) return;
    const isMobile = window.innerWidth <= 768;
    const hasMultiple = slides.length > 1;

    miniControls.style.display = hasMultiple ? "flex" : "none";

    if (isMobile) {
      /* En móvil las flechas viven en el VIEWER (no en viewerContent)
         así el innerHTML nunca las puede destruir. El CSS las posiciona
         encima de la imagen via position:absolute en el viewer. */
      miniControls.style.opacity = "1";
      miniControls.style.pointerEvents = hasMultiple ? "auto" : "none";
      if (miniControls.parentElement !== viewer) {
        viewer.appendChild(miniControls);
      }
    } else {
      miniControls.style.opacity = "";
      miniControls.style.pointerEvents = "";
      if (miniControls.parentElement !== viewer) {
        viewer.appendChild(miniControls);
      }
    }
  }

  /* ================= OPEN PROJECT ================= */
  function openProject(i) {
    const p = projects[i];
    currentProject = i;
    currentSlide   = 0;
    viewerTitle.textContent = p.dataset.title || "";
    viewerDesc.textContent  = p.dataset.desc  || "";
    slides = buildSlides(p);
    renderSlide();
    preloadProjectImages(i - 1);
    preloadProjectImages(i + 1);
    viewer.classList.add("active");
    document.body.classList.add("viewer-open");
    // Fix 3: bloquear scroll del body
    document.body.style.overflow = "hidden";
  }

  /* ================= NAV SLIDES ================= */
  function nextSlide() {
    if (slides.length <= 1) return;
    currentSlide = (currentSlide + 1) % slides.length;
    renderSlide();
  }
  function prevSlide() {
    if (slides.length <= 1) return;
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    renderSlide();
  }

  /* ================= NAV PROJECTS ================= */
  function nextProject() {
    currentProject = (currentProject + 1) % projects.length;
    openProject(currentProject);
  }
  function prevProject() {
    currentProject = (currentProject - 1 + projects.length) % projects.length;
    openProject(currentProject);
  }

  /* ================= CLOSE ================= */
  function closeViewer() {
    closeZoom();
    // Fix 6: pausar video explícitamente antes de destruir el elemento
    const activeVideo = viewerContent.querySelector("video");
    if (activeVideo) { activeVideo.pause(); activeVideo.src = ""; }
    viewerContent.innerHTML = "";
    viewer.classList.remove("active");
    document.body.classList.remove("viewer-open");
    // Fix 3: restaurar scroll del body
    document.body.style.overflow = "";
  }

  /* ================= ZOOM ================= */
  let isZoomed = false, zoomScale = 1, zoomX = 0, zoomY = 0;
  let isDragging = false, dragStartX = 0, dragStartY = 0, dragOriginX = 0, dragOriginY = 0;
  const MIN_SCALE = 1, MAX_SCALE = 6;

  const zoomOverlay = document.createElement("div");
  zoomOverlay.id = "zoom-overlay";
  document.body.appendChild(zoomOverlay);

  function applyTransform(clone) {
    clone.style.transition = isDragging ? "none" : "transform 0.12s ease";
    clone.style.transform  = `translate(calc(-50% + ${zoomX}px), calc(-50% + ${zoomY}px)) scale(${zoomScale})`;
  }

  function openZoom() {
    if (isZoomed) return;
    if (window.innerWidth <= 768) return;  /* Sin zoom en móvil */
    const viewerimg = getViewerimg();
    if (!viewerimg) return;
    isZoomed = true; zoomScale = 1; zoomX = 0; zoomY = 0;
    const clone = viewerimg.cloneNode();
    clone.id = "zoomed-img";
    clone.style.cssText = `
      position:fixed; top:50%; left:50%;
      width:auto; height:auto;
      max-width:92vw; max-height:92vh;
      object-fit:contain; z-index:1100;
      cursor:grab; margin:0; opacity:1;
      transform-origin:center center;
      transform:translate(-50%,-50%) scale(1);
      transition:0.4s cubic-bezier(0.2,0.8,0.2,1);
      user-select:none; -webkit-user-drag:none;
    `;
    document.body.appendChild(clone);
    zoomOverlay.classList.add("active");

    clone.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      zoomScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, zoomScale + delta));
      if (zoomScale === MIN_SCALE) { zoomX = 0; zoomY = 0; }
      applyTransform(clone);
    }, { passive: false });

    function onDragStart(e) {
      if (zoomScale <= 1) return;
      isDragging = true;
      dragStartX = e.clientX; dragStartY = e.clientY;
      dragOriginX = zoomX; dragOriginY = zoomY;
      clone.style.cursor = "grabbing";
      e.preventDefault();
    }
    function onDragMove(e) {
      if (!isDragging) return;
      zoomX = dragOriginX + (e.clientX - dragStartX);
      zoomY = dragOriginY + (e.clientY - dragStartY);
      applyTransform(clone);
    }
    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      clone.style.cursor = "grab";
    }

    clone.addEventListener("mousedown", onDragStart);
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    clone._cleanup = () => {
      document.removeEventListener("mousemove", onDragMove);
      document.removeEventListener("mouseup", onDragEnd);
    };
    zoomOverlay.addEventListener("click", closeZoom, { once: true });
  }

  function closeZoom() {
    if (!isZoomed) return;
    isZoomed = false; isDragging = false;
    const clone = document.getElementById("zoomed-img");
    if (clone) { clone._cleanup?.(); clone.remove(); }
    zoomOverlay.classList.remove("active");
  }

  /* ================= EVENTS ================= */
  projects.forEach((p, i) => p.addEventListener("click", () => openProject(i)));
  nextProjectBtn?.addEventListener("click", nextProject);
  prevProjectBtn?.addEventListener("click", prevProject);
  nextimgBtn?.addEventListener("click", nextSlide);
  previmgBtn?.addEventListener("click", prevSlide);
  closeBtn?.addEventListener("click", closeViewer);

  // Fix 9: aria-labels para accesibilidad
  nextProjectBtn?.setAttribute("aria-label", "Proyecto siguiente");
  prevProjectBtn?.setAttribute("aria-label", "Proyecto anterior");
  nextimgBtn?.setAttribute("aria-label", "Imagen siguiente");
  previmgBtn?.setAttribute("aria-label", "Imagen anterior");
  closeBtn?.setAttribute("aria-label", "Cerrar");

  document.addEventListener("keydown", (e) => {
    if (!viewer.classList.contains("active")) return;
    if (e.key === "Escape") { if (isZoomed) closeZoom(); else closeViewer(); return; }
    if (isZoomed) return;
    if (e.key === "ArrowRight") { e.shiftKey ? nextProject() : nextSlide(); }
    if (e.key === "ArrowLeft")  { e.shiftKey ? prevProject() : prevSlide(); }
  });

  /* ================= SWIPE TÁCTIL (móvil) ================= */
  let touchStartX = 0, touchStartY = 0;
  viewer.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  viewer.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return; // ignorar taps y scroll vertical
    if (dx < 0) nextSlide();
    else        prevSlide();
  }, { passive: true });

  /* ================= PROJECT INFO HOVER ================= */
  projects.forEach(p => {
    const info = document.createElement("div");
    info.classList.add("project-info");
    info.textContent = p.dataset.title || "";
    p.appendChild(info);
  });

  /* ================= LOADER + SCROLL REVEAL =================
     DISEÑO: el loader vive en el HTML (proyectos.html / exposiciones.html),
     no se crea con JS. Esto evita el problema del bfcache donde
     DOMContentLoaded no se re-dispara al volver con el botón Atrás,
     dejando un loader creado-por-JS huérfano en el DOM.

     FLUJO:
     1. El HTML ya tiene #page-loader visible desde el primer byte.
     2. El JS lo encuentra, anima la barra, y lo destruye cuando las
        imágenes están listas (o tras el fallback).
     3. Si el elemento no existe (página sin loader) se salta todo.
  ================= */

  const loader    = document.getElementById("page-loader");
  const loaderBar = document.getElementById("loader-bar");

  /* Si esta página no tiene loader en el HTML, saltar directo al reveal */
  if (!loader || !loaderBar) {
    revealFirstRow();
  } else {
    runLoader();
  }

  function runLoader() {
    const allImgs      = Array.from(projects).map(p => p.querySelector("img")).filter(Boolean);
    const firstRowImgs = allImgs.slice(0, 3);
    const restImgs     = allImgs.slice(3);
    const total        = firstRowImgs.length;
    let loaded         = 0;
    let loaderDone     = false;

    /* Tiempo mínimo que se muestra el loader aunque todo esté en caché.
       1500ms da tiempo a apreciar la barra y la entrada a la página. */
    const MIN_LOADER_MS = 1000;
    const loaderStart   = Date.now();

    /* Fallback duro: si en 4s no terminó, forzar cierre */
    const loaderTimeout = setTimeout(() => hideLoader(), 4000);

    /* Barra arranca en 10% de inmediato para dar feedback visual */
    requestAnimationFrame(() => { loaderBar.style.width = "10%"; });

    function onImgReady() {
      loaded++;
      loaderBar.style.width = Math.round((loaded / total) * 100) + "%";
      if (loaded >= total) hideLoader();
    }

    function hideLoader() {
      if (loaderDone) return;
      /* Respetar el tiempo mínimo: si las imágenes cargaron muy rápido
         (caché) esperamos el tiempo restante antes de ocultar el loader */
      const elapsed   = Date.now() - loaderStart;
      const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
      if (remaining > 0) {
        setTimeout(() => _doHideLoader(), remaining);
        return;
      }
      _doHideLoader();
    }

    function _doHideLoader() {
      if (loaderDone) return;
      loaderDone = true;
      clearTimeout(loaderTimeout);

      loaderBar.style.width = "100%";

      /* pointer-events none de inmediato: la página es usable aunque
         la animación de fade no haya terminado todavía */
      loader.style.pointerEvents = "none";

      /* Pequeña pausa para que el 100% sea visible antes del fade */
      setTimeout(() => {
        loader.classList.add("done");

        let removed = false;
        function doRemove() {
          if (removed) return;
          removed = true;
          loader.remove();
          revealFirstRow();
          preloadRest(restImgs);
        }
        /* Doble garantía: transitionend o timeout */
        loader.addEventListener("transitionend", doRemove, { once: true });
        setTimeout(doRemove, 800);
      }, 120);
    }

    if (total === 0) {
      hideLoader();
    } else {
      firstRowImgs.forEach(img => {
        /* Imagen ya en caché y decodificada */
        if (img.complete && img.naturalWidth > 0) {
          onImgReady();
        /* Imagen en caché pero no decodificada aún (Chrome/Safari con bfcache) */
        } else if (img.complete && typeof img.decode === "function") {
          img.decode().then(onImgReady).catch(onImgReady);
        /* Imagen aún descargando */
        } else {
          img.addEventListener("load",  onImgReady, { once: true });
          img.addEventListener("error", onImgReady, { once: true });
        }
      });
    }
  }

  /* Precargar imágenes restantes de forma escalonada */
  function preloadRest(restImgs) {
    restImgs.forEach((img, i) => {
      setTimeout(() => {
        if (!img.complete || img.naturalWidth === 0) {
          new Image().src = img.src;
        }
      }, i * 80);
    });
  }

  /* — Animación escalonada de la primera fila —
     Cada tarjeta sale una por una (izquierda → centro → derecha)
     con 280ms entre cada una para que la cascada sea claramente visible.
     El delay base de 200ms deja que el fade-out del loader termine primero. */
  function revealFirstRow() {
    projects.forEach((p, i) => {
      if (i >= 3) return;
      setTimeout(() => animateIn(p), 200 + i * 280);
    });
  }

  /* Función central de animación.
     void el.offsetHeight fuerza un reflow que obliga al browser a pintar
     el estado inicial (opacity:0 + translateY) antes de agregar .visible.
     Sin esto el browser puede colapsar ambos estados en un frame y
     saltarse la transición completamente. */
  function animateIn(el) {
    el.classList.add("will-animate");
    void el.offsetHeight;
    requestAnimationFrame(() => el.classList.add("visible"));
  }

  /* — Scroll reveal para filas 2+ —
     Las imágenes de filas siguientes se pre-cargan en segundo plano
     (ver preloadRest) para que estén listas cuando el usuario baja.
     El observer espera a que el elemento haya entrado 80px en el
     viewport antes de disparar — así el usuario YA lo está viendo
     cuando empieza la animación, no antes. */
  const projectsArr = Array.from(projects);

  /* Agrupamos los proyectos por fila (de 3 en 3) para animarlos
     juntos con un pequeño escalonado interno por columna */
  function getRowAndCol(idx) {
    return { row: Math.floor(idx / 3), col: idx % 3 };
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const project = entry.target;
      const idx = projectsArr.indexOf(project);

      if (idx < 3) { observer.unobserve(project); return; }
      observer.unobserve(project);

      const { col } = getRowAndCol(idx);
      const img = project.querySelector("img");

      /* Escalonado por columna dentro de la misma fila:
         col 0 → 0ms, col 1 → 120ms, col 2 → 240ms
         Así cada fila se anima en cascada izquierda→derecha igual que la primera */
      const colDelay = col * 120;

      function doAnimate() {
        setTimeout(() => animateIn(project), colDelay);
      }

      if (!img || (img.complete && img.naturalWidth > 0)) {
        doAnimate();
      } else {
        img.addEventListener("load",  doAnimate, { once: true });
        img.addEventListener("error", doAnimate, { once: true });
        /* Fallback: si la imagen tarda más de 1.5s, animar igual */
        setTimeout(() => {
          if (!project.classList.contains("visible")) doAnimate();
        }, 1500);
      }
    });
  }, {
    /* -80px: el elemento debe haber entrado 80px al viewport para disparar.
       El usuario ya lo está mirando cuando arranca la animación. */
    rootMargin: "0px 0px -80px 0px",
    threshold: 0
  });

  projects.forEach(p => observer.observe(p));

});