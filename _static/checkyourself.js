/* "Check your Understanding" — client-side exercise engine.
 *
 * WHY JAVASCRIPT AND NOT PYTHON
 * -----------------------------
 * The published site is static HTML. Notebook outputs are baked in at build
 * time by GitHub Actions (execute_notebooks: force) — there is no kernel
 * behind the page, so nothing can execute code a reader types. JavaScript runs
 * in the reader's own browser, so it works with no server at all. The trade is
 * that we grade values and choices rather than running arbitrary Python.
 *
 * PROGRESSIVE ENHANCEMENT
 * -----------------------
 * Each exercise is authored as a <details class="cyu"> containing plain,
 * readable question text plus nested <details> for hint and solution. That
 * renders and works unaided in JupyterLab, Colab, and with JS disabled — where
 * this file is never loaded. Here we upgrade it in place: build the inputs,
 * wire submit/retry, and hide the static fallback.
 *
 * ANSWER DATA lives in data-* attributes on each .cyu-q so the content stays
 * next to the prose in the notebook rather than drifting into this file.
 *
 *   data-type       "mcq" | "numeric" | "blank"
 *   data-answer     correct value; for mcq the 0-based index
 *   data-choices    mcq only, "|"-separated options
 *   data-tolerance  numeric/blank only, absolute tolerance (default 0.01)
 *   data-unit       optional label shown after the input
 *   data-template   blank only, code with ____ marking the gap
 *   data-hint1      shown after the first wrong attempt (a nudge)
 *   data-hint2      shown after the second (near enough to fill in)
 *   data-explain    shown on success
 *   data-solution   the plain answer, revealed on demand
 */

