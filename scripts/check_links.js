#!/usr/bin/env node
// Check all markdown links/images in the repo (excluding node_modules, .git, dist)
// - Skips http(s), mailto, anchors
// - Skips example links under context/templates
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist']);

function walk(dir, acc=[]) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.isFile() && /\.mdx?$/i.test(e.name)) acc.push(full);
  }
  return acc;
}

function extractLinks(md) {
  const out = [];
  const re = /(!)?\[[^\]]*\]\(([^)\s]+)\)/g; // ![alt](href)
  let m;
  while ((m = re.exec(md))) out.push(m[2]);
  return out;
}
const isExternal = s => /^(https?:)?\/\//i.test(s) || s.startsWith('mailto:');
const isAnchor = s => s.startsWith('#');

function checkFile(file) {
  const rel = path.relative(ROOT, file);
  const skipExamples = rel.startsWith('context/templates/');
  const md = fs.readFileSync(file, 'utf8');
  const links = extractLinks(md);
  const errors = [];
  for (const href of links) {
    if (isExternal(href) || isAnchor(href)) continue;
    if (skipExamples) continue;
    let target;
    if (href.startsWith('context/')) target = path.join(ROOT, href);
    else if (href.startsWith('/')) { errors.push({ href, reason: 'absolute path' }); continue; }
    else target = path.join(path.dirname(file), href);
    if (!fs.existsSync(target)) errors.push({ href, reason: 'missing', resolved: path.relative(ROOT, target) });
  }
  return { file: rel, errors };
}

const files = walk(ROOT);
const results = files.map(checkFile);
const failing = results.filter(r => r.errors.length);
if (failing.length) {
  console.log('Broken links found:');
  for (const r of failing) {
    console.log('- ' + r.file);
    for (const e of r.errors) console.log('   -> ' + e.href + (e.resolved? ' ('+e.resolved+')':'') + (e.reason? ' ['+e.reason+']':''));
  }
  process.exitCode = 1;
} else {
  console.log('All markdown links look good.');
}

