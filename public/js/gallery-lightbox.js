/**
 * Gallery lightbox.
 */
(function () {
  var gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  var thumbEls = Array.prototype.slice.call(
    gallery.querySelectorAll("[data-gallery-item]"),
  );
  if (!thumbEls.length) return;

  var images = thumbEls.map(function (el) {
    var thumbImg = el.querySelector("img");
    return {
      src: el.getAttribute("data-src") || el.getAttribute("href"),
      preview: thumbImg ? thumbImg.getAttribute("src") : el.getAttribute("data-src"),
    };
  });

  var ACCENT = "#2d88ff";

  var ICON_DOWNLOAD =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';
  var ICON_CLOSE =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  var ICON_PREV =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  var ICON_NEXT =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';

  var lb = document.createElement("div");
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Image lightbox");
  lb.className =
    "fixed inset-0 z-[999] hidden flex-col items-center justify-center gap-2 p-2 bg-black/[0.92] backdrop-blur";
  lb.innerHTML =
    '<div class="flex w-full max-w-[1000px] flex-shrink-0 items-center justify-between">' +
    '  <div class="flex items-center gap-[10px]">' +
    '    <span data-lb-counter class="text-sm font-bold text-white">1 / 1</span>' +
    '    <span data-lb-title class="text-xs text-white/50"></span>' +
    "  </div>" +
    '  <div class="flex items-center gap-2">' +
    '    <a data-lb-download download class="flex cursor-pointer items-center gap-[5px] rounded-[10px] border border-white/[0.12] bg-white/[0.08] px-3 py-[6px] text-xs text-white/60 transition-colors hover:bg-white/[0.15] hover:text-white">' +
    ICON_DOWNLOAD +
    " Save</a>" +
    '    <button data-lb-close aria-label="Close lightbox" class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-white/[0.12] bg-white/[0.08] text-white/60 transition-all hover:bg-white/[0.15] hover:text-white">' +
    ICON_CLOSE +
    "</button>" +
    "  </div>" +
    "</div>" +
    '<div class="flex w-full max-w-[1000px] flex-1 items-center justify-center gap-4 overflow-hidden">' +
    '  <button data-lb-prev aria-label="Previous image" class="flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] bg-white/10 text-white backdrop-blur transition-all hover:border-white/30 hover:bg-white/20">' +
    ICON_PREV +
    "</button>" +
    '  <div class="flex max-h-[65vh] flex-1 items-center justify-center overflow-hidden">' +
    '    <img data-lb-img src="" alt="" class="max-h-[65vh] max-w-full rounded-2xl border border-white/[0.08] object-contain shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-opacity duration-150" />' +
    "  </div>" +
    '  <button data-lb-next aria-label="Next image" class="flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] bg-white/10 text-white backdrop-blur transition-all hover:border-white/30 hover:bg-white/20">' +
    ICON_NEXT +
    "</button>" +
    "</div>" +
    '<p data-lb-hint class="text-center text-[11px] text-white/30">Use arrow keys to navigate &nbsp;&middot;&nbsp; Esc to close</p>' +
    '<div data-lb-strip class="flex max-w-[1000px] gap-2 overflow-x-auto py-1"></div>';
  document.body.appendChild(lb);

  var img = lb.querySelector("[data-lb-img]");
  var counter = lb.querySelector("[data-lb-counter]");
  var title = lb.querySelector("[data-lb-title]");
  var download = lb.querySelector("[data-lb-download]");
  var strip = lb.querySelector("[data-lb-strip]");
  var current = 0;

  var stripBtns = images.map(function (image, i) {
    var btn = document.createElement("button");
    btn.className =
      "h-12 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-transparent p-0 transition-all hover:border-white/50";
    btn.innerHTML =
      '<img src="' +
      image.preview +
      '" alt="Thumbnail ' +
      (i + 1) +
      '" class="h-full w-full object-cover" />';
    btn.addEventListener("click", function () {
      goTo(i);
    });
    strip.appendChild(btn);
    return btn;
  });

  function render() {
    var image = images[current];
    img.src = image.src;
    img.alt = "Screenshot " + (current + 1);
    counter.textContent = current + 1 + " / " + images.length;
    title.textContent = "Screenshot " + (current + 1);
    download.setAttribute("href", image.src);

    stripBtns.forEach(function (btn, i) {
      var on = i === current;
      btn.style.borderColor = on ? ACCENT : "transparent";
      btn.style.boxShadow = on ? "0 0 0 2px rgba(45,136,255,0.4)" : "";
    });
    var active = stripBtns[current];
    if (active) active.scrollIntoView({ inline: "center", behavior: "smooth" });

    thumbEls.forEach(function (el, i) {
      var on = i === current;
      el.style.outline = on ? "3px solid " + ACCENT : "";
      el.style.outlineOffset = on ? "2px" : "";
    });
  }

  function goTo(index) {
    img.style.opacity = "0";
    setTimeout(function () {
      current = (index + images.length) % images.length;
      render();
      img.style.opacity = "1";
    }, 150);
  }

  function open(index) {
    current = index;
    lb.classList.remove("hidden");
    lb.classList.add("flex");
    document.body.style.overflow = "hidden";
    img.style.opacity = "1";
    render();
  }

  function close() {
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    document.body.style.overflow = "";
    img.src = "";
  }

  thumbEls.forEach(function (el, i) {
    el.addEventListener("click", function () {
      open(i);
    });
  });

  lb.querySelector("[data-lb-close]").addEventListener("click", close);
  lb.querySelector("[data-lb-prev]").addEventListener("click", function () {
    goTo(current - 1);
  });
  lb.querySelector("[data-lb-next]").addEventListener("click", function () {
    goTo(current + 1);
  });
  lb.addEventListener("click", function (e) {
    if (e.target === lb) close();
  });
  document.addEventListener("keydown", function (e) {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") goTo(current - 1);
    else if (e.key === "ArrowRight") goTo(current + 1);
  });
})();