(function () {
  "use strict";

  var DEFAULT_TOLERANCE = 0.01;

  /* Accepts "3", "3.0", "1/8", "2**3", "log2(8)" is NOT evaluated — we keep
   * this deliberately narrow. Anything we cannot parse as a number returns
   * null and is reported as unreadable rather than silently marked wrong. */
  function parseNumber(raw) {
    if (raw == null) return null;
    var s = String(raw).trim().replace(/,/g, "");
    if (!s) return null;

    var frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (frac) {
      var denom = parseFloat(frac[2]);
      return denom === 0 ? null : parseFloat(frac[1]) / denom;
    }

    var pow = s.match(/^(-?\d+(?:\.\d+)?)\s*\*\*\s*(-?\d+(?:\.\d+)?)$/);
    if (pow) return Math.pow(parseFloat(pow[1]), parseFloat(pow[2]));

    if (/^-?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(s)) return parseFloat(s);
    return null;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function feedback(box, state, label, body) {
    box.hidden = false;
    box.setAttribute("data-state", state);
    box.innerHTML = "";
    box.appendChild(el("span", "cyu-label", label));
    var p = el("p");
    p.innerHTML = body;          // authored content, not user input
    box.appendChild(p);
  }

  function buildQuestion(q) {
    var type = q.getAttribute("data-type") || "numeric";
    var answerRaw = q.getAttribute("data-answer");
    var tolerance = parseFloat(q.getAttribute("data-tolerance"));
    if (!isFinite(tolerance)) tolerance = DEFAULT_TOLERANCE;

    var attempts = 0;
    var settled = false;

    var host = el("div", "cyu-input");
    var box = el("div", "cyu-feedback");
    box.hidden = true;

    var getValue;   // () -> {ok: bool, value: number|number-index, raw: string}
    var markChoices; // optional, mcq only

    if (type === "mcq") {
      var choices = (q.getAttribute("data-choices") || "").split("|");
      var name = "cyu-" + Math.random().toString(36).slice(2, 9);
      var wrap = el("div", "cyu-choices");
      var inputs = [];

      choices.forEach(function (label, i) {
        var row = el("label", "cyu-choice");
        var radio = document.createElement("input");
        radio.type = "radio";
        radio.name = name;
        radio.value = String(i);
        row.appendChild(radio);
        row.appendChild(el("span", null, label.trim()));
        wrap.appendChild(row);
        inputs.push({ radio: radio, row: row });
      });

      host.appendChild(wrap);

      getValue = function () {
        for (var i = 0; i < inputs.length; i++) {
          if (inputs[i].radio.checked) return { ok: true, value: i, raw: choices[i] };
        }
        return { ok: false, raw: "" };
      };

      markChoices = function (correctIndex, chosenIndex) {
        inputs.forEach(function (item, i) {
          item.row.classList.remove("is-right", "is-wrong");
          if (i === correctIndex) item.row.classList.add("is-right");
          else if (i === chosenIndex) item.row.classList.add("is-wrong");
          item.radio.disabled = true;
        });
      };
    } else {
      if (type === "blank") {
        var template = q.getAttribute("data-template");
        if (template) host.appendChild(el("div", "cyu-code", template));
      }
      var entry = el("div", "cyu-entry");
      var field = document.createElement("input");
      field.type = "text";
      field.setAttribute("inputmode", "decimal");
      field.setAttribute("aria-label", "Your answer");
      field.placeholder = type === "blank" ? "fill the blank" : "your answer";
      entry.appendChild(field);
      var unit = q.getAttribute("data-unit");
      if (unit) entry.appendChild(el("span", "cyu-unit", unit));
      host.appendChild(entry);

      getValue = function () {
        var raw = field.value;
        var n = parseNumber(raw);
        return n === null ? { ok: false, raw: raw } : { ok: true, value: n, raw: raw };
      };
    }

    /* --- actions --- */
    var actions = el("div", "cyu-actions");
    var check = el("button", "cyu-btn", "Check");
    check.type = "button";
    var reveal = el("button", "cyu-btn cyu-btn--ghost", "Show solution");
    reveal.type = "button";
    actions.appendChild(check);
    actions.appendChild(reveal);

    function showSolution(prefix) {
      settled = true;
      check.disabled = true;
      reveal.disabled = true;
      if (markChoices) markChoices(parseInt(answerRaw, 10), -1);
      feedback(
        box,
        "wrong",
        prefix || "Solution",
        q.getAttribute("data-solution") || ""
      );
    }

    check.addEventListener("click", function () {
      if (settled) return;
      var got = getValue();

      if (!got.ok) {
        feedback(
          box,
          "hint",
          "No answer yet",
          type === "mcq"
            ? "Pick one of the options, then press Check."
            : "Enter a number — a decimal like <code>3</code> or <code>1.585</code>, or a fraction like <code>1/8</code>."
        );
        return;
      }

      attempts += 1;

      var right =
        type === "mcq"
          ? got.value === parseInt(answerRaw, 10)
          : Math.abs(got.value - parseNumber(answerRaw)) <= tolerance;

      if (right) {
        settled = true;
        check.disabled = true;
        reveal.disabled = true;
        if (markChoices) markChoices(parseInt(answerRaw, 10), got.value);
        feedback(box, "right", "Correct", q.getAttribute("data-explain") || "");
        return;
      }

      if (attempts === 1) {
        feedback(box, "hint", "Not quite — try again", q.getAttribute("data-hint1") || "");
      } else if (attempts === 2) {
        feedback(box, "hint", "Still not right — here is most of it", q.getAttribute("data-hint2") || "");
      } else {
        showSolution("Answer");
      }
    });

    reveal.addEventListener("click", function () { showSolution("Solution"); });

    /* Enter submits, for the typed formats. */
    host.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); check.click(); }
    });

    q.appendChild(host);
    q.appendChild(actions);
    q.appendChild(box);
  }

  function upgrade(block) {
    if (block.classList.contains("cyu-live")) return;
    var questions = block.querySelectorAll(".cyu-q");
    if (!questions.length) return;
    Array.prototype.forEach.call(questions, buildQuestion);
    block.classList.add("cyu-live");
  }

  function init() {
    var blocks = document.querySelectorAll("details.cyu");
    Array.prototype.forEach.call(blocks, upgrade);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ===================================================================
 * Explorers — ungraded, drag-and-watch panels.
 *
 * Separate engine from the graded questions above: nothing to submit and no
 * right answer, just a control wired to a live readout and a plot. Same
 * progressive-enhancement contract — the markup carries a static description
 * that stands on its own where this file never loads.
 *
 * Config-driven so a new explorer is a table entry, not another copy of the
 * slider/canvas plumbing. Each entry supplies its own curve, axis label,
 * readout rows and running commentary; everything else is shared.
 *
 *   fn(p, base)   the curve, in the currently selected base
 *   yMax(base)    top of the y axis
 *   pMin/pMax     domain of the slider
 *   pStart        opening value
 *   rows(p, base) readout as [label, value] pairs
 *   note(p, base) one line of commentary under the readout
 * =================================================================== */

(function () {
  "use strict";

  var BASES = [
    { key: "2", label: "bits",  value: 2 },
    { key: "e", label: "nats",  value: Math.E },
    { key: "3", label: "trits", value: 3 }
  ];

  function info(p, base) {
    return Math.log(1 / p) / Math.log(base);
  }

  /* Binary entropy. The limit of p*log(p) as p -> 0 is 0, so the endpoints
   * are defined rather than NaN — which is the boundary case Section 6 makes. */
  function binaryEntropy(p, base) {
    if (p <= 0 || p >= 1) return 0;
    var q = 1 - p;
    return -(p * Math.log(p) + q * Math.log(q)) / Math.log(base);
  }

  var EXPLORERS = {
    "info-function": {
      fn: info,
      pMin: 0.01,
      pMax: 1,
      pStart: 0.25,
      step: 0.005,
      yLabel: "I(p)",
      yMax: function (base) { return Math.ceil(info(0.01, base)); },
      rows: function (p, base) {
        return [
          ["p", p.toFixed(3)],
          ["1 / p", (1 / p).toFixed(3)],
          ["I(p)", info(p, base.value).toFixed(4) + " " + base.label]
        ];
      },
      note: function (p) {
        if (p > 0.995) {
          return "A certain event. You learn nothing from being told it happened — I(1) = 0, which is Shannon's third axiom.";
        }
        if (p < 0.05) {
          return "A rare event, and a very informative one. As p falls toward 0 the information grows without bound.";
        }
        return "Halve p and I(p) rises by exactly one bit — that constant step is what makes the function logarithmic.";
      }
    },

    "binary-entropy": {
      fn: binaryEntropy,
      pMin: 0,
      pMax: 1,
      pStart: 0.5,
      step: 0.005,
      yLabel: "H(p)",
      yMax: function (base) { return binaryEntropy(0.5, base); },
      rows: function (p, base) {
        return [
          ["p", p.toFixed(3)],
          ["1 - p", (1 - p).toFixed(3)],
          ["H", binaryEntropy(p, base.value).toFixed(4) + " " + base.label]
        ];
      },
      note: function (p, base) {
        var peak = binaryEntropy(0.5, base.value).toFixed(4);
        if (p <= 0.005 || p >= 0.995) {
          return "One outcome is certain, so there is no uncertainty to measure and H = 0. Both ends of the curve touch zero.";
        }
        if (Math.abs(p - 0.5) < 0.02) {
          return "The peak. A uniform distribution is the most uncertain one, and here H reaches its maximum of " + peak + " " + base.label + ".";
        }
        if (Math.abs(p - 0.9) < 0.02 || Math.abs(p - 0.1) < 0.02) {
          return "This is the biased coin from the cell above — the 90/10 split, worth about 0.469 bits against the fair coin's 1.";
        }
        return "Away from the peak the outcome is more predictable, so each observation carries less information.";
      }
    }
  };

  function css(node, name, fallback) {
    var v = getComputedStyle(node).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildExplorer(node) {
    if (node.dataset.explorerReady) return;
    var cfg = EXPLORERS[node.getAttribute("data-explore")];
    if (!cfg) return;
    node.dataset.explorerReady = "1";

    var baseIndex = 0;
    var p = cfg.pStart;

    var controls = el("div", "cyux-controls");

    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(cfg.pMin);
    slider.max = String(cfg.pMax);
    slider.step = String(cfg.step);
    slider.value = String(p);
    slider.className = "cyux-slider";
    slider.setAttribute("aria-label", "probability p");

    var sliderRow = el("div", "cyux-row");
    sliderRow.appendChild(el("label", "cyux-key", "probability  p"));
    sliderRow.appendChild(slider);
    controls.appendChild(sliderRow);

    var baseRow = el("div", "cyux-row cyux-row--bases");
    baseRow.appendChild(el("span", "cyux-key", "units"));
    var baseBtns = BASES.map(function (b, i) {
      var btn = el("button", "cyux-base", b.label);
      btn.type = "button";
      btn.addEventListener("click", function () { baseIndex = i; render(); });
      baseRow.appendChild(btn);
      return btn;
    });
    controls.appendChild(baseRow);

    var readout = el("div", "cyux-readout");

    var canvas = document.createElement("canvas");
    canvas.className = "cyux-canvas";
    canvas.setAttribute("role", "img");
    var wrap = el("div", "cyux-canvas-wrap");
    wrap.appendChild(canvas);

    node.appendChild(controls);
    node.appendChild(readout);
    node.appendChild(wrap);

    function drawPlot() {
      var base = BASES[baseIndex];
      var ratio = window.devicePixelRatio || 1;
      var w = wrap.clientWidth || 600;
      var h = Math.max(180, Math.min(260, Math.round(w * 0.42)));

      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      var ctx = canvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var ink = css(node, "color", "#333") || "#333";
      var accent = css(document.documentElement, "--ipi-green", "#1bd169");
      var padL = 46, padR = 14, padT = 14, padB = 30;
      var plotW = w - padL - padR;
      var plotH = h - padT - padB;

      var yMax = cfg.yMax(base.value);
      var X = function (pv) {
        return padL + ((pv - cfg.pMin) / (cfg.pMax - cfg.pMin)) * plotW;
      };
      var Y = function (iv) { return padT + plotH - (iv / yMax) * plotH; };

      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      ctx.globalAlpha = 0.7;
      ctx.fillStyle = ink;
      ctx.font = "11px ui-monospace, Menlo, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        var pv = cfg.pMin + t * (cfg.pMax - cfg.pMin);
        ctx.fillText(pv.toFixed(2), X(pv), padT + plotH + 7);
      });

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      var steps = 4;
      for (var s = 0; s <= steps; s++) {
        var yv = (yMax / steps) * s;
        var label = yMax >= 3 ? yv.toFixed(0) : yv.toFixed(2);
        ctx.fillText(label, padL - 7, Y(yv));
        ctx.globalAlpha = 0.14;
        ctx.beginPath();
        ctx.moveTo(padL, Y(yv));
        ctx.lineTo(padL + plotW, Y(yv));
        ctx.stroke();
        ctx.globalAlpha = 0.7;
      }

      ctx.globalAlpha = 0.75;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("p", padL + plotW / 2, h - 1);
      ctx.save();
      ctx.translate(11, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(cfg.yLabel + "  " + base.label, 0, 0);
      ctx.restore();

      ctx.globalAlpha = 1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      var started = false;
      for (var i = 0; i <= 300; i++) {
        var pv2 = cfg.pMin + (cfg.pMax - cfg.pMin) * (i / 300);
        var iv = cfg.fn(pv2, base.value);
        if (!isFinite(iv)) continue;
        if (!started) { ctx.moveTo(X(pv2), Y(iv)); started = true; }
        else ctx.lineTo(X(pv2), Y(iv));
      }
      ctx.stroke();

      var iNow = cfg.fn(p, base.value);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(p), padT + plotH);
      ctx.lineTo(X(p), Y(iNow));
      ctx.lineTo(padL, Y(iNow));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(X(p), Y(iNow), 4.5, 0, Math.PI * 2);
      ctx.fill();

      canvas.setAttribute(
        "aria-label",
        "Plot of " + cfg.yLabel + " against probability. At p = " + p.toFixed(3) +
        ", " + cfg.yLabel + " = " + iNow.toFixed(3) + " " + base.label + "."
      );
    }

    function render() {
      p = parseFloat(slider.value);
      var base = BASES[baseIndex];

      baseBtns.forEach(function (b, i) {
        b.classList.toggle("is-on", i === baseIndex);
      });

      readout.innerHTML = "";
      cfg.rows(p, base).forEach(function (r) {
        var cell = el("div", "cyux-cell");
        cell.appendChild(el("span", "cyux-cell-key", r[0]));
        cell.appendChild(el("span", "cyux-cell-val", r[1]));
        readout.appendChild(cell);
      });
      readout.appendChild(el("p", "cyux-note", cfg.note(p, base)));

      drawPlot();
    }

    slider.addEventListener("input", render);

    if (window.ResizeObserver) {
      new ResizeObserver(function () { drawPlot(); }).observe(wrap);
    } else {
      window.addEventListener("resize", drawPlot);
    }

    node.classList.add("cyux-live");
    render();
  }

  function init() {
    var nodes = document.querySelectorAll("[data-explore]");
    Array.prototype.forEach.call(nodes, buildExplorer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
