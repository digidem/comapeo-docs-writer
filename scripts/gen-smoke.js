#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const TEST_ROOT = path.join(ROOT, 'content', '__codex_smoke__');
const SECTION_DIR = path.join(TEST_ROOT, '01_smoke_section');

function cleanup() {
  if (fs.existsSync(TEST_ROOT)) {
    fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  }
}

function main() {
  cleanup();
  fs.mkdirSync(SECTION_DIR, { recursive: true });
  const relSection = path.relative(ROOT, SECTION_DIR);
  console.log(`[gen:smoke] Creating dry-run version for ${relSection}`);

  const result = spawnSync('node', [path.join('scripts', 'gen.js'), '--dry-run', relSection], { stdio: 'inherit' });
  if (result.status !== 0) {
    cleanup();
    console.error('[gen:smoke] gen.js returned non-zero status:', result.status);
    process.exit(result.status || 1);
  }

  const versionDir = path.join(SECTION_DIR, 'v1');
  const indexPath = path.join(versionDir, 'index.md');
  const referencedPath = path.join(versionDir, 'referenced.md');
  if (!fs.existsSync(versionDir) || !fs.existsSync(indexPath) || !fs.existsSync(referencedPath)) {
    cleanup();
    console.error('[gen:smoke] Expected v1/index.md and referenced.md were not created.');
    process.exit(1);
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!/^# Smoke Section/m.test(indexContent)) {
    cleanup();
    console.error('[gen:smoke] index.md does not contain the expected section title.');
    process.exit(1);
  }

  console.log('[gen:smoke] PASS - scaffold created successfully.');
  cleanup();
}

main();
