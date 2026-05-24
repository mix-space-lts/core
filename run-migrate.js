require('C:/Users/User/Documents/Projects/mix-space/core/node_modules/.pnpm/dotenv-expand@13.0.0/node_modules/dotenv-expand/config.js')
const { spawn } = require('node:child_process')

const pnpm = spawn('pnpm', ['vite-node', 'src/migrate.ts'], {
  cwd: 'C:/Users/User/Documents/Projects/mix-space/core/apps/core',
  stdio: 'inherit',
  shell: true,
})
pnpm.on('exit', (code) => process.exit(code))
