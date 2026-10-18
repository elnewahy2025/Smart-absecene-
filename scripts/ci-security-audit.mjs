import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const isCI = process.env.CI === 'true';

console.log('🔒 Starting Security & Compliance Audit...');
console.log(`📂 Git root: ${gitRoot}`);

let failed = false;

// Check 1: No committed .env file in source control
try {
  const trackedEnv = execSync('git ls-files .env', { cwd: gitRoot, encoding: 'utf8' }).trim();
  if (trackedEnv === '.env') {
    console.error('FAIL: .env file is committed to Git! Remove it from source control.');
    failed = true;
  } else {
    console.log('PASS: No committed .env file in source control.');
  }
} catch (err) {
  console.error('FAIL: Could not check tracked files in git:', err.message);
  failed = true;
}

// Check 2: Production environment template (.env.example) exists
if (fs.existsSync(path.join(gitRoot, '.env.example'))) {
  console.log('PASS: Production environment template (.env.example) exists.');
} else {
  console.error('FAIL: .env.example is missing from repository root.');
  failed = true;
}

// Check 3: TypeScript compile check
try {
  execSync('npm run lint', { cwd: gitRoot, stdio: 'pipe' });
  console.log('PASS: TypeScript compile check passed.');
} catch (err) {
  console.error('FAIL: TypeScript compilation (npm run lint) failed:');
  console.error(err.stdout?.toString() || err.stderr?.toString() || err.message);
  failed = true;
}

// Check 4: Deep secret scan across codebase
const secretPatterns = [
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'GitHub Personal Token', regex: /ghp_[0-9A-Za-z]{36}/ },
  { name: 'GitHub Fine-grained PAT', regex: /github_pat_[0-9A-Za-z_]{82}/ },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Stripe Live Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
  { name: 'Private RSA/SSH Key', regex: /BEGIN (?:RSA )?PRIVATE KEY/ },
  { name: 'Hardcoded Gemini API Key in code', regex: /GEMINI_API_KEY\s*=\s*["'][A-Za-z0-9_-]{20,}["']/ },
];

const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.system_generated']);
const ignoredFileExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.docx', '.lock']);

const findings = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;

    // Local env files are gitignored and expected to contain credentials; never scan them.
    if (entry.name === '.env' || (entry.name.startsWith('.env.') && !entry.name.endsWith('.example'))) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(gitRoot, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ignoredFileExtensions.has(ext)) continue;
      if (entry.name.includes('.example.')) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          for (const pattern of secretPatterns) {
            if (pattern.regex.test(line)) {
              findings.push({
                file: relativePath,
                line: idx + 1,
                type: pattern.name,
                snippet: line.trim().substring(0, 100),
              });
            }
          }
        });
      } catch {
        // Skip unreadable files
      }
    }
  }
}

scanDirectory(gitRoot);

if (findings.length > 0) {
  console.error('FAIL: Secrets detected in repository files:');
  findings.forEach((f) => {
    console.error(`  - [${f.type}] ${f.file}:${f.line} -> ${f.snippet}`);
  });
  failed = true;
} else {
  console.log('PASS: No secrets detected in codebase.');
}

if (failed) {
  console.error('\n❌ Security audit failed.');
  process.exit(1);
}

console.log('\n✅ All security and compliance audit checks passed successfully.');
if (isCI) {
  console.log('CI security audit passed.');
}
