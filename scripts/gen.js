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
  const args = process.argv.slice(2);
  const profileArg = args.find(arg => arg.startsWith('--profile='));
  const profile = profileArg ? profileArg.split('=')[1] : null;
  const sectionArg = args.find(arg => !arg.startsWith('--'));
  
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
  
  // Create a temporary file with the complete prompt
  const tmpFile = path.join(ROOT, '.tmp-prompt.md');
  const prompt = fs.readFileSync(PROMPT_FILE, 'utf8') + `\n\nSection: ${relSection}\n`;
  fs.writeFileSync(tmpFile, prompt);
  
  try {
    const profileFlag = profile ? `-p ${profile}` : '--dangerously-bypass-approvals-and-sandbox';
    const cmd = `codex ${profileFlag} exec "$(cat "${tmpFile}")"`;
    execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
}

main();

