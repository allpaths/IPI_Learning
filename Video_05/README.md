# Video 5 — Information Entropy of m-Blocks of a Genome

Applies the $m$-block machinery to a genomic sequence over the nucleotide alphabet
$\{A, C, G, T\}$, taking **codons** ($m = 3$) as the natural block size. Part 3's counting
relationship lands exactly on a fact of biology: $\Omega = 4^3 = 64$, the size of the genetic code.

Also opens with the lecturer's own correction to [Video 4](../Video_04/) — blocking increases total
information only when the step size is smaller than the block.

### 📺 [Watch on YouTube](https://youtu.be/KuE75212feQ)

## Contents

- **Information_Entropy_of_a_Genome.ipynb** — the interactive notebook
- **notes.txt** — transcript of the lecture with timestamps
- **Screenshots/** — frames captured from the lecture video

## Topics Covered

1. The correction to Part 4 — overlap ($SS < m$) is what inflates the total, not blocking
2. The genomic alphabet $\{A, C, G, T\}$, $U = 4$, and the 2-bit encoding
3. An 18-nucleotide worked example: $H(\mathcal{X}) = 1.878$ bits, $\text{Inf} = 33.8$ bits
4. Why block at all — single characters ignore correlations between neighbours
5. Codons as $m$-blocks: $\Omega = 4^3 = 64$, of which 61 code amino acids and 3 are stop codons
6. $H(\mathcal{X})^{(m)}_{\max} = 6$ bits per codon
7. Generating 16 codons at $SS = 1$ and measuring $H^{(m)} = 3.75$ bits, $\text{Inf} = 60$ bits
8. Normalising per nucleotide, and why 16 samples cannot measure a 64-state alphabet

## Running Locally

From the repo root:

```bash
pip install -r requirements.txt
jupyter notebook Video_05/Information_Entropy_of_a_Genome.ipynb
```
