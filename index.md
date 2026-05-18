<a class="ipi-hero-link"
   href="https://www.informationphysicsinstitute.org/"
   target="_blank" rel="noopener noreferrer"
   aria-label="Visit the Information Physics Institute website">
  <div class="ipi-hero">
    <h1>Information Physics &amp; Information Theory</h1>
    <p class="ipi-hero-subtitle">
      Interactive lecture notebooks following the video lectures of
      Dr.&nbsp;Melvin&nbsp;Vopson on Shannon information theory, information entropy,
      and the physical nature of information.
    </p>
    <span class="ipi-hero-tag">study companion · live notebooks · open source</span>
  </div>
</a>

<div class="ipi-card">
  <p class="ipi-card-title">Lecturer</p>
  <h3>Dr. Melvin Vopson — University of Portsmouth</h3>
  <p>
    Associate Professor of Physics whose research explores the
    <em>physical</em> nature of information, the second law of information dynamics,
    and the structural parallels between information theory and physics.
  </p>
  <p>
    🎓 <a href="https://www.port.ac.uk/about-us/structure-and-governance/our-people/our-staff/melvin-vopson">
    Faculty profile at the University of Portsmouth →</a>
  </p>
</div>

<div class="ipi-callout">
  <div class="ipi-callout-icon" aria-hidden="true"></div>
  <div class="ipi-callout-body">
    <strong>Information Physics Institute</strong><br>
    The institute Dr. Vopson founded to research information physics, the
    mass–energy–information equivalence principle, and the second law of
    infodynamics.
    <br>
    🔗 <a href="https://www.informationphysicsinstitute.org/">informationphysicsinstitute.org →</a>
  </div>
</div>

<figure class="ipi-figure">
  <a href="https://www.youtube.com/@informationphysicsinstitute"
     target="_blank" rel="noopener noreferrer"
     aria-label="Visit the Information Physics Institute YouTube channel">
    <img src="_static/entangled.avif"
         alt="Two entangled particles, each resting in a gravity well, connected through the curvature of spacetime">
  </a>
  <figcaption>
    Two entangled particles, each in its own gravity well — the link between them
    persists across the geometry of spacetime. Information physics treats this
    correlation as a <em>physical</em> quantity with measurable consequences.
    <br><small>(image links to the <a href="https://www.youtube.com/@informationphysicsinstitute">Information Physics Institute YouTube channel</a>)</small>
  </figcaption>
</figure>

All lecture content, derivations, worked examples, and presenter screenshots in this series originate from Dr. Vopson's video lectures. The notebooks here serve as a **study aid**: they reproduce the mathematics step by step, add executable Python verifications, and embed key moments from the lecture as screenshots. They are not a substitute for watching the originals — please visit the linked YouTube videos for the full lecture experience.

---

## Lecture Notebooks

| # | Title | Duration | Lecture Video |
|---|---|---|---|
| 1 | [Introduction to Shannon's Information Theory](Video_01/Shannon_Entropy.ipynb) | ~37 min | 📺 [Watch on YouTube →](https://youtu.be/cuCEOOQgCLU) |
| 2 | [Information Entropy — Worked Examples](Video_02/Information_Entropy_Examples.ipynb) | ~21 min | 📺 [Watch on YouTube →](https://youtu.be/DCQpbssp_Sw) |
| 3 | _Coming soon_ | | |

---

## How to Use This Site

### 📖 Read
Every notebook has been pre-executed; all plots, derivations, and numerical outputs are already rendered inline. Just click any title above and scroll.

### 🚀 Run interactively
At the top-right of any notebook page you'll find a **rocket icon (🚀)**. Click it to launch the notebook in a live Jupyter environment built on the fly from this repository:

- **Binder** — free, no account required. First load takes ~30–60s as the environment builds; subsequent loads are fast.
- **Colab** — opens the notebook directly in [Google Colab](https://colab.research.google.com). Loads instantly; requires a Google account.

Either option lets you edit cells, change parameters, and re-run computations live.

### 💻 Run locally
```bash
git clone https://github.com/allpaths/IPI_Learning.git
cd IPI_Learning
pip install -r requirements.txt
jupyter notebook
```

---

## Source & Contributing

The full source — notebooks, lecture transcripts, screenshots, and supporting scripts — lives at
**[github.com/allpaths/IPI_Learning](https://github.com/allpaths/IPI_Learning)**.

Found a typo or have a suggestion? Issues and pull requests are welcome.
