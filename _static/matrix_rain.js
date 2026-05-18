/* Matrix-style animated digital rain for the .ipi-hero banner.
 *
 * Replaces the static matrix_banner.svg background with a live canvas.
 * No-ops on pages that don't have a .ipi-hero (i.e. all the notebook
 * pages).  Respects the OS-level "reduce motion" preference.
 */
(function () {
  "use strict";

  const FONT_SIZE = 16;
  const FRAME_MS = 72;           // ~14 fps — easy on the GPU and feels deliberate
  const TRAIL_FADE = 0.08;       // higher = shorter tails
  const HEAD_COLOR = "#ffffff";  // bright white lead character
  const TAIL_COLOR = "#1bd169";  // softer green trailing characters
  const BG_COLOR   = "#0a1408";  // matches the SVG fallback
  const CHARS = "01010101010110ABCDEF0123456789";

  function init() {
    const hero = document.querySelector(".ipi-hero");
    if (!hero) return;

    // Skip animation entirely if the user prefers reduced motion.
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    hero.classList.add("ipi-hero--animated");
    const canvas = document.createElement("canvas");
    canvas.className = "ipi-hero-canvas";
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
    const ctx = canvas.getContext("2d", { alpha: false });

    let cols = 0;
    let drops = [];
    let widthCSS = 0;
    let heightCSS = 0;

    function resize() {
      const rect = hero.getBoundingClientRect();
      widthCSS = rect.width;
      heightCSS = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(widthCSS * dpr));
      canvas.height = Math.max(1, Math.round(heightCSS * dpr));
      canvas.style.width = widthCSS + "px";
      canvas.style.height = heightCSS + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, widthCSS, heightCSS);
      cols = Math.max(1, Math.floor(widthCSS / FONT_SIZE));
      drops = new Array(cols).fill(0).map(
        () => Math.floor(Math.random() * -40)
      );
    }

    function step() {
      // Fade existing pixels toward the background (creates the trailing effect)
      ctx.fillStyle = "rgba(10, 20, 8, " + TRAIL_FADE + ")";
      ctx.fillRect(0, 0, widthCSS, heightCSS);

      ctx.font = FONT_SIZE + "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.textBaseline = "top";

      for (let i = 0; i < cols; i++) {
        const ch = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        // Skip rendering above the visible region for speed
        if (y >= -FONT_SIZE && y <= heightCSS) {
          // Trail char in softer green
          ctx.fillStyle = TAIL_COLOR;
          ctx.fillText(ch, x, y - FONT_SIZE);
          // Lead char in bright green
          ctx.fillStyle = HEAD_COLOR;
          ctx.fillText(ch, x, y);
        }

        // Reset column with a small random probability once it leaves the screen
        if (y > heightCSS && Math.random() > 0.975) {
          drops[i] = Math.floor(Math.random() * -10);
        } else {
          drops[i] += 1;
        }
      }
    }

    resize();
    window.addEventListener("resize", resize);
    setInterval(step, FRAME_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
