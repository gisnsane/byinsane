document.addEventListener("DOMContentLoaded", () => {

  /* ================= NAV ================= */
  const toggle  = document.getElementById("menu-toggle");
  const sidenav = document.getElementById("sidenav");
  if (toggle && sidenav) {
    toggle.addEventListener("click", () => sidenav.classList.toggle("active"));
  }

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
  const nextImgBtn     = document.getElementById("img-next");
  const prevImgBtn     = document.getElementById("img-prev");

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
  function getViewerImg() { return viewerContent.querySelector("img"); }

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
      // Fix 8: alt con título del proyecto actual
      const currentP = projects[currentProject];
      const altText = currentP?.dataset?.title || "";
      viewerContent.innerHTML = `<img src="${slide.src}" alt="${altText}" style="cursor:zoom-in;">`;
      const img = getViewerImg();
      if (img) img.addEventListener("click", (e) => { e.stopPropagation(); openZoom(); });
    }

    updateMiniControls();
  }

  function updateMiniControls() {
    const miniControls = document.querySelector(".viewer-controls-mini");
    if (!miniControls) return;
    miniControls.style.display = slides.length > 1 ? "flex" : "none";
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
    const viewerImg = getViewerImg();
    if (!viewerImg) return;
    isZoomed = true; zoomScale = 1; zoomX = 0; zoomY = 0;
    const clone = viewerImg.cloneNode();
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
  nextImgBtn?.addEventListener("click", nextSlide);
  prevImgBtn?.addEventListener("click", prevSlide);
  closeBtn?.addEventListener("click", closeViewer);

  // Fix 9: aria-labels para accesibilidad
  nextProjectBtn?.setAttribute("aria-label", "Proyecto siguiente");
  prevProjectBtn?.setAttribute("aria-label", "Proyecto anterior");
  nextImgBtn?.setAttribute("aria-label", "Imagen siguiente");
  prevImgBtn?.setAttribute("aria-label", "Imagen anterior");
  closeBtn?.setAttribute("aria-label", "Cerrar");

  document.addEventListener("keydown", (e) => {
    if (!viewer.classList.contains("active")) return;
    if (e.key === "Escape") { if (isZoomed) closeZoom(); else closeViewer(); return; }
    if (isZoomed) return;
    if (e.key === "ArrowRight") { e.shiftKey ? nextProject() : nextSlide(); }
    if (e.key === "ArrowLeft")  { e.shiftKey ? prevProject() : prevSlide(); }
  });

  /* ================= PROJECT INFO HOVER ================= */
  projects.forEach(p => {
    const info = document.createElement("div");
    info.classList.add("project-info");
    info.textContent = p.dataset.title || "";
    p.appendChild(info);
  });

  /* ================= SCROLL REVEAL ================= */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const project = entry.target;
      const img = project.querySelector("img");
      if (!img) { project.classList.add("visible"); observer.unobserve(project); return; }
      if (img.complete && img.naturalWidth > 0) {
        project.classList.add("visible");
      } else {
        img.addEventListener("load",  () => project.classList.add("visible"), { once: true });
        img.addEventListener("error", () => project.classList.add("visible"), { once: true });
      }
      observer.unobserve(project);
    });
  }, { threshold: 0.1 });

  projects.forEach(p => observer.observe(p));

});