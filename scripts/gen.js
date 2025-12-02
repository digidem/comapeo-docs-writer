#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  loadContextConfig,
  loadContextContent,
  validateContextFiles,
  getContextStats,
  listContextSets
} = require('./context-loader');

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'content');

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

function extractHumanName(sectionPath) {
  // Extract human-readable name from section path
  // Example: "content/01_topic/07_installing_comapeo" -> "installing comapeo"
  const basename = path.basename(sectionPath);
  return stripPrefix(basename).replace(/_/g, ' ').toLowerCase().trim();
}

function calculateWordSimilarity(query, target) {
  // Simple word-based similarity scoring
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const targetWords = target.toLowerCase().split(/\s+/).filter(Boolean);

  if (queryWords.length === 0 || targetWords.length === 0) return 0;

  let matchCount = 0;
  let positionBonus = 0;

  for (let i = 0; i < queryWords.length; i++) {
    const qWord = queryWords[i];
    for (let j = 0; j < targetWords.length; j++) {
      const tWord = targetWords[j];

      // Exact match
      if (qWord === tWord) {
        matchCount += 1;
        // Bonus for matching at similar positions
        if (i === j) positionBonus += 0.2;
        break;
      }

      // Partial match (word starts with query word)
      if (tWord.startsWith(qWord) && qWord.length >= 3) {
        matchCount += 0.7;
        if (i === j) positionBonus += 0.1;
        break;
      }

      // Fuzzy match (query word is contained in target word)
      if (tWord.includes(qWord) && qWord.length >= 4) {
        matchCount += 0.5;
        break;
      }
    }
  }

  // Score based on match ratio and position bonus
  const matchRatio = matchCount / queryWords.length;
  const coverageRatio = matchCount / Math.max(queryWords.length, targetWords.length);

  return Math.min(1.0, (matchRatio * 0.7) + (coverageRatio * 0.2) + positionBonus);
}

function findBestMatchingSection(query) {
  const allSections = listSections();
  let bestMatch = null;
  let bestScore = 0;
  const threshold = 0.3; // Minimum score to consider

  for (const sectionPath of allSections) {
    const humanName = extractHumanName(sectionPath);
    const score = calculateWordSimilarity(query, humanName);

    logDebug(`Comparing "${query}" with "${humanName}" (${path.relative(ROOT, sectionPath)}): score=${score.toFixed(3)}`);

    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = sectionPath;
    }
  }

  if (bestMatch) {
    const humanName = extractHumanName(bestMatch);
    return {
      path: bestMatch,
      humanName,
      score: bestScore
    };
  }

  return null;
}

