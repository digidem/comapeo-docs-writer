#!/usr/bin/env node
/*
 Simple Office (DOCX/PPTX) to Markdown converter using unzip.
 - Extracts text and images
 - DOCX: Approximates headings (Heading1..6); treats lists (numPr) and tables as bullets
 - PPTX: Slide N + title (first paragraph) + bullet points for remaining paragraphs
 - Avoids tables/columns; produces plain paragraphs/bullets
 - Supports --outdir and --imgdir to target existing asset folders
*/
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function sh(cmd) {
  return cp.execSync(cmd, { encoding: 'utf8' });
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function decodeXmlEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractFile(file, innerPath, fallback = '') {
  try {
    return sh(`unzip -p ${JSON.stringify(file)} ${JSON.stringify(innerPath)}`);
  } catch (e) {
    return fallback;
  }
}

function extractImages(file, innerGlob, outDir) {
  try {
    ensureDir(outDir);
    // -j: junk paths so images land directly in outDir
    cp.execSync(`unzip -o -j ${JSON.stringify(file)} ${JSON.stringify(innerGlob)} -d ${JSON.stringify(outDir)}`, { stdio: 'ignore' });
  } catch (e) {
    // ignore if none
  }
}

function convertDocx(file, opts = {}) {
  const baseNoExt = path.basename(file).replace(/\.(docx)$/i, '');
  const outDir = opts.outdir || path.dirname(file);
  const outMd = path.join(outDir, `${baseNoExt}.md`);
  const imagesDir = opts.imgdir || path.join(outDir, `${baseNoExt}_images`);
  if (!opts.imgdir) extractImages(file, 'word/media/*', imagesDir);

  const xml = extractFile(file, 'word/document.xml');
  const paras = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const lines = [];
  lines.push(`# ${baseNoExt.replace(/[_-]/g, ' ')}`);
  lines.push('');
  for (const p of paras) {
    const isHeadingMatch = p.match(/<w:pStyle[^>]*w:val=\"(Heading|heading)([1-6])\"/);
    const isList = /<w:numPr\b/.test(p);
    const inTable = /<w:tbl\b|<w:tc\b/.test(p);
    const texts = [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(m => decodeXmlEntities(m[1])).join('');
    const text = texts.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (isHeadingMatch) {
      const level = parseInt(isHeadingMatch[2], 10);
      lines.push(`${'#'.repeat(Math.min(level, 6))} ${text}`);
    } else if (isList || inTable) {
      lines.push(`- ${text}`);
    } else {
      lines.push(text);
    }
    lines.push('');
  }
  if (fs.existsSync(imagesDir)) {
    const imgs = fs.readdirSync(imagesDir).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
    if (imgs.length) {
      lines.push('## Images');
      lines.push('');
      for (const img of imgs) {
        lines.push(`![${img}](${path.basename(imagesDir)}/${img})`);
      }
      lines.push('');
    }
  }
  ensureDir(path.dirname(outMd));
  fs.writeFileSync(outMd, lines.join('\n'));
  console.log(`Converted DOCX -> ${outMd}`);
}

function listSlides(file) {
  try {
    const out = sh(`unzip -Z1 ${JSON.stringify(file)}`);
    return out
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => /^ppt\/slides\/slide\d+\.xml$/.test(l))
      .map(l => parseInt(l.match(/slide(\d+)\.xml$/)[1], 10))
      .sort((a, b) => a - b);
  } catch (e) {
    return [];
  }
}

function convertPptx(file, opts = {}) {
  const baseNoExt = path.basename(file).replace(/\.(pptx)$/i, '');
  const outDir = opts.outdir || path.dirname(file);
  const outMd = path.join(outDir, `${baseNoExt}.md`);
  const imagesDir = opts.imgdir || path.join(outDir, `${baseNoExt}_images`);
  if (!opts.imgdir) extractImages(file, 'ppt/media/*', imagesDir);

  const slides = listSlides(file);
  const lines = [];
  lines.push(`# ${baseNoExt.replace(/[_-]/g, ' ')}`);
  lines.push('');
  for (const n of slides) {
    const xml = extractFile(file, `ppt/slides/slide${n}.xml`);
    const paras = xml.match(/<a:p\b[\s\S]*?<\/a:p>/g) || [];
    const paraTexts = paras.map(p => {
      const txt = [...p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(m => decodeXmlEntities(m[1])).join('');
      return txt.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
    if (!paraTexts.length) continue;
    const title = paraTexts[0];
    lines.push(`## Slide ${n} — ${title}`);
    for (const t of paraTexts.slice(1)) lines.push(`- ${t}`);
    lines.push('');
  }
  if (fs.existsSync(imagesDir)) {
    const imgs = fs.readdirSync(imagesDir).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
    if (imgs.length) {
      lines.push('## Images');
      lines.push('');
      for (const img of imgs) {
        lines.push(`![${img}](${path.basename(imagesDir)}/${img})`);
      }
      lines.push('');
    }
  }
  ensureDir(path.dirname(outMd));
  fs.writeFileSync(outMd, lines.join('\n'));
  console.log(`Converted PPTX -> ${outMd}`);
}

function run() {
  const argv = process.argv.slice(2);
  const files = [];
  const opts = { outdir: null, imgdir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--outdir') { opts.outdir = argv[++i]; continue; }
    if (a === '--imgdir') { opts.imgdir = argv[++i]; continue; }
    files.push(a);
  }
  if (!files.length) {
    console.error('Usage: node scripts/convert-office-to-md.js [--outdir DIR] [--imgdir DIR] <file.docx|file.pptx> [...]');
    process.exit(1);
  }
  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.error(`Not found: ${f}`);
      continue;
    }
    if (/\.docx$/i.test(f)) convertDocx(f, opts);
    else if (/\.pptx$/i.test(f)) convertPptx(f, opts);
    else console.error(`Skipping unsupported: ${f}`);
  }
}

run();

