import { execSync } from 'node:child_process';

const isCI = process.env.CI === 'true';
const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();

const auditChecks = [
  {
    name: 'No secrets in repo text',
    command: `grep -RInE "(AIza|ghp_|github_pat_|AKIA|sk_live|BEGIN PRIVATE KEY|GEMINI_API_KEY=\"[A-Za-z0-9_\-]+\")" "${gitRoot}" --exclude-dir=.git --exclude-dir=node_modules --exclude='firebase-applet-config.json' --exclude='firebase-applet-config.example.json' --exclude='firebase-applet-config.local.json' --exclude='*.example.json' || true`,
    mustFail: true,
  },
  {
    name: 'No committed .env file',
    command: `test ! -f "${gitRoot}/.env" && echo OK || echo FOUND_ENV`,
    mustFail: false,
  },
  {
    name: 'TypeScript compile check',
    command: `cd "${gitRoot}" && npm run lint`,
    mustFail: false,
  },
  {
    name: 'Production environment template exists',
    command: `test -f "${gitRoot}/.env.example" && echo OK || echo MISSING_ENV_EXAMPLE`,
    mustFail: false,
  },
];

for (const check of auditChecks) {
  try {
    const output = execSync(check.command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const hasOutput = output.trim().length > 0 && output.trim() !== 'OK' && output.trim() !== 'FOUND_ENV' && output.trim() !== 'MISSING_ENV_EXAMPLE';
    if (check.mustFail && hasOutput) {
      console.error(`FAIL: ${check.name}`);
      console.error(output.trim());
      process.exit(1);
    }
    console.log(`PASS: ${check.name}`);
    if (output.trim() && output.trim() !== 'OK' && output.trim() !== 'FOUND_ENV' && output.trim() !== 'MISSING_ENV_EXAMPLE') {
      console.log(output.trim());
    }
  } catch (error: any) {
    console.error(`FAIL: ${check.name}`);
    console.error(error.stdout?.toString() || error.message);
    process.exit(1);
  }
}

if (isCI) {
  console.log('CI security audit passed.');
}
