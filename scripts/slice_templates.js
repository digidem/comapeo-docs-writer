#!/usr/bin/env node
/**
 * Slice context/content_deck/content_deck.md into per-section template.md files under ./content,
 * following the pattern:
 * - Start at section H1 (exact title requested), ensure it is an H1
 * - Include a line: `For [Version Data]` after H1 (if not already present nearby)
 * - Include all content up to and including the next `# Previous Versions`
 * - Append:
 *   - `-   [Version Data]` (twice) and a `----` line
 * - Clean formatting: remove curly-brace attributes, table markup, double-bracket template marks; normalize images
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');
const DECK_MD = path.join(ROOT, 'context', 'content_deck', 'content_deck.md');

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
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

const deckRaw = fs.readFileSync(DECK_MD, 'utf8');
const deckLines = deckRaw.split(/\r?\n/);

// Build an index of H1 headings (lines starting with '# ')
const headings = [];
for (let i = 0; i < deckLines.length; i++) {
  const line = deckLines[i];
  const m = line.match(/^#\s+(.+)/);
  if (m) {
    const title = m[1].replace(/\{[^}]*\}\s*$/, '').trim();
    headings.push({ index: i, title, norm: normalizeKey(title) });
  }
}

function findSectionRangeByTitle(title) {
  const normTitle = normalizeKey(title);
  // Exact match first
  let start = headings.find(h => h.norm === normTitle);
  if (!start) {
    // Fuzzy: find heading that contains all words (>=4 chars) from title
    const words = normTitle.split(' ').filter(w => w.length > 3);
    const scored = headings.map(h => ({ h, score: words.reduce((a,w)=>a+(h.norm.includes(w)?1:0),0) }))
      .sort((a,b)=>b.score-a.score);
    if (scored[0] && scored[0].score > 0) start = scored[0].h;
  }
  if (!start) return null;
  // end: next occurrence of a heading that is exactly 'Previous Versions', or next H1 if none
  let endIndex = deckLines.length;
  for (let i = start.index + 1; i < deckLines.length; i++) {
    const lm = deckLines[i].match(/^#\s+(.+)/);
    if (lm) {
      const t = lm[1].replace(/\{[^}]*\}\s*$/, '').trim();
      if (normalizeKey(t) === normalizeKey('Previous Versions')) {
        // include this heading line
        // find the end of this block: up to next H1 or EOF
        endIndex = i + 1; // include the heading line
        // keep consuming following lines that belong to Previous Versions until next H1
        for (let j = endIndex; j < deckLines.length; j++) {
          if (/^#\s+/.test(deckLines[j])) { endIndex = j; break; }
          endIndex = j + 1;
        }
        break;
      }
    }
  }
  // If we didn't find a '# Previous Versions', take until next H1
  if (endIndex === deckLines.length) {
    for (let i = start.index + 1; i < deckLines.length; i++) {
      if (/^#\s+/.test(deckLines[i])) { endIndex = i; break; }
    }
  }
  return { start: start.index, end: endIndex };
}

function cleanMd(md) {
  let out = md;
  // Remove curly-brace attributes like {#... .unnumbered} and {.underline}
  out = out.replace(/\s*\{[^}]*\}/g, '');
  // Remove double-bracket template markers like [[...]]
  out = out.replace(/\[\[[^\]]*\]\]/g, '');
  // Convert Markdown/ASCII tables into plain text lines to preserve content.
  out = out.split(/\r?\n/).map(line => {
    const t = line.trim();
    // Skip pure ASCII borders
    if (/^\+[=\-\s\|]+\+$/.test(t)) return '';
    if (/^[=\-]{3,}$/.test(t)) return '';
    if (/^\|.*\|$/.test(t)) {
      // Strip leading/trailing pipes and split cells
      const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length === 0) return '';
      // Join cells with em dash
      return cells.join(' — ');
    }
    return line;
  }).filter(l => l !== '').join('\n');
  // Normalize image syntax and fix relative path to context images from section template depth
  out = out.replace(/!\[(.*?)\]\(([^)]+)\)/g, (m, alt, href) => {
    href = href.replace(/^\.\s+/, './');
    if (/^(\.?\s*\/)?images\//.test(href)) {
      href = href.replace(/^(\.?\s*\/)?images\//, '../../../../context/content_deck/images/');
    }
    return `![${alt}](${href})`;
  });
  // Fix odd nested link format [[https://...]](https://...) -> <https://...>
  out = out.replace(/\[\[(https?:\/\/[^\]]+)\]\]\((https?:\/\/[^)]+)\)/g, (m, a, b) => `<${b}>`);
  // Replace [@(URL)] patterns with <URL>
  out = out.replace(/\[@\((https?:\/\/[^)]+)\)\]/g, '<$1>');
  // Unescape bracket pollution: \[ ... \] -> [ ... ]
  out = out.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
  // Cleanup extra blank lines
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim() + '\n';
}

function ensureVersionHeaderAndFooter(title, slice) {
  // Ensure H1 title exactly
  let content = slice;
  // Normalize first heading to '# <title>'
  content = content.replace(/^#\s+.*$/m, `# ${title}`);
  // Insert 'For [Version Data]' if not present within first 5 lines after H1
  const parts = content.split(/\r?\n/);
  const h1Idx = parts.findIndex(l => /^#\s+/.test(l));
  if (h1Idx !== -1) {
    const window = parts.slice(h1Idx + 1, h1Idx + 6).join('\n');
    if (!/For \[Version Data\]/.test(window)) {
      parts.splice(h1Idx + 1, 0, 'For [Version Data]', '');
    }
  }
  content = parts.join('\n');
  // Ensure end footer after '# Previous Versions' block
  if (!/^#\s+Previous Versions/m.test(content)) {
    content += '\n# Previous Versions\n\n';
  }
  content = content.replace(/(#\s+Previous Versions[\s\S]*?)$/m, (m0, headingAndRest) => {
    const base = headingAndRest.replace(/\n+$/,'') + '\n\n';
    const footer = '-   [Version Data]\n\n-   [Version Data]\n\n----\n';
    return base + footer;
  });
  return content;
}

// Iterate content structure under ./content and rewrite each template.md
const topics = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .filter(e => /^\d{2}_/.test(e.name))
  .map(e => path.join(CONTENT_ROOT, e.name));

let updated = 0, missing = 0;
for (const topicDir of topics) {
  const sections = fs.readdirSync(topicDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => /^\d{2}_/.test(e.name))
    .map(e => path.join(topicDir, e.name));
  for (const sectionDir of sections) {
    const title = stripNumberPrefix(path.basename(sectionDir)).split('_').join(' ');
    const niceTitle = toTitleFromSlug(title);
    const range = findSectionRangeByTitle(niceTitle);
    const templatePath = path.join(sectionDir, 'template', 'template.md');
    let out;
    if (range) {
      const slice = deckLines.slice(range.start, range.end).join('\n');
      out = cleanMd(slice);
      out = ensureVersionHeaderAndFooter(niceTitle, out);
    } else {
      // Fallback skeleton
      out = `# ${niceTitle}\n\nFor [Version Data]\n\nTODO: section content not found in deck.\n\n# Previous Versions\n\n-   [Version Data]\n\n-   [Version Data]\n\n----\n`;
      missing++;
    }
    fs.writeFileSync(templatePath, out, 'utf8');
    updated++;
  }
}

console.log(`Updated ${updated} templates. Missing sections: ${missing}.`);

function stripNumberPrefix(name){ return name.replace(/^\d{2}_/, ''); }
function toTitleFromSlug(slug){
  // Convert snake_case to Title Case with apostrophes restored for common tokens
  const words = slug.split('_').map(w => {
    if (w === 'can') return "can"; // keep lowercase in e.g. can't
    if (w === 't') return "t";
    if (w === 'and') return 'and';
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  // Reconstruct common patterns
  let title = words.join(' ').replace(/Comapeo/g, 'CoMapeo');
  title = title.replace(/Can T/g, "Can't");
  title = title.replace(/Gps/g, 'GPS');
  title = title.replace(/Id/g, 'ID');
  title = title.replace(/Qr/g, 'QR');
  title = title.replace(/And/g, 'and');
  // Fix possessive s for comapeo's
  title = title.replace(/Comapeo S/g, "CoMapeo's");
  return title;
}
