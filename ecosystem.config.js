module.exports = {
  apps: [
    {
      name: 'peminjaman_buku',
      cwd: 'C:/peminjaman_buku',
      script: 'scripts/run-next.js',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        HOST: '0.0.0.0',
      },
    },
  ],
};