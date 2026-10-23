module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/start-lighthouse.mjs',
      startServerReadyPattern: 'Lighthouse server ready',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      url: [
        'http://127.0.0.1:4324/',
        'http://127.0.0.1:4324/page/2/',
        'http://127.0.0.1:4324/categorias/tech/',
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
