#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');
const PROMPT_FILE = path.join(ROOT, 'context', 'prompts', 'create-next-version.md');
const SECTION_TEMPLATE = path.join(ROOT, 'context', 'templates', 'SECTION.template.md');

function stripPrefix(name) {
  return name.replace(/^\d{2}_/, '');
}

function titleCaseName(seg) {
  const minor = new Set(['a','an','and','as','at','but','by','for','from','in','into','nor','of','on','or','per','the','to','vs','via','with','your','outside']);
  const base = stripPrefix(seg).replace(/_/g, ' ');
  const parts = base.split(/\s+/).filter(Boolean).map((w, i) => {
    const lw = w.toLowerCase();
    if (i > 0 && minor.has(lw)) return lw;
    return lw.charAt(0).toUpperCase() + lw.slice(1);
  });
  let out = parts.join(' ');
  out = out.replace(/Comapeo/gi, 'CoMapeo');
  out = out.replace(/CoMapeo\s+[Ss]/g, "CoMapeo's");
  out = out.replace(/ Gps /gi, ' GPS ');
  out = out.replace(/ Id /gi, ' ID ');
  out = out.replace(/ Qr /gi, ' QR ');
  out = out.replace(/Can t/gi, "Can't");
  return out;
}

function ensureNextVersion(sectionPath, { copyFromPrevious = false, ensureTemplate = false } = {}) {
  const entries = fs.readdirSync(sectionPath, { withFileTypes: true });
  let maxVersion = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const match = entry.name.match(/^v(\d+)$/);
      if (match) {
        maxVersion = Math.max(maxVersion, parseInt(match[1], 10));
      }
    }
  }
  const nextVersion = maxVersion + 1;
  const prevVersion = maxVersion === 0 ? null : `v${maxVersion}`;
  const versionName = `v${nextVersion}`;
  const versionDir = path.join(sectionPath, versionName);
  let createdDir = false;
  let wroteFiles = false;
  let copiedFiles = false;

  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
    createdDir = true;
  }
  const imagesDir = path.join(versionDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const template = fs.readFileSync(SECTION_TEMPLATE, 'utf8');
  const sectionTitle = titleCaseName(path.basename(sectionPath));
  const filled = template.replace(/\[SECTION TITLE\]/g, sectionTitle);

  const indexPath = path.join(versionDir, 'index.md');
  const referencedPath = path.join(versionDir, 'referenced.md');
  const prevVersionDir = prevVersion ? path.join(sectionPath, prevVersion) : null;
  const prevIndexPath = prevVersionDir ? path.join(prevVersionDir, 'index.md') : null;
  const prevReferencedPath = prevVersionDir ? path.join(prevVersionDir, 'referenced.md') : null;

  if (copyFromPrevious && prevIndexPath && fs.existsSync(prevIndexPath) && !fs.existsSync(indexPath)) {
    fs.copyFileSync(prevIndexPath, indexPath);
    copiedFiles = true;
  }
  if (copyFromPrevious && prevReferencedPath && fs.existsSync(prevReferencedPath) && !fs.existsSync(referencedPath)) {
    fs.copyFileSync(prevReferencedPath, referencedPath);
    copiedFiles = true;
  }
  if (copyFromPrevious && prevVersionDir) {
    const prevImagesDir = path.join(prevVersionDir, 'images');
    if (fs.existsSync(prevImagesDir)) {
      const entries = fs.readdirSync(prevImagesDir, { withFileTypes: true });
      for (const entry of entries) {
        const src = path.join(prevImagesDir, entry.name);
        const dest = path.join(imagesDir, entry.name);
        if (entry.isDirectory()) {
          fs.cpSync(src, dest, { recursive: true });
        } else if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
        }
      }
    }
  }

  if (ensureTemplate && !fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, filled);
    wroteFiles = true;
  }
  if (ensureTemplate && !fs.existsSync(referencedPath)) {
    fs.writeFileSync(referencedPath, filled);
    wroteFiles = true;
  }

  const templateTrimmed = filled.trim();
  const prevIndexContent = prevIndexPath && fs.existsSync(prevIndexPath)
    ? fs.readFileSync(prevIndexPath, 'utf8')
    : null;

  return {
    versionDir,
    versionName,
    createdDir,
    wroteFiles,
    copiedFiles,
    indexPath,
    referencedPath,
    template: filled,
    templateTrimmed,
    prevIndexPath,
    prevReferencedPath,
    prevIndexContent
  };
}

function listSections() {
  const topics = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{2}_/.test(d.name))
    .map(d => path.join(CONTENT_ROOT, d.name))
    .sort();
  const sections = [];
  for (const t of topics) {
    const secs = fs.readdirSync(t, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^\d{2}_/.test(d.name))
      .map(d => path.join(t, d.name))
      .sort();
    sections.push(...secs);
  }
  return sections;
}

function main() {
  const args = process.argv.slice(2);
  let profile = null;
  let skipCodex = false;
  let sectionArg = null;

  for (const arg of args) {
    if (arg.startsWith('--profile=')) {
      profile = arg.split('=')[1];
    } else if (arg === '--skip-codex') {
      skipCodex = true;
    } else if (arg === '--dry-run') {
      skipCodex = true;
    } else if (!sectionArg) {
      sectionArg = arg;
    }
  }
  
  const sections = listSections();
  if (sections.length === 0) {
    console.error('No sections found under ./content');
    process.exit(1);
  }
  const sectionPath = sectionArg ? path.join(ROOT, sectionArg) : sections[0];
  if (!fs.existsSync(sectionPath)) {
    console.error('Section does not exist:', sectionPath);
    process.exit(1);
  }
  const relSection = path.relative(ROOT, sectionPath);
  const initial = ensureNextVersion(sectionPath, {
    copyFromPrevious: !skipCodex,
    ensureTemplate: skipCodex
  });
  const { versionDir, versionName } = initial;
  const relVersion = path.relative(ROOT, versionDir);
  const creationNote = initial.createdDir ? '(created directory)' : '(existing directory)';
  console.log(`[gen] Next version ready: ${relVersion} ${creationNote}`);

  if (skipCodex) {
    if (!initial.wroteFiles && !initial.copiedFiles) {
      ensureNextVersion(sectionPath, { ensureTemplate: true });
    }
    console.log('[gen] Skipping Codex execution (dry run).');
    return;
  }

  const tmpFile = path.join(ROOT, '.tmp-prompt.md');
  const prompt = fs.readFileSync(PROMPT_FILE, 'utf8') + `\n\nSection: ${relSection}\n`;
  fs.writeFileSync(tmpFile, prompt);

  try {
    const profileFlag = profile ? `-p ${profile}` : '--dangerously-bypass-approvals-and-sandbox';
    const cmd = `codex -m gpt-5 ${profileFlag} exec "$(cat "${tmpFile}")"`;
    execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
  } finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }

  const post = ensureNextVersion(sectionPath, { ensureTemplate: true });
  const finalIndex = fs.readFileSync(post.indexPath, 'utf8');
  if (finalIndex.trim() === post.templateTrimmed) {
    console.warn(`[gen] Warning: ${relVersion}/index.md still matches the template. Codex may not have generated content.`);
  } else if (initial.prevIndexContent && finalIndex.trim() === initial.prevIndexContent.trim()) {
    console.warn(`[gen] Warning: ${relVersion}/index.md is identical to previous version. Codex may have skipped regeneration.`);
  }
}

main();
