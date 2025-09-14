#!/usr/bin/env node
/*
 Scaffolds missing version folders (v1) for content sections.
 - Scans ./content/<NN_topic>/<NN_section>/
 - If no vN/ folder exists, creates v1/ with index.md and referenced.md
 - Uses context/templates/SECTION.template.md as base for index.md
 - referenced.md is a copy plus a placeholder Sources block
 Usage:
   node scripts/generate_missing_versions.js [--limit N]
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'content');
const TPL_SECTION = path.join(ROOT, 'context', 'templates', 'SECTION.template.md');

const args = process.argv.slice(2);
let limit = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[i + 1], 10); i++; }
}

function listDirs(p) {
  return fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => path.join(p, d.name));
}
function hasVersion(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.some(e => e.isDirectory() && /^v\d+$/.test(e.name) && fs.existsSync(path.join(dir, e.name, 'index.md')));
  } catch { return false; }
}
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function titleFromSlug(slug){
  const minor = new Set(['a','an','and','as','at','but','by','for','from','in','into','nor','of','on','or','per','the','to','vs','via','with','your','outside']);
  const seg = slug.replace(/^\d{2}_/, '').replace(/_/g,' ');
  const parts = seg.split(/\s+/).filter(Boolean).map((w,i)=>{const lw=w.toLowerCase();return (i>0&&minor.has(lw))?lw:lw.charAt(0).toUpperCase()+lw.slice(1)});
  return parts.join(' ').replace(/Comapeo/g,'CoMapeo').replace(/CoMapeo S/g,"CoMapeo's").replace(/Can T/g,"Can't");
}

function scaffold(sectionDir) {
  const v1 = path.join(sectionDir, 'v1');
  ensureDir(v1);
  ensureDir(path.join(v1, 'images'));
  const indexPath = path.join(v1, 'index.md');
  const refPath = path.join(v1, 'referenced.md');
  const base = fs.readFileSync(TPL_SECTION, 'utf8');
  // Infer a good title from folder name
  const title = titleFromSlug(path.basename(sectionDir));
  const content = base.replace('# [SECTION TITLE]', `# ${title}`);
  fs.writeFileSync(indexPath, content, 'utf8');
  fs.writeFileSync(refPath, content + '\n\nSources: context/...\n', 'utf8');
  return { indexPath, refPath };
}

function main(){
  if (!fs.existsSync(CONTENT)) { console.error('Missing ./content'); process.exit(1); }
  if (!fs.existsSync(TPL_SECTION)) { console.error('Missing SECTION template at', TPL_SECTION); process.exit(1); }
  const topics = listDirs(CONTENT).filter(d => /\/(\d{2}_.+)$/.test(d));
  const missing = [];
  for (const t of topics) {
    const sections = listDirs(t).filter(d => /\/(\d{2}_.+)$/.test(d));
    for (const s of sections) {
      if (!hasVersion(s)) missing.push(s);
    }
  }
  const toCreate = (limit && limit>0) ? missing.slice(0, limit) : missing;
  const created = [];
  for (const s of toCreate) {
    const out = scaffold(s);
    created.push({ section: path.relative(ROOT, s), ...out });
  }
  console.log(JSON.stringify({ totalMissing: missing.length, created }, null, 2));
}

main();

