#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');
const MEDIA_DIR = path.join(ROOT, 'context', 'content_deck', 'images', 'media');

function listMedia() {
  if (!fs.existsSync(MEDIA_DIR)) return [];
  return fs.readdirSync(MEDIA_DIR).filter(f => fs.statSync(path.join(MEDIA_DIR, f)).isFile());
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function updateTemplateImages(filePath, movedSet, mediaList) {
  let src = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  // Replace image links by moving images named by basename into local images folder
  src = src.replace(/!\[(.*?)\]\(([^)]+)\)/g, (m, alt, href) => {
    const base = path.basename(href.trim());
    const mediaSrc = path.join(MEDIA_DIR, base);
    if (fs.existsSync(mediaSrc)) {
      const imagesDir = path.join(path.dirname(filePath), 'images');
      ensureDir(imagesDir);
      const dest = path.join(imagesDir, base);
      if (!fs.existsSync(dest)) {
        // copy file into section images
        fs.copyFileSync(mediaSrc, dest);
      }
      movedSet.add(base);
      changed = true;
      return `![${alt}](./images/${base})`;
    }
    // If not found in media, keep original link
    return m;
  });
  // Second pass: find any stray references to media filenames and convert the full line into a clean image reference
  // Build a quick lookup of media basenames for substring detection
  const mediaSet = new Set(mediaList);
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/!\[.*?\]\(.*?\)/.test(line)) continue; // already an image line
    // Fix corrupted context media paths by extracting imageNN.ext pattern
    if (line.includes('context/content_deck/images/media')) {
      const m = line.match(/(\d+)\.(png|jpg)/i);
      if (m) {
        const base = `image${m[1]}.${m[2].toLowerCase()}`;
        const mediaSrc = path.join(MEDIA_DIR, base);
        if (fs.existsSync(mediaSrc)) {
          const imagesDir = path.join(path.dirname(filePath), 'images');
          ensureDir(imagesDir);
          const dest = path.join(imagesDir, base);
          if (!fs.existsSync(dest)) fs.copyFileSync(mediaSrc, dest);
          movedSet.add(base);
          lines[i] = `![${base}](./images/${base})`;
          changed = true;
          continue; // move to next line
        }
      }
    }
    for (const base of mediaSet) {
      const stem = base.replace(/\.[^.]+$/, '');
      const containsStem = line.includes(base) || line.includes(stem + '.') || new RegExp(`\\b${stem}\\b`).test(line);
      if (containsStem) {
        const mediaSrc = path.join(MEDIA_DIR, base);
        if (fs.existsSync(mediaSrc)) {
          const imagesDir = path.join(path.dirname(filePath), 'images');
          ensureDir(imagesDir);
          const dest = path.join(imagesDir, base);
          if (!fs.existsSync(dest)) fs.copyFileSync(mediaSrc, dest);
          movedSet.add(base);
          lines[i] = `![${base}](./images/${base})`;
          changed = true;
          break;
        }
      }
    }
  }
  src = lines.join('\n');
  if (changed) fs.writeFileSync(filePath, src, 'utf8');
}

// Iterate all templates
const topics = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true }).filter(e => e.isDirectory() && /^\d{2}_/.test(e.name));
const mediaList = listMedia();
const movedSet = new Set();
let processed = 0;
for (const t of topics) {
  const topicDir = path.join(CONTENT_ROOT, t.name);
  const sections = fs.readdirSync(topicDir, { withFileTypes: true }).filter(e => e.isDirectory() && /^\d{2}_/.test(e.name));
  for (const s of sections) {
    const templatePath = path.join(topicDir, s.name, 'template', 'template.md');
    if (!fs.existsSync(templatePath)) continue;
    updateTemplateImages(templatePath, movedSet, mediaList);
    processed++;
  }
}

// After copying to sections, delete moved images from MEDIA_DIR
let deleted = 0;
for (const base of movedSet) {
  const p = path.join(MEDIA_DIR, base);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    deleted++;
  }
}

// Report remaining images in media dir
const remaining = listMedia();
console.log(JSON.stringify({ templatesProcessed: processed, imagesMoved: movedSet.size, mediaDeleted: deleted, mediaRemaining: remaining.length, remainingList: remaining }, null, 2));
