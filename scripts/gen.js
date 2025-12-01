#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');
const PROMPT_FILE = path.join(ROOT, 'context', 'prompts', 'create-next-version.md');
const SECTION_TEMPLATE = path.join(ROOT, 'context', 'templates', 'SECTION.template.md');
const STEP_BY_STEP_TEMPLATE = path.join(ROOT, 'context', 'templates', 'step-by-step.template.md');
const PROCESS_GUIDE = path.join(ROOT, 'context', 'system', 'PROCESS.md');
const STYLE_GUIDE = path.join(ROOT, 'context', 'system', 'STYLE_GUIDE.md');
const TONE_GUIDE = path.join(ROOT, 'context', 'system', 'TONE_GUIDE.md');
const CHECKLIST = path.join(ROOT, 'context', 'system', 'AGENT_CONTENT_CHECKLIST.md');
const GLOSSARY_REF = path.join(ROOT, 'context', 'system', 'GLOSSARY_REF.md');
const GOLD_STANDARD = path.join(ROOT, 'context', 'system', 'GOLD_STANDARD.md');

const COLORS = {
  reset: '\u001b[0m',
  blue: '\u001b[36m',
  orange: '\u001b[38;5;214m',
  green: '\u001b[32m',
  red: '\u001b[31m',
  magenta: '\u001b[35m',
  yellow: '\u001b[33m'
};
const DEBUG = Boolean(process.env.DEBUG && !['0', 'false', 'off', ''].includes(String(process.env.DEBUG).toLowerCase()));

const TAG = `${COLORS.orange}◼ GEN${COLORS.reset}`;

function color(text, tint) {
  return `${COLORS[tint] || ''}${text}${COLORS.reset}`;
}

function logInfo(message) {
  console.log(`${TAG} ${message}`);
}

function logSuccess(message) {
  console.log(`${TAG} ${color('✓', 'green')} ${message}`);
}

function logWarn(message) {
  console.warn(`${TAG} ${color('⚠', 'red')} ${message}`);
}

function logDebug(message) {
  if (DEBUG) {
    console.log(`${TAG} ${color('debug', 'magenta')} ${message}`);
  }
}

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
    logSuccess(`Created ${path.relative(ROOT, versionDir)}`);
  }
  const imagesDir = path.join(versionDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    logDebug(`Ensured images directory ${path.relative(ROOT, imagesDir)}`);
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
    logInfo(`Copied previous index.md from ${path.relative(ROOT, prevIndexPath)}`);
  }
  if (copyFromPrevious && prevReferencedPath && fs.existsSync(prevReferencedPath) && !fs.existsSync(referencedPath)) {
    fs.copyFileSync(prevReferencedPath, referencedPath);
    copiedFiles = true;
    logInfo(`Copied previous referenced.md from ${path.relative(ROOT, prevReferencedPath)}`);
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
          logDebug(`Copied image directory ${path.relative(ROOT, src)} -> ${path.relative(ROOT, dest)}`);
        } else if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          logDebug(`Copied image file ${path.relative(ROOT, src)} -> ${path.relative(ROOT, dest)}`);
        }
      }
    }
  }

  if (ensureTemplate && !fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, filled);
    wroteFiles = true;
    logWarn(`index.md missing – inserted section template for ${path.relative(ROOT, indexPath)}`);
  }
  if (ensureTemplate && !fs.existsSync(referencedPath)) {
    fs.writeFileSync(referencedPath, filled);
    wroteFiles = true;
    logWarn(`referenced.md missing – inserted section template for ${path.relative(ROOT, referencedPath)}`);
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

function getMcpDisableFlags() {
  try {
    const configPath = path.join(process.env.HOME, '.codex', 'config.toml');
    if (!fs.existsSync(configPath)) return '';
    
    const content = fs.readFileSync(configPath, 'utf8');
    // Simple regex to find [mcp_servers.NAME]
    // Does not support nested keys or complicated TOML, but sufficient for standard keys
    const serverNames = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*\[mcp_servers\.([^\]]+)\]/);
      if (match) {
        const name = match[1].trim();
        // Avoid capturing sub-properties like .env if they appear as separate sections
        // e.g. [mcp_servers.github.env]
        if (!name.includes('.')) {
          serverNames.push(name);
        }
      }
    }
    
    if (serverNames.length === 0) return '';

    logDebug(`Found MCP servers to disable: ${serverNames.join(', ')}`);
    // Construct flags: -c mcp_servers.name.enabled=false
    return serverNames.map(name => `-c mcp_servers.${name}.enabled=false`).join(' ');
  } catch (err) {
    logWarn(`Failed to parse config for MCP servers: ${err.message}`);
    return '';
  }
}

