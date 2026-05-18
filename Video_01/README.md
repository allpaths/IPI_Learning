# Video 1 — Introduction to Shannon's Information Theory

An instructional Jupyter notebook deriving Shannon Information Entropy from first principles, based on Shannon's 1948 axiomatic approach.

### 📺 [Watch the original lecture on YouTube](https://youtu.be/cuCEOOQgCLU)

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/allpaths/IPI_Learning/HEAD?filepath=Video_01/Shannon_Entropy.ipynb)

## Contents

- **Shannon_Entropy.ipynb** — the interactive notebook
- **notes.txt** — handwritten notes from the presenter
- **Screenshots/** — frames captured from the lecture video

## Topics Covered

1. Shannon's four axioms
2. The information function I(p) = log_b(1/p)
3. Units: bits, nats, trits — and base conversion
4. Deriving Shannon entropy H(X)
5. Boundary cases (p=0, p=1)
6. Continuous entropy
7. Maximum entropy

## Running Locally

From the repo root:

```bash
pip install -r requirements.txt
jupyter notebook Video_01/Shannon_Entropy.ipynb
```
