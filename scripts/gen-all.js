#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');

const COLORS = {
  reset: '\u001b[0m',
  orange: '\u001b[38;5;214m',
  blue: '\u001b[36m',
  green: '\u001b[32m',
  red: '\u001b[31m',
  magenta: '\u001b[35m'
};
const DEBUG = Boolean(process.env.DEBUG && !['0', 'false', 'off', ''].includes(String(process.env.DEBUG).toLowerCase()));
const TAG = `${COLORS.orange}◼ GEN:ALL${COLORS.reset}`;

function logInfo(message) {
  console.log(`${TAG} ${message}`);
}

function logSuccess(message) {
  console.log(`${TAG} ${COLORS.green}✓${COLORS.reset} ${message}`);
}

function logWarn(message) {
  console.warn(`${TAG} ${COLORS.red}⚠${COLORS.reset} ${message}`);
}

function logDebug(message) {
  if (DEBUG) {
    console.log(`${TAG} ${COLORS.magenta}debug${COLORS.reset} ${message}`);
  }
}

function listSections() {
  const topics = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{2}_/.test(d.name))
    .map(d => path.join(CONTENT_ROOT, d.name))
    .sort();
  const sections = [];
  for (const t of topics) {
    const secs = fs.readdirSync(t, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^\d{2}_/.test(d.name))
      .map(d => path.join(t, d.name))
      .sort();
    sections.push(...secs);
  }
  return sections;
}

function main(){
  const sections = listSections();
  logInfo(`Running generator for ${sections.length} section(s)`);
  for (const s of sections) {
    const rel = path.relative(ROOT, s);
    logInfo(`→ ${COLORS.blue}${rel}${COLORS.reset}`);
    const r = spawnSync('node', [path.join('scripts','gen.js'), rel], { stdio: 'inherit' });
    if (r.status !== 0) {
      logWarn(`gen failed for section: ${rel}`);
      process.exit(r.status);
    }
    logSuccess(`Finished ${rel}`);
  }
  logSuccess('All sections processed');
}

main();
