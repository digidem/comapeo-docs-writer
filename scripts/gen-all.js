#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');

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
  for (const s of sections) {
    const rel = path.relative(ROOT, s);
    const r = spawnSync('node', [path.join('scripts','gen.js'), rel], { stdio: 'inherit' });
    if (r.status !== 0) {
      console.error('gen failed for section:', rel);
      process.exit(r.status);
    }
  }
}

main();

