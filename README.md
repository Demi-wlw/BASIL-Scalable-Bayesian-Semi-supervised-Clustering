# BASIL project page

Source for the public project page accompanying the BASIL paper
(ICML 2026). Single-page static site, no build step.

## Local preview

```sh
cd BASIL_web
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Layout

See `PLAN.md` for the full design plan, including the three-act
animated pipeline demo (section 4.2 and 7) and the interactive
hyperparameter explorer (section 4.7 and 8).

```
index.html                single-page entry
assets/
  css/style.css           layout + explorer panel styling
  js/main.js              tabs, copy button
  js/explorer.js          warmup_prop, wprior, dd_0 panels
  video/                  basil_demo.mp4, basil_demo.webm (generated)
  images/                 hero, demo, method, results, logos
  pdf/                    BASIL_ICML2026.pdf
scripts/
  render_demo.py          synthetic data + BASIL run + frame encoding
```

## Assets to drop in before deploying

- `assets/pdf/BASIL_ICML2026.pdf` — the camera-ready PDF.
- `assets/video/basil_demo.mp4` and `.webm` — produced by
  `scripts/render_demo.py` (TBD).
- `assets/images/demo/final_frame.png` — last frame of the demo,
  doubles as the Open Graph image (1200x630 recommended).
- `assets/images/method/graphical_model.png` — exported from the paper.
- `assets/images/results/*.png` — copy across from `BSSC_ICML2026/pic/`:
  - `SSCsimGau5000_r0.2_plot.png`
  - `wprior_comparison_fixed_w_vs_wdfs_mnist50.png`
  - `digits_barplot_20pct_supervision.png`
  - `digits_barplot_50pct_supervision.png`
  - `CPRD_bubbles.png`

## Deploy

GitHub Pages on `main`. Set the URL in `index.html` Open Graph tags
once the final domain is known.
