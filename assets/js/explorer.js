document.addEventListener('DOMContentLoaded', () => {

  const LANCZOS_G = 7;
  const LANCZOS_C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];

  function lgamma(x) {
    if (x < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
    }
    x -= 1;
    let a = LANCZOS_C[0];
    const t = x + LANCZOS_G + 0.5;
    for (let i = 1; i < 9; i++) a += LANCZOS_C[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  function logBeta(c, d) { return lgamma(c) + lgamma(d) - lgamma(c + d); }

  function betaPdf(x, c, d) {
    if (x <= 0 || x >= 1) return NaN;
    const logf = (c - 1) * Math.log(x) + (d - 1) * Math.log(1 - x) - logBeta(c, d);
    return Math.exp(logf);
  }

  function gammaPdfShape1(x, beta) {
    if (x < 0) return 0;
    return beta * Math.exp(-beta * x);
  }

  function linspace(a, b, n) {
    const out = new Array(n);
    const step = (b - a) / (n - 1);
    for (let i = 0; i < n; i++) out[i] = a + i * step;
    return out;
  }

  function clampPdf(ys, maxY) {
    return ys.map(y => (isFinite(y) && y <= maxY) ? y : maxY);
  }

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const slider = document.getElementById(chip.dataset.target);
      if (!slider) return;
      slider.value = chip.dataset.value;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  function rafBind(slider, handler) {
    let raf = null;
    slider.addEventListener('input', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        handler(parseFloat(slider.value));
      });
    });
    handler(parseFloat(slider.value));
  }

  const MAX_ITER = 1000;

  const warmupSlider = document.getElementById('warmup-slider');
  const warmupValue = document.getElementById('warmup-value');
  const warmupLeft = document.getElementById('warmup-left');
  const warmupRight = document.getElementById('warmup-right');
  const warmupCaption = document.getElementById('warmup-caption');

  function updateWarmup(p) {
    const leftPct = (100 * p).toFixed(1) + '%';
    const rightPct = (100 * (1 - p)).toFixed(1) + '%';
    warmupLeft.style.width = leftPct;
    warmupRight.style.width = rightPct;
    warmupValue.textContent = p.toFixed(2);
    warmupSlider.setAttribute('aria-valuetext',
      `${p.toFixed(2)}, ${p === 0 ? 'pure w+FS mode' : p === 1 ? 'pure 1+D+FS mode' : 'phased schedule'}`);
    const nWarm = Math.round(p * MAX_ITER);
    if (p === 0) {
      warmupCaption.innerHTML = `Assuming total iterations is <strong>${MAX_ITER}</strong>, all <strong>${MAX_ITER}</strong> iterations run pure <code>w+FS</code>. Adaptive weights from the first iteration, KL never engages.`;
    } else if (p === 1) {
      warmupCaption.innerHTML = `Assuming total iterations is <strong>${MAX_ITER}</strong>, all <strong>${MAX_ITER}</strong> iterations run pure <code>1+D+FS</code>. Fixed unit weights and KL throughout; adaptive weight inference never runs.`;
    } else {
      warmupCaption.innerHTML = `Assuming total iterations is <strong>${MAX_ITER}</strong>, the first <strong>${nWarm}</strong> iterations use <code>1+D+FS</code>, then BASIL switches to <code>w+FS</code> for the remaining <strong>${MAX_ITER - nWarm}</strong>.`;
    }
  }
  rafBind(warmupSlider, updateWarmup);

  const wpriorSlider = document.getElementById('wprior-slider');
  const wpriorValue = document.getElementById('wprior-value');
  const wpriorMean = document.getElementById('wprior-mean');
  const wpriorFixed = document.getElementById('wprior-fixed');
  const wpriorChartEl = document.getElementById('wprior-chart');

  const W_XS = linspace(0, 5, 200);

  let wpriorChartInited = false;

  function updateWprior(beta) {
    const ys = W_XS.map(x => gammaPdfShape1(x, beta));
    const mean = 1 / beta;
    wpriorValue.textContent = beta.toFixed(2);
    wpriorMean.textContent = mean.toFixed(3);
    wpriorFixed.textContent = mean.toFixed(3);
    wpriorSlider.setAttribute('aria-valuetext',
      `wprior ${beta.toFixed(2)}, prior mean ${mean.toFixed(3)}`);
    const trace = {
      x: W_XS, y: ys, type: 'scatter', mode: 'lines', fill: 'tozeroy',
      line: { color: '#2c5f8d', width: 2 },
      fillcolor: 'rgba(44,95,141,0.18)',
      hovertemplate: 'w=%{x:.2f}<br>p(w)=%{y:.3f}<extra></extra>',
      name: ''
    };
    const layout = {
      margin: { l: 36, r: 12, t: 8, b: 32 },
      xaxis: { title: { text: 'w', font: { size: 12 } }, range: [0, 5], zeroline: false },
      yaxis: { title: { text: 'p(w)', font: { size: 12 } }, range: [0, Math.min(5, beta * 1.1)], zeroline: false },
      showlegend: false,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent'
    };
    const config = { displayModeBar: false, responsive: true };
    if (!wpriorChartInited) {
      Plotly.newPlot(wpriorChartEl, [trace], layout, config);
      wpriorChartInited = true;
    } else {
      Plotly.react(wpriorChartEl, [trace], layout, config);
    }
  }

  const fspriorSlider = document.getElementById('fsprior-slider');
  const fspriorValue = document.getElementById('fsprior-value');
  const fspriorMean = document.getElementById('fsprior-mean');
  const fspriorInterp = document.getElementById('fsprior-interpretation');
  const fspriorChartEl = document.getElementById('fsprior-chart');

  const D_XS = linspace(0.005, 0.995, 200);

  let fspriorChartInited = false;

  function updateFsprior(logFsprior) {
    const fsprior = Math.pow(10, logFsprior);
    const c0 = 0.5;
    const ys = clampPdf(D_XS.map(x => betaPdf(x, c0, fsprior)), 8);
    const mean = c0 / (c0 + fsprior);
    fspriorValue.textContent = fsprior.toFixed(fsprior < 1 ? 3 : 2);
    fspriorMean.textContent = mean.toFixed(3);
    let interp;
    if (fsprior < 0.5) interp = 'weak';
    else if (fsprior < 5) interp = 'moderate';
    else interp = 'strong';
    fspriorInterp.textContent = interp;
    fspriorSlider.setAttribute('aria-valuetext',
      `fsprior ${fsprior.toFixed(3)}, prior mean ${mean.toFixed(3)}, ${interp}`);
    const trace = {
      x: D_XS, y: ys, type: 'scatter', mode: 'lines', fill: 'tozeroy',
      line: { color: '#e88c30', width: 2 },
      fillcolor: 'rgba(232,140,48,0.18)',
      hovertemplate: 'γ=%{x:.2f}<br>p(γ)=%{y:.3f}<extra></extra>',
      name: ''
    };
    const layout = {
      margin: { l: 36, r: 12, t: 8, b: 32 },
      xaxis: { title: { text: 'γ_kd', font: { size: 12 } }, range: [0, 1], zeroline: false },
      yaxis: { title: { text: 'p(γ)', font: { size: 12 } }, range: [0, 8], zeroline: false },
      showlegend: false,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent'
    };
    const config = { displayModeBar: false, responsive: true };
    if (!fspriorChartInited) {
      Plotly.newPlot(fspriorChartEl, [trace], layout, config);
      fspriorChartInited = true;
    } else {
      Plotly.react(fspriorChartEl, [trace], layout, config);
    }
  }

  function whenPlotlyReady(cb) {
    if (typeof Plotly !== 'undefined') return cb();
    const start = Date.now();
    const id = setInterval(() => {
      if (typeof Plotly !== 'undefined') { clearInterval(id); cb(); }
      else if (Date.now() - start > 5000) { clearInterval(id); console.warn('Plotly failed to load'); }
    }, 50);
  }

  whenPlotlyReady(() => {
    rafBind(wpriorSlider, updateWprior);
    rafBind(fspriorSlider, updateFsprior);
  });

});