function main() {
  const args = process.argv.slice(2);
  let profile = null;
  let skipCodex = false;
  let sectionArg = null;
  let model = null;
  let engine = null;
  let autoConfirm = false;
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--profile=')) {
      profile = arg.split('=')[1];
    } else if (arg === '-p' || arg === '--profile') {
      profile = args[++i];
    } else if (arg === '--skip-codex' || arg === '--dry-run') {
      skipCodex = true;
    } else if (arg === '-m' || arg === '--model') {
      model = args[++i];
    } else if (arg === '-e' || arg === '--engine') {
      engine = args[++i];
    } else if (arg === '-y' || arg === '--yes') {
      autoConfirm = true;
    } else if (arg === '-h' || arg === '--help') {
      showHelp = true;
    } else if (!arg.startsWith('-') && !sectionArg) {
      sectionArg = arg;
    }
  }

  // Smart selection logic if no section is provided
  if (!sectionArg) {
    if (process.env.SECTION) {
      sectionArg = process.env.SECTION;
    } else {
      // Find the next logical section to work on
      const allSections = listSections();
      let bestCandidate = null;
      let lowestVersion = Infinity;

      for (const sec of allSections) {
        const entries = fs.readdirSync(sec, { withFileTypes: true });
        let maxV = 0;
        let hasVersion = false;
        for (const entry of entries) {
          const match = entry.name.match(/^v(\d+)$/);
          if (match) {
            hasVersion = true;
            maxV = Math.max(maxV, parseInt(match[1], 10));
          }
        }
        
        // Priority 1: Section has no versions (v0) - Pick immediately
        if (!hasVersion) {
          bestCandidate = sec;
          logInfo(`Auto-selecting new section: ${color(path.relative(ROOT, sec), 'blue')}`);
          break;
        }

        // Priority 2: Track section with lowest version number
        if (maxV < lowestVersion) {
          lowestVersion = maxV;
          bestCandidate = sec;
        }
      }
      
      if (bestCandidate) {
        sectionArg = path.relative(ROOT, bestCandidate);
        if (lowestVersion !== Infinity) {
           logInfo(`Auto-selecting section with version v${lowestVersion}: ${color(path.relative(ROOT, bestCandidate), 'blue')}`);
        }
      }
    }
  }

  const sectionPath = sectionArg ? path.join(ROOT, sectionArg) : sections[0];
  if (!fs.existsSync(sectionPath)) {
    logWarn(`Section does not exist: ${sectionPath}`);
    process.exit(1);
  }
  const relSection = path.relative(ROOT, sectionPath);
  logInfo(`Preparing next version for ${color(relSection, 'blue')}`);
  
  // Resolve model and enforce autoConfirm for gemini engine
  let targetModel = model;
  let mcpFlags = getMcpDisableFlags(); // Always disable MCPs for gen scripts

  if (!targetModel) {
    if (engine === 'gemini') {
      targetModel = 'gemini-3-pro-preview';
      autoConfirm = true; // Force autoConfirm if engine is gemini
    } else {
      targetModel = 'gpt-5.1';
    }
  } else if (engine === 'gemini') { 
    // If model is explicitly set, but engine is gemini, still force autoConfirm
    autoConfirm = true;
  }

  logInfo(`Configuration: Model=${color(targetModel, 'blue')}, Engine=${color(engine || 'default', 'blue')}, Auto-Confirm=${autoConfirm ? color('yes', 'green') : color('no', 'red')}`);
  if (mcpFlags) logInfo(`MCP Servers: ${color('Disabled', 'orange')}`);

  const initial = ensureNextVersion(sectionPath, {
    copyFromPrevious: !skipCodex,
    ensureTemplate: skipCodex
  });
  const { versionDir, versionName } = initial;
  const relVersion = path.relative(ROOT, versionDir);
  const creationNote = initial.createdDir ? '(created directory)' : '(existing directory)';
  logInfo(`Next version ready: ${color(relVersion, 'blue')} ${creationNote}`);

  if (skipCodex) {
    if (!initial.wroteFiles && !initial.copiedFiles) {
      ensureNextVersion(sectionPath, { ensureTemplate: true });
    }
    logWarn('Skipping Codex execution (dry run).');
    return;
  }

  const injectedContext = [
    { name: 'PROMPT: create-next-version.md', path: PROMPT_FILE },
    { name: 'TEMPLATE: SECTION.template.md', path: SECTION_TEMPLATE },
    { name: 'TEMPLATE: step-by-step.template.md', path: STEP_BY_STEP_TEMPLATE },
    { name: 'GUIDE: PROCESS.md', path: PROCESS_GUIDE },
    { name: 'GUIDE: STYLE_GUIDE.md', path: STYLE_GUIDE },
    { name: 'GUIDE: TONE_GUIDE.md', path: TONE_GUIDE },
    { name: 'GUIDE: AGENT_CONTENT_CHECKLIST.md', path: CHECKLIST },
    { name: 'GUIDE: GLOSSARY_REF.md', path: GLOSSARY_REF },
    { name: 'GUIDE: GOLD_STANDARD.md', path: GOLD_STANDARD }
  ];

  let fullPromptContent = '';
  for (const { name, path: filePath } of injectedContext) {
    if (fs.existsSync(filePath)) {
      fullPromptContent += `\n\n--- CONTEXT_FILE_START: ${name} ---\n`;
      fullPromptContent += fs.readFileSync(filePath, 'utf8');
      fullPromptContent += `\n--- CONTEXT_FILE_END: ${name} ---\n\n`;
    } else {
      logWarn(`Context file not found: ${filePath}. Skipping injection.`);
    }
  }

  // Add the specific section information at the end of the prompt
  fullPromptContent += `\n\nTarget: ${relVersion}\n`;

  if (skipCodex) {
    if (!initial.wroteFiles && !initial.copiedFiles) {
      ensureNextVersion(sectionPath, { ensureTemplate: true });
    }
    logWarn('Skipping Codex execution (dry run).');
    // For dry run, we can optionally print the fullPromptContent to verify
    // console.log(fullPromptContent);
    return;
  }

  try {
    const cliTool = (engine === 'gemini') ? 'gemini' : 'codex';
    let cliToolFlags = '';
    
    if (cliTool === 'codex') {
      const profileFlag = profile ? `-p ${profile}` : (autoConfirm ? '--dangerously-bypass-approvals-and-sandbox' : '');
      cliToolFlags += `${profileFlag} ${mcpFlags}`;
      if (engine === 'gemini') { // If it's codex, but we chose gemini engine, we still need to tell codex to use gemini provider
        cliToolFlags += ' -c model_provider=gemini';
      }
      cliToolFlags += ' exec'; // codex specific subcommand
    } else { // cliTool === 'gemini'
      // Assume gemini CLI is simpler, just takes -m and prompt, no specific approval/sandbox flags
      // autoConfirm is effectively "yes" by default when engine is gemini, so no extra flag needed
      // mcpFlags are codex-specific, so omit
      // model_provider flag is codex-specific, so omit
    }
    
    // Escape single quotes within the prompt content
    const escapedPrompt = fullPromptContent.replace(/'/g, "'\\''");
    
    // Construct the command to log
    const logCmd = `${cliTool} -m ${targetModel} ${cliToolFlags} $'${escapedPrompt}'`;
    logInfo(`Invoking ${color(cliTool, 'blue')} with model ${color(targetModel, 'blue')} (${profile ? `profile ${profile}` : (autoConfirm ? 'auto-confirm' : 'interactive')})`);
    if (mcpFlags && cliTool === 'codex') logInfo(`Disabling MCP servers: ${color('yes', 'orange')}`);
    logDebug(`Command: ${logCmd}`);
    
    const cmd = `${cliTool} -m ${targetModel} ${cliToolFlags} $'${escapedPrompt}'`; // Full command

    try {
      execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
      logSuccess(`Codex run completed for ${color(versionName, 'blue')}`);
    } catch (error) {
      logWarn(`Codex execution failed: ${error.message}`);
      process.exit(1);
    }

    // Verify content in the originally created version directory
    if (!fs.existsSync(initial.indexPath)) {
         logWarn(`${relVersion}/index.md missing. Codex might have deleted it.`);
         cleanupVersion(versionDir);
         return;
    }

    const finalIndex = fs.readFileSync(initial.indexPath, 'utf8');
    
    // Helper to normalize strings for comparison (ignore whitespace)
    const normalize = (str) => str.replace(/\s+/g, '');
    
    const isUnchanged = normalize(finalIndex) === normalize(initial.template);
    const hasTemplatePlaceholders = finalIndex.includes('[Concise, action‑oriented overview') || finalIndex.includes('[Topic 1]');
    
    // Check if Codex actually did anything
    if (isUnchanged || hasTemplatePlaceholders) {
      logWarn(`${relVersion}/index.md appears to be a skeleton (matches template or has placeholders). Removing empty version.`);
      cleanupVersion(versionDir);
    } else if (initial.prevIndexContent && normalize(finalIndex) === normalize(initial.prevIndexContent)) {
      logWarn(`${relVersion}/index.md is identical to previous version. Codex may have skipped regeneration. Removing duplicate version.`);
      cleanupVersion(versionDir);
    }
  } catch (err) { // This is the catch for the outer try block
    logWarn(`An unexpected error occurred during Codex execution: ${err.message}`);
    process.exit(1);
  }
}

function cleanupVersion(versionDir) {
  if (fs.existsSync(versionDir)) {
    try {
      fs.rmSync(versionDir, { recursive: true, force: true });
      logInfo(`Removed empty/skipped version directory: ${path.relative(ROOT, versionDir)}`);
    } catch (e) {
      logWarn(`Failed to cleanup version directory: ${e.message}`);
    }
  }
}

main();
