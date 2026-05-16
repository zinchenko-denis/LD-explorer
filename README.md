# LD-Explorer

Interactive 3D/2D explorer for the Lattice-Dessin model.

**1728: The Standard Model from X₀(6)**

All Standard Model masses and mixing parameters derived from the unique dessin d'enfant of the modular curve X₀(6), with zero continuous free parameters.

## Paper

- **Title:** 1728: The Standard Model from X₀(6)
- **Author:** Denis D. Zinchenko
- **Pages:** 73
- **DOI (v1728, published):** [10.5281/zenodo.19520240](https://doi.org/10.5281/zenodo.19520240)
- **DOI (v9):** to be assigned on Zenodo deposit (May 2026)
- **Published:** 12 April 2026 (Cosmonautics Day)

## Key Results

- **508/508** Python verification checks (17 tiers) + 91 Sage checks (v1728 baseline)
- **18 Tier A** predictions, 0 free parameters, 58+ observables
- **sin²θ₁₂ = 4/13** (+0.17σ, JUNO 2025 compatible)
- **sinδ = −1** (maximal CP violation, δ = 270°)
- **sin²θ_W = 3/13** (tree-level Weinberg angle, NLO +1.9σ)
- **λ_CKM = 9/40** from Kirchhoff tree count K = 40
- **Golden bridge:** q₅ = q_φ·q₃ − 3
- **CRT Grand Unification:** L = 3I − A_dir − σ₀⁻¹

### Post-v1728 (v9-snapshot, May 2026)

- **Form A triply determined:** self-energy Σ = −L = −7 fixed by three
  independent routes (anchor Fricke-pair, Grothendieck whole-eigensummand,
  Fricke-pair log-residue). X.247c [CONJ HEADLINE] preserved.
- **Four routes to (d₁, d₂) = (2, 3):** Catalan, NCG/Connes, Ihara,
  Mihailescu — the unique pair satisfying four independent equations.
- **θ₂₃ orbit pair {81/145, 64/145}** with structural / NuFIT-active
  branches separated; status promoted [DER]→[THM-arith] via Catalan
  octant (X.340b, S354).
- **Aut(dessin, O.1) = {e}** rigidity (X.355b, S375).
- **Cuspal Arithmetic Identity** (j+N)/(j+L) = 1 − 1/(j+L) (X.354).

## Live Demo

[https://zinchenko-denis.github.io/LD-explorer/](https://zinchenko-denis.github.io/LD-explorer/)

## Tech Stack

Vite + React + TypeScript + Three.js + recharts + shadcn/ui

## Build

```bash
npm install
npx tsc -b && npx vite build
```

## Related

- [LD-supplementary](https://github.com/zinchenko-denis/LD-supplementary) — 508 verification checks, companion, index
