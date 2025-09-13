#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');

function normalizeImages(content) {
  // Collapse newlines inside image parentheses
  content = content.replace(/!\[(.*?)\]\(([^)]*?)\)/gs, (m, alt, href) => {
    let h = href.replace(/\s+/g, '');
    // Remove erroneous prefixes like ./—**Step1**/
    h = h.replace(/^\.?\/?—\*\*Step\d+\*\*\//, './');
    // Normalize path to context images when pointing to images/
    if (/^(\.?\/?|\.?\s*\/)images\//i.test(h)) {
      h = h.replace(/^(\.?\/?|\.?\s*\/)images\//i, '../../../../context/content_deck/images/');
    }
    return `![${alt}](${h})`;
  });
  // Also fix cases like ". /images" to the context path
  content = content.replace(/\!\[(.*?)\]\(\.\s*\/images\//g, '![$1](../../../../context/content_deck/images/');
  return content;
}

function clean(content) {
  let out = content;
  // Remove HTML comments
  out = out.replace(/<!--[^]*?-->/g, '');
  // Remove double-bracket template markers
  out = out.replace(/\[\[[^\]]*\]\]/g, '');
  // Remove curly-brace attributes
  out = out.replace(/\s*\{[^}]*\}/g, '');
  // Unescape brackets and common escapes
  out = out.replace(/\\\[/g, '[').replace(/\\\]/g, ']').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
  // Normalize odd combined link format [[https://...]](https://...) => <https://...>
  out = out.replace(/\[\[(https?:\/\/[^\]]+)\]\]\((https?:\/\/[^)]+)\)/g, (m, a, b) => `<${b}>`);
  // Replace [@(URL)] with <URL>
  out = out.replace(/\[@\((https?:\/\/[^)]+)\)\]/g, '<$1>');
  // Remove ASCII table borders
  out = out.split(/\r?\n/).filter(l => l.trim().charAt(0) !== '+').join('\n');
  // Drop any lingering broken media paths (we relocate images per-section)
  out = out.split(/\r?\n/).filter(l => !/context\/content_deck\/images\/media|\.\/images\/media\//.test(l)).join('\n');
  // Normalize images and paths
  out = normalizeImages(out);
  // Remove duplicate blank lines
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim() + '\n';
}

const topics = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true }).filter(e => e.isDirectory() && /^\d{2}_/.test(e.name));
let count = 0;
for (const t of topics) {
  const sections = fs.readdirSync(path.join(CONTENT_ROOT, t.name), { withFileTypes: true }).filter(e => e.isDirectory() && /^\d{2}_/.test(e.name));
  for (const s of sections) {
    const file = path.join(CONTENT_ROOT, t.name, s.name, 'template', 'template.md');
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const cleaned = clean(raw);
    fs.writeFileSync(file, cleaned, 'utf8');
    count++;
  }
}
console.log(`Cleaned ${count} templates.`);
