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
