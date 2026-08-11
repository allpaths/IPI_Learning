# Video 6 — The Information Microstates

Where $\Omega$ finally earns the name it was given in [Video 3](../Video_03/). The lecture counts the
distinct messages a set of characters can form, postulates that this count *is* the number of
**information microstates**, and connects it to Boltzmann's $S = k_B \log \Omega$.

Two routes to the same number: the **multinomial coefficient** for one fixed letter composition, and
the **multinomial theorem** for all compositions at once, collapsing to $\Omega_{\text{tot}} = U^N$.

### 📺 [Watch on YouTube](https://youtu.be/gaSykBTbfsU)

## Contents

- **Information_Microstates.ipynb** — the interactive notebook
- **notes.txt** — transcript of the lecture with timestamps
- **Screenshots/** — frames captured from the lecture video

## Topics Covered

1. Macrostates, microstates, and Boltzmann's $S = k_B \log \Omega$
2. Turning probabilities into occurrence counts, $n_j = p_j N$
3. The postulate — distinct arrangements of a message *are* its microstates
4. The multinomial coefficient $\Omega = N!\,/\,(n_1!\,n_2!\cdots n_U!)$
5. The multinomial theorem and the shortcut $\Omega_{\text{tot}} = U^{\,N}$
6. The worked $\texttt{AAB}$ example: $\Omega = 3$, $\Omega_{\text{tot}} = 8$, verified both ways
7. Why $U^N$ is Video 3's $U^m$ at $m = N$ — a message is just the largest block
8. Stirling's approximation closing the loop: $\log_2 \Omega \approx N \cdot H(\mathcal{X})$

## Running Locally

From the repo root:

```bash
pip install -r requirements.txt
jupyter notebook Video_06/Information_Microstates.ipynb
```
