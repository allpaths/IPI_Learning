# Video 8 — Shannon vs Boltzmann Entropy

The question [Video 7](../Video_07/) derived a relationship for but deliberately left open: granted
$S_{\text{info}} = k_B N H \log_a b$, **are the two entropies the same quantity?**

The lecture goes back into Boltzmann entropy properly — $6N$-dimensional phase space, cells, and a
three-level hierarchy of states — shows that its microstate count is the *same* multinomial
coefficient used for messages, and then lays the two side by side to show that every symbol in that
shared formula refers to something different.

The verdict: connected by a derived relation, but not the same thing.

### 📺 [Watch on YouTube](https://youtu.be/nPj7nbQQUtU)

## Contents

- **Shannon_vs_Boltzmann.ipynb** — the interactive notebook
- **notes.txt** — transcript of the lecture with timestamps
- **Screenshots/** — frames captured from the lecture video

## Topics Covered

1. Recap of Video 7's relation between the two entropies
2. Boltzmann's construction — $6N$-dimensional phase space partitioned into cells
3. Three levels of state: thermodynamic macrostate ⊃ Boltzmann macrostate ⊃ microstate
4. $\Omega_i(E) = N!/(n_1!\cdots n_L!)$ — the same multinomial coefficient as Video 6
5. Why systems approach equilibrium, and why equilibrium is an idealisation
6. The second law by counting: $\Omega_f \geq \Omega_i \Rightarrow dS \geq 0$
7. The full side-by-side comparison table
8. Extensive vs intensive — why $S$ carries $N$ and $k_B$ while $H$ does not
9. The disagreement with Sabine Hossenfelder, reported with its sourcing flagged

## Running Locally

From the repo root:

```bash
pip install -r requirements.txt
jupyter notebook Video_08/Shannon_vs_Boltzmann.ipynb
```
