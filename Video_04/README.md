# Video 4 — Information Entropy of m-Blocks: Worked Examples

Applies the $m$-block machinery from [Video 3](../Video_03/) to a concrete message: constructing a
set of $m$-blocks, counting it with $N_m = 1 + (N-m)/SS$, and measuring its information entropy.

Uses the same 10-bit message as [Video 2](../Video_02/), so the block result and the
single-character result can be compared directly.

### 📺 [Watch on YouTube](https://youtu.be/GNV5RXf_uSA)

## Contents

- **Information_Entropy_of_m_blocks_Examples.ipynb** — the interactive notebook
- **notes.txt** — transcript of the lecture with timestamps
- **Screenshots/** — frames captured from the lecture video

## Topics Covered

1. Constructing a set of $m$-blocks by sliding a window with step size $SS$
2. The counting formula $N_m = 1 + (N-m)/SS$, and when it needs a floor
3. Two step sizes on one message — $SS = m$ (tiling) versus $SS = 1$ (overlapping)
4. The block alphabet $\Omega = U^m$ and its probability distribution
5. $H(\mathcal{X})^{(m)} = 1.53$ bits per 2-block against a 2-bit ceiling
6. Total information content, and comparing it with the single-character result
7. Why digital encoding uses bytes — $\Omega = 2^8 = 256$ states

## Running Locally

From the repo root:

```bash
pip install -r requirements.txt
jupyter notebook Video_04/Information_Entropy_of_m_blocks_Examples.ipynb
```
