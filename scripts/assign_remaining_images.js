#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');
const MEDIA_DIR = path.join(ROOT, 'context', 'content_deck', 'images', 'media');
const DECK_MD = path.join(ROOT, 'context', 'content_deck', 'content_deck.md');
const MATERIALS_INDEX = path.join(ROOT, 'context', 'content_deck', 'MATERIALS_INDEX.md');

function normalizeKey(str) {
  return str
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

function toTitleFromSlug(slug){
  const minor = new Set(['a','an','and','as','at','but','by','for','from','in','into','nor','of','on','or','per','the','to','vs','via','with','your']);
  const parts = slug.split('_').filter(Boolean);
  const words = parts.map((w, idx) => {
    if (minor.has(w) && idx !== 0) return w;
    if (w === 'can') return 'can';
    if (w === 't') return 't';
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  let title = words.join(' ');
  title = title.replace(/Comapeo/g, 'CoMapeo');
  title = title.replace(/CoMapeo s/g, "CoMapeo's");
  title = title.replace(/CoMapeo S/g, "CoMapeo's");
  title = title.replace(/ Gps /g, ' GPS ');
  title = title.replace(/ Id /g, ' ID ');
  title = title.replace(/ Qr /g, ' QR ');
  title = title.replace(/Can t/g, "Can't");
  return title;
}

function listRemainingMedia() {
  if (!fs.existsSync(MEDIA_DIR)) return [];
  return fs.readdirSync(MEDIA_DIR).filter(f => fs.statSync(path.join(MEDIA_DIR, f)).isFile());
}

const deck = fs.readFileSync(DECK_MD, 'utf8');
const lines = deck.split(/\r?\n/);
// Build heading index
const headings = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^#\s+(.+)/);
  if (m) {
    const raw = m[1].replace(/\{[^}]*\}\s*$/, '').trim();
    // Skip headings that are actually image lines like '# ![](./images/...)'
    if (/^!\[.*?\]\(/.test(raw)) continue;
    const title = raw;
    headings.push({ index: i, title, key: normalizeKey(title) });
  }
}

// Build section directory map: key -> dir
const topics = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true }).filter(e => e.isDirectory() && /^\d{2}_/.test(e.name));
const sectionMap = [];
for (const t of topics) {
  const topicDir = path.join(CONTENT_ROOT, t.name);
  const sections = fs.readdirSync(topicDir, { withFileTypes: true }).filter(e => e.isDirectory() && /^\d{2}_/.test(e.name));
  for (const s of sections) {
    const slug = s.name.replace(/^\d{2}_/, '');
    const title = toTitleFromSlug(slug);
    sectionMap.push({ dir: path.join(topicDir, s.name), title, key: normalizeKey(title) });
  }
}

// Build materials index item keys
let materialsRaw = '';
try { materialsRaw = fs.readFileSync(MATERIALS_INDEX, 'utf8'); } catch {}
const materialKeys = new Set();
if (materialsRaw) {
  const ml = materialsRaw.split(/\r?\n/);
  for (const line of ml) {
    const m = line.match(/^\s*\d+\.\s*\[(.*?)\]/) || line.match(/^\s*\d+\.\s*(.*)$/);
    if (m) {
      const title = (m[1] || m[2] || '').replace(/\(.*?\)/g,'').trim();
      if (title) materialKeys.add(normalizeKey(title));
    }
  }
}

function findSectionForFilename(filename) {
  // find line index of first occurrence
  const stem = filename.replace(/\.[^.]+$/, '');
  let idx = lines.findIndex(l => l.includes(filename));
  if (idx === -1) {
    // try stem with dot or as word boundary
    idx = lines.findIndex(l => l.includes(stem + '.') || new RegExp(`\\b${stem}\\b`).test(l));
  }
  if (idx === -1) return null;
  // find nearest previous heading
  let head = null;
  for (let i = headings.length - 1; i >= 0; i--) {
    if (headings[i].index <= idx) { head = headings[i]; break; }
  }
  if (!head) return null;
  // exact key match, else fuzzy by word overlap
  const exact = sectionMap.find(s => s.key === head.key);
  if (exact) return exact;
  const words = head.key.split(' ').filter(w => w.length > 3);
  const scored = sectionMap.map(s => ({ s, score: words.reduce((a,w)=>a+(s.key.includes(w)?1:0),0) }))
    .sort((a,b)=>b.score-a.score);
  if (scored[0] && scored[0].score > 0) return scored[0].s;
  // Fallback: scan upwards for a line matching a materials item title
  for (let i = idx; i >= 0; i--) {
    const norm = normalizeKey(lines[i]);
    if (materialKeys.has(norm)) {
      // Map this key to sectionMap exact match
      const sec = sectionMap.find(s => s.key === norm);
      if (sec) return sec;
    }
  }
  return null;
}

let moved = 0, failed = [];
for (const base of listRemainingMedia()) {
  const section = findSectionForFilename(base);
  if (!section) { failed.push(base); continue; }
  const src = path.join(MEDIA_DIR, base);
  const destDir = path.join(section.dir, 'template', 'images');
  const dest = path.join(destDir, base);
  fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  fs.unlinkSync(src);
  moved++;
}

const remaining = listRemainingMedia();
console.log(JSON.stringify({ additionalMoved: moved, unplaced: failed, mediaRemaining: remaining.length, remainingList: remaining }, null, 2));