function ensureNextVersion(sectionPath, { copyFromPrevious = false, ensureTemplate = false, sectionTemplatePath = null } = {}) {
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

  // Load section template
  let template;
  if (sectionTemplatePath && fs.existsSync(sectionTemplatePath)) {
    template = fs.readFileSync(sectionTemplatePath, 'utf8');
  } else {
    // Fallback to default template location for backward compatibility
    const defaultTemplatePath = path.join(ROOT, 'context', 'templates', 'SECTION.template.md');
    if (fs.existsSync(defaultTemplatePath)) {
      template = fs.readFileSync(defaultTemplatePath, 'utf8');
      logWarn(`Using default section template: ${path.relative(ROOT, defaultTemplatePath)}`);
    } else {
      throw new Error(`Section template not found. Tried: ${sectionTemplatePath || 'not specified'} and ${defaultTemplatePath}`);
    }
  }
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
  let contextSet = process.env.CONTEXT_SET || null;

  // Check for help flag early
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage: npm run gen [options] [section]

Options:
  -p, --profile PROFILE    Use specific Codex profile
  --skip-codex, --dry-run  Skip Codex execution (dry run)
  -m, --model MODEL        Specify AI model (default: gpt-5.1)
  -e, --engine ENGINE      Specify AI engine (gemini, etc.)
  -y, --yes                Auto-confirm all prompts
  -C, --context-set SET    Use specific context set (default: standard)
  -h, --help               Show this help message

Examples:
  npm run gen
  npm run gen -- --skip-codex
  npm run gen -- --context-set minimal
  npm run gen -- content/01_topic/07_section
  npm run gen -- "installing comapeo"  # Fuzzy search
`);
    return;
  }

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
    } else if (arg === '--context-set' || arg === '-C') {
      contextSet = args[++i];
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
  } else {
    // Check if sectionArg is a fuzzy query (no slashes) or an exact path
    if (!sectionArg.includes('/') && !sectionArg.includes(path.sep)) {
      logInfo(`Searching for section matching: ${color(sectionArg, 'blue')}`);
      const match = findBestMatchingSection(sectionArg);

      if (match) {
        logInfo(`Found match: ${color(match.humanName, 'green')} (score: ${color(match.score.toFixed(2), 'yellow')})`);
        logInfo(`Path: ${color(path.relative(ROOT, match.path), 'blue')}`);
        sectionArg = path.relative(ROOT, match.path);
      } else {
        logWarn(`No matching section found for query: "${sectionArg}"`);
        logInfo(`Available sections:`);
        const allSections = listSections();
        allSections.forEach(sec => {
          const humanName = extractHumanName(sec);
          logInfo(`  - ${humanName} (${path.relative(ROOT, sec)})`);
        });
        process.exit(1);
      }
    }
  }

  const sectionPath = sectionArg ? path.join(ROOT, sectionArg) : allSections[0];
  if (!fs.existsSync(sectionPath)) {
    logWarn(`Section does not exist: ${sectionPath}`);
    process.exit(1);
  }
  const relSection = path.relative(ROOT, sectionPath);
  logInfo(`Preparing next version for ${color(relSection, 'blue')}`);

  // Load context configuration early so we can get template path
  let contextConfig;
  try {
    contextConfig = loadContextConfig(contextSet);
    logInfo(`Using context set: ${color(contextConfig.contextSet, 'blue')} (${color(contextConfig.contextSetConfig.name, 'green')})`);
  } catch (error) {
    logWarn(`Failed to load context configuration: ${error.message}`);
    process.exit(1);
  }

  // Validate context files
  const validation = validateContextFiles(contextConfig.contextSetConfig.files);
  if (!validation.valid) {
    logWarn(`Missing required context files:`);
    validation.missingRequired.forEach(file => {
      logWarn(`  - ${file.name} (${file.path})`);
    });
    process.exit(1);
  }

  // Find section template path from configuration
  const sectionTemplateFile = contextConfig.contextSetConfig.files.find(file => file.id === 'section-template');
  const sectionTemplatePath = sectionTemplateFile ? sectionTemplateFile.absolutePath : null;
  if (sectionTemplatePath) {
    logDebug(`Using section template from config: ${path.relative(ROOT, sectionTemplatePath)}`);
  }

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
    ensureTemplate: skipCodex,
    sectionTemplatePath: sectionTemplatePath
  });
  const { versionDir, versionName } = initial;
  const relVersion = path.relative(ROOT, versionDir);
  const creationNote = initial.createdDir ? '(created directory)' : '(existing directory)';
  logInfo(`Next version ready: ${color(relVersion, 'blue')} ${creationNote}`);

  if (skipCodex) {
    if (!initial.wroteFiles && !initial.copiedFiles) {
      ensureNextVersion(sectionPath, {
        ensureTemplate: true,
        sectionTemplatePath: sectionTemplatePath
      });
    }
    logWarn('Skipping Codex execution (dry run).');
    return;
  }

  // Load context content
  let fullPromptContent;
  try {
    fullPromptContent = loadContextContent(contextConfig.contextSetConfig.files);
  } catch (error) {
    logWarn(`Failed to load context content: ${error.message}`);
    process.exit(1);
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
    
    let cmd;
    if (cliTool === 'gemini') {
      cmd = `${cliTool} -m ${targetModel} -p $'${escapedPrompt}'`;
    } else {
      cmd = `${cliTool} -m ${targetModel} ${cliToolFlags} $'${escapedPrompt}'`;
    }

    // Construct the command to log
    const logCmd = cmd;
    logInfo(`Invoking ${color(cliTool, 'blue')} with model ${color(targetModel, 'blue')} (${profile ? `profile ${profile}` : (autoConfirm ? 'auto-confirm' : 'interactive')})`);
    if (mcpFlags && cliTool === 'codex') logInfo(`Disabling MCP servers: ${color('yes', 'orange')}`);
    logDebug(`Command: ${logCmd}`);

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
