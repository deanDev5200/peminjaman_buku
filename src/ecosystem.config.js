module.exports = {
  apps: [
    {
      name: 'peminjaman_buku',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4000',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
      },
    },
  ],
};