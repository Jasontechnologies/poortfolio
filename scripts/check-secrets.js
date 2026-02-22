#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PATTERNS = [
  { name: 'SUPABASE_SERVICE_ROLE_KEY', regex: /SUPABASE_SERVICE_ROLE_KEY/i },
  { name: 'PRIVATE KEY-----', regex: /PRIVATE KEY-----/i },
  { name: 'BEGIN RSA PRIVATE KEY', regex: /BEGIN RSA PRIVATE KEY/i },
  { name: 'TURNSTILE_SECRET_KEY', regex: /TURNSTILE_SECRET_KEY/i },
  { name: 'OPENAI_API_KEY', regex: /OPENAI_API_KEY/i },
  { name: 'STRIPE_SECRET', regex: /STRIPE_SECRET/i }
];

function getStagedFiles() {
  const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('check:secrets: no staged files to scan.');
    return;
  }

  let hasViolation = false;

  for (const relativeFile of stagedFiles) {
    const absolutePath = path.resolve(process.cwd(), relativeFile);
    const content = readTextFile(absolutePath);

    if (content === null) {
      continue;
    }

    for (const pattern of PATTERNS) {
      if (pattern.regex.test(content)) {
        hasViolation = true;
        console.error(
          `check:secrets: blocked potential secret pattern "${pattern.name}" in staged file "${relativeFile}".`
        );
      }
    }
  }

  if (hasViolation) {
    console.error('check:secrets: remove secrets from staged files before committing/pushing.');
    process.exit(1);
  }

  console.log('check:secrets: passed.');
}

main();
