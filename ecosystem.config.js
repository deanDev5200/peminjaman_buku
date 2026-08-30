module.exports = {
  apps: [
    {
      name: 'peminjaman_buku',
      cwd: 'C:/peminjaman_buku',
      script: 'node',
      args: 'scripts/run-next.js start',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        HOST: '0.0.0.0',
      },
    },
  ],
};