document.addEventListener('DOMContentLoaded', () => {

  const tabs = document.querySelectorAll('.tabs li[data-tab]');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('is-active', t === tab));
      panels.forEach(p => {
        const active = p.id === target;
        p.classList.toggle('is-active', active);
        if (active) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    });
  });

  const copyBtn = document.getElementById('copy-bibtex');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = document.getElementById('bibtex-block').textContent;
      try {
        await navigator.clipboard.writeText(text);
        const label = copyBtn.querySelector('span:last-child');
        const original = label.textContent;
        label.textContent = 'Copied!';
        setTimeout(() => { label.textContent = original; }, 1500);
      } catch (e) {
        console.warn('Clipboard write failed', e);
      }
    });
  }

});
