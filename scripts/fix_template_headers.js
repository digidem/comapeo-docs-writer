#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');

function stripNumberPrefix(name){ return name.replace(/^\d{2}_/, ''); }
function toTitleFromSlug(slug){
  const minor = new Set(['a','an','and','as','at','but','by','for','from','in','into','nor','of','on','or','per','the','to','vs','via','with','your']);
  const parts = slug.split('_').filter(Boolean);
  const words = parts.map((w, idx) => {
    if (minor.has(w) && idx !== 0) return w; // keep minor words lowercase except first
    if (w === 'can') return 'can';
    if (w === 't') return 't';
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  let title = words.join(' ');
  title = title.replace(/Comapeo/g, 'CoMapeo');
  title = title.replace(/CoMapeo s/g, "CoMapeo's");
  title = title.replace(/CoMapeo S/g, "CoMapeo's");
  title = title.replace(/^Understanding Comapeo s /, "Understanding CoMapeo's ");
  title = title.replace(/ Gps /g, ' GPS ');
  title = title.replace(/ Id /g, ' ID ');
  title = title.replace(/ Qr /g, ' QR ');
  // Fix "Can t" to "Can’t" (straight apostrophe)
  title = title.replace(/Can t/g, "Can't");
  return title;
}

function enforceHeaderFooter(filePath, title){
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  // Remove any leading blank lines
  while (lines.length && lines[0].trim() === '') lines.shift();
  // Replace or insert H1 at top
  if (lines.length && /^#\s+/.test(lines[0])) {
    lines[0] = `# ${title}`;
  } else {
    lines.unshift(`# ${title}`);
  }
  // Ensure 'For [Version Data]' as the second non-empty line
  // Find the index just after the H1
  let insertIdx = 1;
  // Remove any existing 'For [Version Data]' duplicates within first few lines
  const firstFive = lines.slice(1, 6).map(l => l.trim());
  if (!firstFive.some(l => l === 'For [Version Data]')) {
    if (lines.length <= insertIdx || lines[insertIdx].trim() !== '') lines.splice(insertIdx, 0, 'For [Version Data]');
    else lines[insertIdx] = 'For [Version Data]';
    // Ensure a blank line after
    if (lines[insertIdx+1] && lines[insertIdx+1].trim() !== '') lines.splice(insertIdx+1, 0, '');
  }

  // Rebuild content up to '# Previous Versions', then append bullets and separator
  let content = lines.join('\n');
  const prevRe = /^#\s+Previous Versions[\s\S]*$/m;
  if (prevRe.test(content)) {
    // Keep everything up to the start of '# Previous Versions'
    const idx = content.search(/^#\s+Previous Versions/m);
    content = content.slice(0, idx) + '# Previous Versions\n\n';
  } else {
    // Ensure a blank line before appending
    if (!/\n\n$/.test(content)) content += '\n';
    content += '\n# Previous Versions\n\n';
  }
  content += '-   [Version Data]\n\n-   [Version Data]\n\n----\n';

  fs.writeFileSync(filePath, content, 'utf8');
}

// Process all template.md files under numbered topic/section dirs
const topics = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
  .filter(e => e.isDirectory() && /^\d{2}_/.test(e.name));

let count = 0;
for (const t of topics) {
  const topicDir = path.join(CONTENT_ROOT, t.name);
  const sections = fs.readdirSync(topicDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d{2}_/.test(e.name));
  for (const s of sections) {
    const sectionDir = path.join(topicDir, s.name);
    const title = toTitleFromSlug(stripNumberPrefix(s.name));
    const templatePath = path.join(sectionDir, 'template', 'template.md');
    if (fs.existsSync(templatePath)) {
      enforceHeaderFooter(templatePath, title);
      count++;
    }
  }
}

console.log(`Fixed headers & footers for ${count} templates.`);
