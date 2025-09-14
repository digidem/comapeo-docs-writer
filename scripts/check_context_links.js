#!/usr/bin/env node
// Simple link checker for ./context/**.md files
// - Checks local links/images. Skips http(s), mailto, anchors.
// - Resolves paths relative to file; also allows leading 'context/' from repo root.
// - Skips illustrative links in context/templates/* to avoid false positives.
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTEXT = path.join(ROOT, 'context');

function walk(dir, acc=[]) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) acc.push(full);
  }
  return acc;
}

function extractLinks(md) {
  const out = [];
  const re = /(!)?\[[^\]]*\]\(([^)\s]+)\)/g; // ![alt](href)
  let m;
  while ((m = re.exec(md))) {
    const href = m[2];
    out.push(href);
  }
  return out;
}

function isExternal(href) {
  return /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:');
}

function isAnchor(href) {
  return href.startsWith('#');
}

function checkFile(file) {
  const rel = path.relative(ROOT, file);
  const skipExamples = rel.startsWith('context/templates/');
  const md = fs.readFileSync(file, 'utf8');
  const links = extractLinks(md);
  const errors = [];
  for (const href of links) {
    if (isExternal(href) || isAnchor(href)) continue;
    if (skipExamples) continue; // do not validate example links in templates
    let target;
    if (href.startsWith('context/')) {
      target = path.join(ROOT, href);
    } else if (href.startsWith('/')) {
      // absolute filesystem path not supported
      errors.push({ href, reason: 'absolute path' });
      continue;
    } else {
      target = path.join(path.dirname(file), href);
    }
    if (!fs.existsSync(target)) {
      errors.push({ href, reason: 'missing', resolved: path.relative(ROOT, target) });
    }
  }
  return { file: rel, errors };
}

const files = walk(CONTEXT);
const results = files.map(checkFile);
const failing = results.filter(r => r.errors.length);
if (failing.length) {
  console.log('Broken or questionable links in context (excluding templates examples):');
  for (const r of failing) {
    console.log('- ' + r.file);
    for (const e of r.errors) {
      console.log('   -> ' + e.href + (e.resolved ? '  (' + e.resolved + ')' : '') + (e.reason ? '  [' + e.reason + ']' : ''));
    }
  }
  process.exitCode = 1;
} else {
  console.log('All context links look good.');
}

