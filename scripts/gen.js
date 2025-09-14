#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');
const PROMPT_FILE = path.join(ROOT, 'context', 'prompts', 'create-next-version.md');

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
  const arg = process.argv[2];
  const sections = listSections();
  if (sections.length === 0) {
    console.error('No sections found under ./content');
    process.exit(1);
  }
  const sectionPath = arg ? path.join(ROOT, arg) : sections[0];
  if (!fs.existsSync(sectionPath)) {
    console.error('Section does not exist:', sectionPath);
    process.exit(1);
  }
  const relSection = path.relative(ROOT, sectionPath);
  const prompt = fs.readFileSync(PROMPT_FILE, 'utf8') + `\n\nSection: ${relSection}\n`;
  const cmd = `codex --dangerously-bypass-approvals-and-sandbox exec "${prompt.replace(/"/g, '\\"')}"`;
  execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
}

main();

