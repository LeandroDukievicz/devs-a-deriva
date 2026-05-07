module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      staticPort: 4321,
      numberOfRuns: 3,
      url: [
        'http://localhost:4321/categorias/tech/',
        'http://localhost:4321/devs/',
        'http://localhost:4321/manifesto/',
      ],
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci-report',
    },
  },
};
