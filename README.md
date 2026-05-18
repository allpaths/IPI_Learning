# IPI Learning — Information Physics & Information Theory

Interactive Jupyter notebooks following the video lecture series by **[Dr. Melvin Vopson](https://www.port.ac.uk/about-us/structure-and-governance/our-people/our-staff/melvin-vopson)** of the **[University of Portsmouth](https://www.port.ac.uk/)** on Shannon information theory, information entropy, and information physics.

> 🌐 **Published site:** [https://allpaths.github.io/IPI_Learning/](https://allpaths.github.io/IPI_Learning/)
>
> The published site has a clean reading view with a sidebar TOC, prev/next navigation, and one-click launch buttons for Binder and Google Colab on every notebook.

All lecture content originates with Dr. Vopson; this repository contains notebooks that follow along step by step, add executable Python verifications, and embed screenshots from the lectures as study aids.

## Videos

| # | Topic | Folder | YouTube |
|---|---|---|---|
| 1 | [Introduction to Shannon's Information Theory](Video_01/) | `Video_01/` | [Watch →](https://youtu.be/cuCEOOQgCLU) |
| 2 | [Information Entropy — Worked Examples](Video_02/) | `Video_02/` | [Watch →](https://youtu.be/DCQpbssp_Sw) |
| 3 | _TBD_ | `Video_03/` | |
| 4 | _TBD_ | `Video_04/` | |
| 5 | _TBD_ | `Video_05/` | |
| 6 | _TBD_ | `Video_06/` | |
| 7 | _TBD_ | `Video_07/` | |
| 8 | _TBD_ | `Video_08/` | |
| 9 | _TBD_ | `Video_09/` | |

## Running Locally

```bash
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
jupyter notebook
```

Then open any `Video_NN/` folder and launch its notebook.

## Building the Site Locally

To preview the published Jupyter Book site before pushing:

```bash
pip install jupyter-book
jupyter-book build .
# open _build/html/index.html
```

The site is rebuilt automatically on every push to `master` by [`.github/workflows/deploy-book.yml`](.github/workflows/deploy-book.yml).

## Repo Layout

```
IPI_Learning/
├── README.md                         ← this file (developer-facing)
├── index.md                          ← landing page for the published site
├── _config.yml                       ← Jupyter Book configuration
├── _toc.yml                          ← published site table of contents
├── requirements.txt                  ← shared Python dependencies
├── .github/workflows/deploy-book.yml ← builds and deploys the site to GitHub Pages
├── scripts/
│   ├── grab_screenshots.py           ← pulls JPG frames from a video at given timestamps
│   └── (Video_02/transcribe.py)      ← whisper-based transcription helper, lives next to its video
├── Video_01/
│   ├── README.md
│   ├── Shannon_Entropy.ipynb
│   ├── notes.txt
│   └── Screenshots/
├── Video_02/
│   ├── README.md
│   ├── Information_Entropy_Examples.ipynb
│   ├── transcribe.py
│   ├── notes.txt
│   └── Screenshots/
└── ... (Video_03 through Video_09)
```
