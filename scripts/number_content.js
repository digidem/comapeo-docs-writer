#!/usr/bin/env node
/**
 * Prefixes topic and section folders under ./content with numeric ordering
 * based on context/content_deck/MATERIALS_INDEX.md, and regenerates
 * context/content_deck/INDEX.md to reflect new paths.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');
const DECK_DIR = path.join(ROOT, 'context', 'content_deck');
const MATERIALS_INDEX = path.join(DECK_DIR, 'MATERIALS_INDEX.md');
const SUMMARY_FILE = path.join(DECK_DIR, 'comapeo_materials_summary.md');
const OUTPUT_INDEX = path.join(DECK_DIR, 'INDEX.md');

function snakeCase(str) {
  return str
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_');
}
function normalizeKey(str) {
  return str
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/\//g, ' and ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}
function read(p){ return fs.readFileSync(p,'utf8'); }
function safeExists(p){ try { fs.accessSync(p); return true; } catch { return false; } }
function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function pad2(n){ return n.toString().padStart(2,'0'); }
function stripPrefix(name){ return name.replace(/^\d{2}_/,''); }

// Parse MATERIALS_INDEX.md
const materialsRaw = read(MATERIALS_INDEX);
const lines = materialsRaw.split(/\r?\n/);
const groups = [];
let currentGroup = null;
for (const line of lines) {
  const h = line.match(/^#\s+(.*)/);
  if (h) {
    const title = h[1].trim();
    if (title.toLowerCase() === 'contents') continue;
    currentGroup = { title, slug: snakeCase(title), items: [] };
    groups.push(currentGroup);
    continue;
  }
  const itemMatch = line.match(/^\s*\d+\.\s+\[(.*?)\]/) || line.match(/^\s*\d+\.\s+(.*?)(\s+\\\[COMING SOON\\\])?\s*$/);
  if (currentGroup && itemMatch) {
    const rawTitle = (itemMatch[1] || itemMatch[2] || '').trim();
    const cleaned = rawTitle.replace(/\(.*?\)/g,'').trim();
    if (cleaned) currentGroup.items.push({ title: cleaned, slug: snakeCase(cleaned) });
  }
}

// Parse summaries for INDEX.md
const summaryRaw = read(SUMMARY_FILE);
const summaryMap = new Map();
for (const b of summaryRaw.split(/\n\s*\*\s+/).filter(Boolean)) {
  const m = b.match(/^\*?\s*\*\*(.*?)\*\*\s*:\s*([\s\S]*)$/) || b.match(/^\*?\s*\*\*(.*?)\*\*\s*—\s*([\s\S]*)$/);
  let title, body;
  if (m) { title = m[1].trim(); body = m[2].trim(); } else {
    const idx = b.indexOf(':');
    if (idx === -1) continue;
    title = b.slice(0, idx).replace(/^\*?\s*\*\*/,'').replace(/\*\*$/,'').trim();
    body = b.slice(idx + 1).trim();
  }
  const links = Array.from(body.matchAll(/\[Notion\]\((https?:\/\/[^)]+)\)/g)).map(m=>m[1]);
  const cleaned = body
    .replace(/\s*\[Notion\]\((https?:\/\/[^)]+)\)/g,'')
    .replace(/\s*\[Google Drive\]\((https?:\/\/[^)]+)\)/g,'')
    .replace(/^\*\*\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  summaryMap.set(normalizeKey(title), { title, summary: cleaned, notionLinks: Array.from(new Set(links)) });
}

// Locate existing group dir for a slug (unnumbered or numbered)
function findGroupDir(slug){
  const a = path.join(CONTENT_ROOT, slug);
  if (safeExists(a)) return a;
  const entries = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const base = e.name;
    if (stripPrefix(base) === slug) return path.join(CONTENT_ROOT, base);
  }
  return null;
}
// Locate existing section dir within a group
function findSectionDir(groupDir, sectionSlug){
  const entries = fs.readdirSync(groupDir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (stripPrefix(e.name) === sectionSlug) return path.join(groupDir, e.name);
  }
  return null;
}

// 1) Rename sections within each group to NN_sectionSlug
groups.forEach((group, gi) => {
  const gDir = findGroupDir(group.slug);
  if (!gDir) return;
  group.baseDir = gDir; // track
  group.index = gi + 1;
  group.items.forEach((item, ii) => {
    const sDir = findSectionDir(gDir, item.slug);
    if (!sDir) return;
    const desired = path.join(gDir, `${pad2(ii+1)}_${item.slug}`);
    if (path.basename(sDir) !== path.basename(desired)) {
      fs.renameSync(sDir, desired);
    }
  });
});

// 2) Rename group dirs to NN_groupSlug
groups.forEach((group) => {
  const gDir = group.baseDir || findGroupDir(group.slug);
  if (!gDir) return;
  const desired = path.join(CONTENT_ROOT, `${pad2(group.index)}_${stripPrefix(path.basename(gDir))}`.replace(/^(\d{2}_)?/, `${pad2(group.index)}_`));
  if (path.basename(gDir) !== path.basename(desired)) {
    fs.renameSync(gDir, desired);
    group.baseDir = desired;
  } else {
    group.baseDir = gDir;
  }
});

// 3) Regenerate INDEX.md with numbered paths
const linesOut = [];
linesOut.push('# Content Index');
linesOut.push('');
for (const group of groups) {
  linesOut.push(`## ${group.title}`);
  linesOut.push('');
  for (let i=0;i<group.items.length;i++){
    const item = group.items[i];
    const key = normalizeKey(item.title);
  let s = summaryMap.get(key);
  if (!s) {
    const words = key.split(' ').filter(w=>w.length>3);
    const entries = Array.from(summaryMap.entries());
    const scored = entries.map(([k,v])=>({k,v,score:words.reduce((acc,w)=>acc+(k.includes(w)?1:0),0)}))
      .sort((a,b)=>b.score-a.score);
    if (scored[0] && scored[0].score>0) s = scored[0].v;
  }
    const summary = s ? s.summary : 'TODO: summary/link not found in comapeo_materials_summary.md.';
    const links = s ? (s.notionLinks||[]).map(u=>`[Notion](${u})`).join(' ') : '';
    const relPath = path.join('..','..','content', `${pad2(group.index)}_${group.slug}`, `${pad2(i+1)}_${item.slug}`);
    linesOut.push(`- ${item.title} — ${summary} ${links} \n  Folder: \`${relPath}\``);
  }
  linesOut.push('');
}

fs.writeFileSync(OUTPUT_INDEX, linesOut.join('\n')+'\n','utf8');
console.log('Numbering complete. INDEX.md updated.');
