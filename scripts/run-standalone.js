const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { loadEnvFile } = require('./load-env-file');

const projectRoot = path.resolve(__dirname, '..');
const serverPath = path.join(projectRoot, '.next', 'standalone', 'server.js');

if (!fs.existsSync(serverPath)) {
  console.error('Standalone server not found at:', serverPath);
  console.error('Build it first with "npm run build" (requires output: "standalone" in next.config.ts).');
  process.exit(1);
}

// Same env file `npm start` uses, so behavior stays identical.
const envFileValues = loadEnvFile(path.join(projectRoot, '.env.production'));
const env = { ...process.env, ...envFileValues };

// The standalone server reads PORT and HOSTNAME (not HOST).
if (env.HOST && !env.HOSTNAME) {
  env.HOSTNAME = env.HOST;
}

const child = spawn(process.execPath, [serverPath], {
  cwd: projectRoot,
  stdio: 'inherit',
  env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
