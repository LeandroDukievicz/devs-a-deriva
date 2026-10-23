process.env.HOST = '127.0.0.1';
process.env.PORT = '4324';
await import('../dist/server/entry.mjs');
console.log('Lighthouse server ready');
