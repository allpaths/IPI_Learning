# Video 7 — Link Between Shannon and Boltzmann Entropies

The step [Video 6](../Video_06/) set up but left for later. Taking the logarithm of the multinomial
coefficient and applying Stirling's approximation makes Shannon's $H$ fall out of Boltzmann's
microstate count:

$$\log_b \Omega_{\text{info}} = N \cdot H(\mathcal{X}) \qquad\Longrightarrow\qquad \Omega_{\text{info}} = b^{\,N \cdot H(\mathcal{X})}$$

and through Boltzmann, $S_{\text{info}} = k_B \cdot N \cdot H(\mathcal{X}) \cdot \log_a b$.

The lecture also carries an **erratum**: checking the result against Video 6's $U^N$ surfaced a
missing $\log_2 U$ base-conversion factor in the lecturer's published papers and book. It equals 1
in binary, so published binary results are unaffected.

### 📺 [Watch on YouTube](https://youtu.be/GFM3X5EClfY)

## Contents

- **Shannon_and_Boltzmann.ipynb** — the interactive notebook
- **notes.txt** — transcript of the lecture with timestamps
- **Screenshots/** — frames captured from the lecture video

## Topics Covered

1. Recap of Video 6 — the multinomial coefficient and $S = k_B \log \Omega$
2. Taking $\log_b$ of the coefficient and splitting it into logs of factorials
3. Stirling's approximation, and why the linear term cancels regardless of base
4. The result $\log_b \Omega_{\text{info}} = N \cdot H(\mathcal{X})$
5. Inverting to $\Omega_{\text{info}} = b^{\,N \cdot H(\mathcal{X})}$
6. Why it is asymptotic — per-character convergence vs. the count itself
7. Setting $b = U$ to recover $U^N$, and the erratum this surfaced
8. $S_{\text{info}} = k_B N H \log_a b$, and what the relation does and does not settle

## Running Locally

From the repo root:

```bash
pip install -r requirements.txt
jupyter notebook Video_07/Shannon_and_Boltzmann.ipynb
```
