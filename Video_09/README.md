# Video 9 — Landauer's Principle and the M/E/I Equivalence Principle

Where the series lands. Every notebook since [Video 6](../Video_06/) has pointed here.

Three claims of escalating boldness:

1. **Landauer's principle** — erasing one bit costs at least $k_B T \ln 2$ of energy
2. **Mass–energy–information equivalence** — a stored bit therefore has mass,
   $m_{\text{bit}} = k_B T \ln 2 / c^2$ ($\approx 3.19 \times 10^{-38}$ kg at room temperature)
3. **Information as a fifth state of matter** — and possibly the substrate everything else emerges
   from

These sit at very different levels of scientific standing. The notebook marks that boundary
explicitly: Landauer is textbook physics and experimentally confirmed; M/E/I is the lecturer's own
published proposal, resting on an additional assumption; the fifth-state claim is speculation built
on that.

### 📺 [Watch on YouTube](https://youtu.be/7UcpUISMxtQ)

## Contents

- **Landauer_and_MEI.ipynb** — the interactive notebook
- **notes.txt** — transcript of the lecture with timestamps
- **Screenshots/** — frames captured from the lecture video

## Topics Covered

1. Landauer's 1961 proposal — information as a physical entity; why erasure is the dissipative operation
2. Deriving $\Delta Q \geq k_B T \ln 2$ from the second law applied to total entropy
3. The M/E/I chain: $E = mc^2$ and $E = k_B T \ln 2$ giving $m_{\text{bit}} = k_B T \ln 2 / c^2$
4. Scale — a bit is ~29 million times lighter than an electron; a terabyte weighs $\sim10^{-25}$ kg
5. The $T \to 0$ limit, and information being unable to exist at absolute zero
6. Information as a fifth state of matter
7. What follows from what — established vs proposed vs speculative

## Running Locally

From the repo root:

```bash
pip install -r requirements.txt
jupyter notebook Video_09/Landauer_and_MEI.ipynb
```
