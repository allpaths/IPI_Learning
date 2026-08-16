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
    },

    /* Omega = U^m against m. The count explodes; its logarithm does not. */
    "omega-growth": {
      fn: function (m) { return m * Math.log(4) / Math.log(2); },
      pMin: 1, pMax: 12, pStart: 3, step: 1,
      xLabel: "m", yLabel: "log2(Omega)", bases: false,
      yMax: function () { return 24; },
      rows: function (m) {
        var omega = Math.pow(4, m);
        return [
          ["m", String(m)],
          ["Omega = 4^m", omega.toLocaleString()],
          ["log2(Omega)", (m * 2).toFixed(0) + " bits"]
        ];
      },
      note: function (m) {
        if (m === 3) {
          return "m = 3 is a codon: 4^3 = 64 blocks, which is exactly the size of the genetic code.";
        }
        if (m >= 10) {
          return "Over a million distinct blocks — yet the entropy ceiling has only reached " + (m * 2) + " bits. That gap is the whole point.";
        }
        return "The block count multiplies by 4 with every step in m, while the ceiling log2(Omega) = m log2(U) only adds 2 bits. Exponential count, linear entropy.";
      }
    },

    /* Multinomial coefficient for a 2-symbol message of N = 10. */
    "multinomial-peak": {
      fn: function (nA) {
        var N = 10, k = Math.round(nA), r = 1;
        for (var i = 1; i <= k; i++) r = r * (N - k + i) / i;
        return Math.log(r) / Math.log(2);
      },
      pMin: 0, pMax: 10, pStart: 5, step: 1,
      xLabel: "n_A", yLabel: "log2(Omega)", bases: false,
      yMax: function () { return 8; },
      rows: function (nA) {
        var N = 10, k = Math.round(nA), r = 1;
        for (var i = 1; i <= k; i++) r = r * (N - k + i) / i;
        return [
          ["composition", k + " A, " + (N - k) + " B"],
          ["Omega", Math.round(r).toLocaleString()],
          ["log2(Omega)", (Math.log(r) / Math.log(2)).toFixed(3) + " bits"]
        ];
      },
      note: function (nA) {
        var k = Math.round(nA);
        if (k === 0 || k === 10) {
          return "Only one arrangement exists — every character is the same, so there is nothing to permute and Omega = 1.";
        }
        if (k === 5) {
          return "The peak. An even split has the most arrangements (252), which is why the uniform macrostate dominates.";
        }
        return "Away from the even split there are fewer distinct arrangements, so this macrostate occupies less of the space.";
      }
    },

    /* Landauer bound against temperature. */
    "landauer-T": {
      fn: function (T) { return 1.380649e-23 * T * Math.log(2) / 1e-21; },
      pMin: 0, pMax: 1000, pStart: 300, step: 5,
      xLabel: "T (K)", yLabel: "energy (zJ)", bases: false,
      yMax: function () { return 10; },
      rows: function (T) {
        var E = 1.380649e-23 * T * Math.log(2);
        return [
          ["T", T.toFixed(0) + " K"],
          ["k_B T ln2", E.toExponential(3) + " J"],
          ["m = E/c^2", (E / 8.987551787e16).toExponential(3) + " kg"]
        ];
      },
      note: function (T) {
        if (T < 5) {
          return "Approaching absolute zero the cost of erasure vanishes — and so, on the proposed principle, does the mass of a bit.";
        }
        if (Math.abs(T - 300) < 10) {
          return "Room temperature: about 2.87e-21 J per erasure, and a proposed mass of 3.19e-38 kg per stored bit.";
        }
        return "Both the energy and the proposed mass are strictly linear in T — the whole curve is one straight line through the origin.";
      }
    },

    /* Part 4: how the step size inflates the block count. N = 30, m = 6. */
    "overlap-factor": {
      fn: function (SS) { return 1 + (30 - 6) / Math.max(1, SS); },
      pMin: 1, pMax: 6, pStart: 1, step: 1,
      xLabel: "step size  SS", yLabel: "N_m", bases: false,
      yMax: function () { return 25; },
      rows: function (SS) {
        var s = Math.max(1, Math.round(SS));
        var Nm = 1 + (30 - 6) / s;
        return [
          ["N_m", Nm.toFixed(0) + " blocks"],
          ["slots read", (Nm * 6).toFixed(0) + " of 30"],
          ["each character read", (Nm * 6 / 30).toFixed(1) + "x"]
        ];
      },
      note: function (SS) {
        var s = Math.max(1, Math.round(SS));
        if (s === 6) {
          return "SS = m. The blocks tile the message exactly — 30 slots for 30 characters, every one read once. No inflation.";
        }
        if (s === 1) {
          return "Maximum overlap. 150 slots for a 30-character message, so each character is counted five times over — this is what inflates the total, and what Part 5 opens by correcting.";
        }
        return "Between the extremes. Overlapping windows re-read characters, so the block count and the total information both rise without any new data arriving.";
      }
    },

    /* Part 5: what a sample of a given size can possibly show. */
    "sampling-ceiling": {
      fn: function (n) { return Math.min(Math.log(Math.max(2, n)) / Math.log(2), 6); },
      pMin: 2, pMax: 256, pStart: 16, step: 2,
      xLabel: "codons sampled  N_m", yLabel: "max measurable", bases: false,
      yMax: function () { return 6; },
      rows: function (n) {
        var k = Math.max(2, Math.round(n));
        var ceil = Math.min(Math.log(k) / Math.log(2), 6);
        return [
          ["N_m", k + " codons"],
          ["log2(N_m)", (Math.log(k) / Math.log(2)).toFixed(2) + " bits"],
          ["of the 6-bit ceiling", (ceil / 6 * 100).toFixed(0) + "%"]
        ];
      },
      note: function (n) {
        var k = Math.max(2, Math.round(n));
        if (k <= 20) {
          return "The lecture's segment gives 16 codons, so no measurement from it can exceed log2(16) = 4 bits — two thirds of the true ceiling, before the genome is even considered.";
        }
        if (k >= 64) {
          return "Past 64 samples the ceiling is no longer the binding constraint, and a measurement starts to say something about the sequence rather than the sample.";
        }
        return "Still sample-limited. Until N_m passes 64 the arithmetic caps what any estimate can report, whatever the underlying source does.";
      }
    },

    /* Part 7: Stirling's relative error, for the AAB distribution. */
    "stirling-error": {
      fn: function (N) { return stirlingErrorPct(N); },
      pMin: 30, pMax: 800, pStart: 50, step: 5,
      xLabel: "message length  N", yLabel: "error (%)", bases: false,
      yMax: function () { return 10; },
      rows: function (N) {
        var k = Math.round(N);
        return [
          ["N", String(k)],
          ["N x H", (k * H_AAB).toFixed(2) + " bits"],
          ["Stirling error", stirlingErrorPct(k).toFixed(3) + " %"]
        ];
      },
      note: function (N) {
        var k = Math.round(N);
        if (k <= 60) {
          return "At short lengths Stirling is visibly loose — the approximation is asymptotic, and this is the regime where it has not yet earned its keep.";
        }
        if (k >= 300) {
          return "Under a tenth of a percent. For any message of realistic length the approximation is effectively exact, which is what licenses the bridge.";
        }
        return "The error falls roughly as 1/N. Every extra character makes the approximation better, and nothing about it is tuned — it simply converges.";
      }
    },

    /* Part 8: S grows with the system, H does not. */
    "extensive-intensive": {
      fn: function (N) { return N * 1.380649e-23 * 2 * Math.log(2) / 1e-20; },
      pMin: 0, pMax: 10000, pStart: 1000, step: 100,
      xLabel: "system size  N", yLabel: "S (10^-20 J/K)", bases: false,
      yMax: function () { return 20; },
      rows: function (N) {
        var S = N * 1.380649e-23 * 2 * Math.log(2);
        return [
          ["N", Math.round(N).toLocaleString() + " characters"],
          ["H", "2.000 bits/character"],
          ["S", S.toExponential(3) + " J/K"]
        ];
      },
      note: function (N) {
        if (N < 200) {
          return "Small system, small S — but H is already 2 bits and will not move again however far you drag.";
        }
        return "S has been climbing in a straight line while H has not shifted at all. That is the whole distinction: S is extensive, H is intensive, and only k_B carries the units.";
      }
    }
  };

  /* --- support for stirling-error ------------------------------------- */

  var H_AAB = -(2 / 3 * Math.log(2 / 3) + 1 / 3 * Math.log(1 / 3)) / Math.log(2);
  var logFactMemo = [0, 0];

  function log2Factorial(k) {
    for (var i = logFactMemo.length; i <= k; i++) {
      logFactMemo[i] = logFactMemo[i - 1] + Math.log(i) / Math.log(2);
    }
    return logFactMemo[k];
  }

  /* Exact log2(Omega) from the multinomial, against the N*H approximation. */
  function stirlingErrorPct(N) {
    var n = Math.round(N);
    var nA = Math.round(2 * n / 3);
    var nB = n - nA;
    var exact = log2Factorial(n) - log2Factorial(nA) - log2Factorial(nB);
    var approx = n * H_AAB;
    if (approx === 0) return 0;
    return Math.abs(approx - exact) / approx * 100;
  }

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

    var xLabel = cfg.xLabel || "probability  p";
    slider.setAttribute("aria-label", xLabel);

    var sliderRow = el("div", "cyux-row");
    sliderRow.appendChild(el("label", "cyux-key", xLabel));
    sliderRow.appendChild(slider);
    controls.appendChild(sliderRow);

    /* Base toggle only where changing units is part of the lesson. */
    var baseBtns = [];
    if (cfg.bases !== false) {
      var baseRow = el("div", "cyux-row cyux-row--bases");
      baseRow.appendChild(el("span", "cyux-key", "units"));
      baseBtns = BASES.map(function (b, i) {
        var btn = el("button", "cyux-base", b.label);
        btn.type = "button";
        btn.addEventListener("click", function () { baseIndex = i; render(); });
        baseRow.appendChild(btn);
        return btn;
      });
      controls.appendChild(baseRow);
    }

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
      var wholeX = cfg.pMax - cfg.pMin >= 5;   // integer-ish domains (m, T)
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        var pv = cfg.pMin + t * (cfg.pMax - cfg.pMin);
        ctx.fillText(wholeX ? pv.toFixed(0) : pv.toFixed(2), X(pv), padT + plotH + 7);
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
      ctx.fillText(cfg.xLabel || "p", padL + plotW / 2, h - 1);
      ctx.save();
      ctx.translate(11, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(cfg.bases === false ? cfg.yLabel : cfg.yLabel + "  " + base.label, 0, 0);
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
