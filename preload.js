/* =====================================================
   PRELOAD.JS — Preload especulativo de thumbs
   Incluir en páginas sin galería (biografía, contacto)
   para que las imágenes de projects y exhibitions estén
   en caché cuando el usuario navegue a esas secciones.
   No toca ningún otro código de la web.
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

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
    /* Esperar 800ms para que la página termine de pintarse primero */
    setTimeout(() => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(loadNext, { timeout: 2000 });
      } else {
        /* Fallback para Safari que no tiene requestIdleCallback */
        srcs.forEach((src, idx) => {
          setTimeout(() => { new Image().src = src; }, idx * 150);
        });
      }
    }, 800);
  }

  speculativePreload(THUMBS_TO_PRELOAD);

});
