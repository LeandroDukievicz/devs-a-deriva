module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist/client',
      staticPort: 4321,
      numberOfRuns: 3,
      url: [
        'http://localhost:4321/categorias/tech/',
        'http://localhost:4321/devs/',
        'http://localhost:4321/manifesto/',
        'http://localhost:4321/termos/',
      ],
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci-report',
    },
  },
};
