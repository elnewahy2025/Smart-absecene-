import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_USERS } from '../data/mockData';

// Built from fragments so this test does not match itself.
const FORBIDDEN_DEFAULT_CREDENTIAL = 'pass' + 'word' + '123';
const FORBIDDEN_LEAKED_SEED = 'FiazjEUv' + 'aWJhD26H' + 'ZTR9bESu';

function collectSourceFiles(entry: string): string[] {
  if (!fs.existsSync(entry)) return [];
  const stat = fs.statSync(entry);
  if (stat.isFile()) return [entry];

  const files: string[] = [];
  for (const name of fs.readdirSync(entry)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const full = path.join(entry, name);
    const childStat = fs.statSync(full);
    if (childStat.isDirectory()) files.push(...collectSourceFiles(full));
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) files.push(full);
  }
  return files;
}

describe('Hardcoded credential guard', () => {
  it('seeded users do not carry password fields', () => {
    for (const user of INITIAL_USERS) {
      expect(Object.prototype.hasOwnProperty.call(user, 'password')).toBe(false);
    }
  });

  it('the source tree contains no shared default or leaked seed password literals', () => {
    const files = [
      ...collectSourceFiles('src'),
      ...collectSourceFiles('scripts'),
      ...collectSourceFiles('server'),
      'server.ts',
    ].filter((file) => !file.endsWith('.test.ts'));

    const offenders = files.filter((file) => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes(FORBIDDEN_DEFAULT_CREDENTIAL) || content.includes(FORBIDDEN_LEAKED_SEED);
    });

    expect(offenders).toEqual([]);
  });
});
