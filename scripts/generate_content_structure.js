/**
 * NOTE: Deprecated workflow helper.
 * Summaries now live in context/content_deck/INDEX.md.
 * This script is not required for current content generation.
 */
#!/usr/bin/env node
/**
 * Generates content folder structure from MATERIALS_INDEX.md, cleans content_deck.md,
 * creates per-section template folders with cleaned deck, and builds INDEX.md with summaries.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');
const DECK_DIR = path.join(ROOT, 'context', 'content_deck');
const MATERIALS_INDEX = path.join(DECK_DIR, 'MATERIALS_INDEX.md');
// Deprecated: summaries now live in context/content_deck/INDEX.md
const SUMMARY_FILE = path.join(DECK_DIR, 'comapeo_materials_summary.md');
const DECK_MD = path.join(DECK_DIR, 'content_deck.md');
const CLEANED_DECK_MD = path.join(DECK_DIR, 'cleaned_content_deck.md');
const OUTPUT_INDEX = path.join(DECK_DIR, 'INDEX.md');

function snakeCase(str) {
  return str
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
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

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// 1) Parse MATERIALS_INDEX.md into structure
const materialsRaw = readFileSafe(MATERIALS_INDEX);
if (!materialsRaw) {
  console.error('Missing MATERIALS_INDEX.md at', MATERIALS_INDEX);
  process.exit(1);
}

const lines = materialsRaw.split(/\r?\n/);
const groups = [];
let currentGroup = null;
for (const line of lines) {
  const h = line.match(/^#\s+(.*)/);
  if (h) {
    const title = h[1].trim();
    if (title.toLowerCase() === 'contents') continue; // skip top
    currentGroup = { title, items: [] };
    groups.push(currentGroup);
    continue;
  }
  const itemMatch = line.match(/^\s*\d+\.\s+\[(.*?)\]/) || line.match(/^\s*\d+\.\s+(.*?)(\s+\\\[COMING SOON\\\])?\s*$/);
  if (currentGroup && itemMatch) {
    const rawTitle = (itemMatch[1] || itemMatch[2] || '').trim();
    const cleaned = rawTitle.replace(/\(.*?\)/g, '').trim();
    if (cleaned) {
      currentGroup.items.push({ title: cleaned });
    }
  }
}

// 2) Parse comapeo_materials_summary.md into a map from title to summary + links
const summaryMap = new Map();
if (!readFileSafe(SUMMARY_FILE)) {
  console.warn('[generate_content_structure] Note: comapeo_materials_summary.md not found. Skipping summaries; use context/content_deck/INDEX.md instead.');
}

// 3) Clean content_deck.md and write cleaned_deck
const deckRaw = readFileSafe(DECK_MD);
if (!deckRaw) {
  console.error('Missing content_deck.md at', DECK_MD);
  process.exit(1);
}

function cleanDeck(md, relativeToContextDeck = true) {
  let out = md;
  // Remove curly-brace attributes like {#... .unnumbered} and {.underline}
  out = out.replace(/\s*\{[^}]*\}/g, '');
  // Remove double-bracket template markers like [[HERO IMAGE: ...]]
  out = out.replace(/\[\[[^\]]*\]\]/g, '');
  // Remove table lines (simple heuristic): lines starting with '|' or '+' used by ascii tables
  out = out.split(/\r?\n/).filter(line => {
    const trimmed = line.trim();
    if (/^\|/.test(trimmed)) return false;
    if (/^[+=-]{3,}$/.test(trimmed)) return false;
    if (/^\+[+\-\s\|]+\+$/.test(trimmed)) return false;
    if (/^\|[\s\S]*\|$/.test(trimmed)) return false;
    return true;
  }).join('\n');
  // Simplify image attributes like ![](./images/...){width="..." height="..."}
  out = out.replace(/!\[(.*?)\]\(([^)]+)\)\s*/g, (m, alt, href) => {
    // Fix odd pattern '![](. /images/...'
    href = href.replace(/^\.\s+/, './');
    return `![${alt}](${href})`;
  });
  // Optionally normalize image relative path to context/content_deck/images when copied elsewhere
  if (!relativeToContextDeck) {
    out = out.replace(/!\[(.*?)\]\((\.\/?images\/[^)]+)\)/g, (m, alt, href) => {
      // from section template, point to ../../../context/content_deck/images/... (template is 3 deep under content/<g>/<s>/template)
      const newHref = href.replace(/^\.\/?images\//, '../../../../context/content_deck/images/');
      return `![${alt}](${newHref})`;
    });
  }
  // Clean weird link format like [[https://...]](https://...)
  out = out.replace(/\[\[(https?:\/\/[^\]]+)\]\]\((https?:\/\/[^)]+)\)/g, (m, a, b) => `[${b}](${b})`);
  // Remove duplicate blank lines
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim() + '\n';
}

const cleanedDeck = cleanDeck(deckRaw, true);
ensureDir(DECK_DIR);
fs.writeFileSync(CLEANED_DECK_MD, cleanedDeck, 'utf8');

// 4) Create ./content structure and per-section templates
ensureDir(CONTENT_ROOT);
for (const group of groups) {
  const groupDir = path.join(CONTENT_ROOT, snakeCase(group.title));
  ensureDir(groupDir);
  for (const item of group.items) {
    const sectionDir = path.join(groupDir, snakeCase(item.title));
    const templateDir = path.join(sectionDir, 'template');
    ensureDir(templateDir);
    // Create template.md with section title and cleaned deck adjusted for template relative image paths
    const sectionHeader = `# ${item.title}\n\n`;
    const adjustedDeck = cleanDeck(deckRaw, false);
    fs.writeFileSync(path.join(templateDir, 'template.md'), sectionHeader + adjustedDeck, 'utf8');
    // Add a note about images location
    ensureDir(path.join(templateDir, 'images'));
    const imgNote = 'Images are referenced from ../../../../context/content_deck/images.\n';
    fs.writeFileSync(path.join(templateDir, 'images', 'README.txt'), imgNote, 'utf8');
  }
}

// 5) Build INDEX.md
function buildIndex() {
  const lines = [];
  lines.push('# Content Index');
  lines.push('');
  for (const group of groups) {
    lines.push(`## ${group.title}`);
    lines.push('');
    for (const item of group.items) {
      const key = normalizeKey(item.title);
      let matched = summaryMap.get(key);
      if (!matched) {
        // try fuzzy: find summary whose key includes item words
        const candidates = Array.from(summaryMap.entries());
        const words = key.split(' ').filter(w => w.length > 3);
        const scored = candidates.map(([k, v]) => {
          let score = 0;
          for (const w of words) if (k.includes(w)) score++;
          return { k, v, score };
        }).sort((a,b)=>b.score-a.score);
        if (scored[0] && scored[0].score > 0) matched = scored[0].v;
      }
      const relPath = path.join('..','..','content', snakeCase(group.title), snakeCase(item.title));
      if (matched && matched.summary) {
        const uniqueLinks = Array.from(new Set(matched.notionLinks || []));
        const links = uniqueLinks.map(u => `[Notion](${u})`).join(' ');
        const safeSummary = matched.summary.replace(/^\*\*\s*/, '').trim();
        lines.push(`- ${item.title} — ${safeSummary} ${links} \n  Folder: \
\`${relPath}\``);
      } else {
        lines.push(`- ${item.title} — TODO: summary/link not found in comapeo_materials_summary.md. \n  Folder: \
\`${relPath}\``);
      }
    }
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

fs.writeFileSync(OUTPUT_INDEX, buildIndex(), 'utf8');

console.log('Generation complete.');
