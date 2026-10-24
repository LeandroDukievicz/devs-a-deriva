(() => {
  const introKey = 'intro_last_shown';
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  try {
    const largeScreen = window.matchMedia('(min-width: 600px) and (min-height: 600px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadyShown = localStorage.getItem(introKey) === today;

    if (largeScreen && !reducedMotion && !alreadyShown) {
      document.documentElement.dataset.dailyIntro = 'pending';
      window.setTimeout(() => {
        const root = document.documentElement;
        if (root.dataset.dailyIntro !== 'pending' || root.dataset.dailyIntroReady === 'true') return;
        try {
          localStorage.setItem(introKey, today);
        } catch {
          // Keep the fail-open behavior when storage is unavailable.
        }
        root.removeAttribute('data-daily-intro');
        window.dispatchEvent(new CustomEvent('dailyIntroComplete'));
      }, 12000);
    }
  } catch {
    // If storage or media queries are unavailable, open the site without the intro.
  }
})();
