const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const command = args[0] || 'dev';
const envFileName = command === 'start' ? '.env.production' : '.env.local';
const envPath = path.join(projectRoot, envFileName);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key) {
      values[key] = value;
    }
  }

  return values;
}

const envFileValues = loadEnvFile(envPath);
const env = { ...process.env, ...envFileValues };
const commandArgs = args.slice(1);
const nextCommandArgs = [command, ...commandArgs];

if (env.PORT && !nextCommandArgs.includes('--port')) {
  nextCommandArgs.push('--port', env.PORT);
}

if (env.HOST && !nextCommandArgs.includes('--hostname')) {
  nextCommandArgs.push('--hostname', env.HOST);
}

const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), ...nextCommandArgs], {
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
