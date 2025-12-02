#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  loadContextConfig,
  getContextStats,
  loadContextContent,
  validateContextFiles,
  listContextSets,
  formatBytes
} = require('./context-loader');

const ROOT = process.cwd();

function estimateTokens(text) {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// Output buffer for file writing
let outputBuffer = [];
let isFileOutput = false;

function output(text = '') {
  if (isFileOutput) {
    outputBuffer.push(text);
  } else {
    console.log(text);
  }
}

function printSeparator(char = '=', width = 80) {
  if (isFileOutput) {
    output(''); // Add blank line for markdown readability
  } else {
    output(char.repeat(width));
  }
}

function printHeader(title, width = 80) {
  if (isFileOutput) {
    output(`# ${title.toUpperCase()}`);
    output('');
  } else {
    printSeparator('=', width);
    const padding = Math.floor((width - title.length - 2) / 2);
    output(' '.repeat(padding) + title.toUpperCase());
    printSeparator('=', width);
    output();
  }
}

function printSection(title, width = 80) {
  if (isFileOutput) {
    output('');
    output(`## ${title}`);
    output('');
  } else {
    output();
    printSeparator('-', width);
    output(`  ${title}`);
    printSeparator('-', width);
    output();
  }
}

function printFileInfo(name, filePath, content) {
  const relPath = path.relative(ROOT, filePath);
  const size = Buffer.byteLength(content, 'utf8');
  const tokens = estimateTokens(content);
  const lines = content.split('\n').length;

  if (isFileOutput) {
    output(`### ${name}`);
    output('');
    output(`- **Path**: \`${relPath}\``);
    output(`- **Size**: ${formatBytes(size)}`);
    output(`- **Lines**: ${lines.toLocaleString()}`);
    output(`- **Tokens**: ~${tokens.toLocaleString()}`);
    output('');
  } else {
    output(`📄 ${name}`);
    output(`   Path:   ${relPath}`);
    output(`   Size:   ${formatBytes(size)}`);
    output(`   Lines:  ${lines}`);
    output(`   Tokens: ~${tokens.toLocaleString()}`);
    output();
  }
}

function main() {
  const args = process.argv.slice(2);
  let showContent = false;
  let showStats = true;
  let section = null;
  let outputFile = null;
  let contextSet = null;
  let listSets = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--content' || arg === '-c') {
      showContent = true;
    } else if (arg === '--no-stats') {
      showStats = false;
    } else if (arg === '--section' || arg === '-s') {
      section = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      outputFile = args[++i];
      showContent = true; // Auto-enable content when outputting to file
    } else if (arg === '--context-set' || arg === '-C') {
      contextSet = args[++i];
    } else if (arg === '--list-sets' || arg === '-l') {
      listSets = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: npm run show-prompt [options]

Options:
  -c, --content           Show full content of each file (default: summary only)
  --no-stats              Hide statistics summary
  -s, --section PATH      Specify target section path
  -o, --output FILE       Write output to markdown file (auto-enables --content)
  -C, --context-set NAME  Use specific context set (default: standard)
  -l, --list-sets         List available context sets
  -h, --help              Show this help message

Examples:
  npm run show-prompt
  npm run show-prompt -- --content
  npm run show-prompt -- --output prompt-context.md
  npm run show-prompt -- --section content/01_preparing_to_use_comapeo_mobile/07_installing_comapeo_and_onboarding
  npm run show-prompt -- --context-set minimal
  npm run show-prompt -- --list-sets
`);
      return;
    }
  }

  // Handle --list-sets option
  if (listSets) {
    const sets = listContextSets();
    if (sets.length === 0) {
      console.log('No context sets found. Make sure context-config.json exists.');
      return;
    }

    console.log('Available context sets:');
    for (const set of sets) {
      console.log(`  ${set.key}${set.isDefault ? ' (default)' : ''}`);
      console.log(`    Name: ${set.name}`);
      console.log(`    Description: ${set.description}`);
      console.log(`    Files: ${set.fileCount}`);
      console.log();
    }
    return;
  }

  // Load context configuration
  let contextConfig;
  try {
    contextConfig = loadContextConfig(contextSet);
  } catch (error) {
    console.error(`❌ Failed to load context configuration: ${error.message}`);
    process.exit(1);
  }

  const contextFiles = contextConfig.contextSetConfig.files;

  // Set file output mode if outputFile is specified
  if (outputFile) {
    isFileOutput = true;
    outputBuffer = [];
  }

  printHeader('Generation Prompt Viewer', 80);

  output('This shows the complete context that gets injected into each generation call.');
  output('The gen.js script combines these files into a single prompt for the AI.');
  output(`Using context set: ${contextConfig.contextSet} (${contextConfig.contextSetConfig.name})`);
  output('');

  // Table of Contents
  printSection('📑 TABLE OF CONTENTS');

  const categories = {};
  for (const file of contextFiles) {
    if (!categories[file.category]) {
      categories[file.category] = [];
    }
    categories[file.category].push(file);
  }

  let fileIndex = 1;
  for (const [category, files] of Object.entries(categories)) {
    output('');
    if (isFileOutput) {
      output(`**${category}:**`);
    } else {
      output(category + ':');
    }
    for (const file of files) {
      const exists = fs.existsSync(file.absolutePath);
      const status = exists ? '✓' : '✗';
      if (isFileOutput) {
        output(`${fileIndex}. [${status}] ${file.name}`);
      } else {
        output(`  ${fileIndex}. [${status}] ${file.name}`);
      }
      fileIndex++;
    }
  }

  // Statistics Summary
  if (showStats) {
    printSection('📊 STATISTICS SUMMARY');

    let totalSize = 0;
    let totalTokens = 0;
    let totalLines = 0;
    let filesFound = 0;

    for (const file of contextFiles) {
      if (fs.existsSync(file.absolutePath)) {
        const content = fs.readFileSync(file.absolutePath, 'utf8');
        const size = Buffer.byteLength(content, 'utf8');
        totalSize += size;
        totalTokens += estimateTokens(content);
        totalLines += content.split('\n').length;
        filesFound++;
      }
    }

    if (isFileOutput) {
      output(`- **Files Found**: ${filesFound}/${contextFiles.length}`);
      output(`- **Total Size**: ${formatBytes(totalSize)}`);
      output(`- **Total Lines**: ${totalLines.toLocaleString()}`);
      output(`- **Total Tokens**: ~${totalTokens.toLocaleString()}`);
      if (section) {
        output('');
        output(`- **Target Section**: ${section}`);
      }
    } else {
      output(`Files Found:    ${filesFound}/${contextFiles.length}`);
      output(`Total Size:     ${formatBytes(totalSize)}`);
      output(`Total Lines:    ${totalLines.toLocaleString()}`);
      output(`Total Tokens:   ~${totalTokens.toLocaleString()}`);
      if (section) {
        output(`\nTarget Section: ${section}`);
      }
    }
  }

  // File Contents
  printSection('📚 CONTEXT FILES');

  for (const [category, files] of Object.entries(categories)) {
    if (isFileOutput) {
      output('');
      output('---');
      output('');
      output(`### ${category.toUpperCase()}`);
      output('');
    } else {
      output(`\n${'='.repeat(80)}`);
      output(`  ${category.toUpperCase()}`);
      output(`${'='.repeat(80)}\n`);
    }

    for (const file of files) {
      if (fs.existsSync(file.absolutePath)) {
        const content = fs.readFileSync(file.absolutePath, 'utf8');
        printFileInfo(file.name, file.absolutePath, content);

        if (showContent) {
          if (isFileOutput) {
            output('#### Content');
            output('');
            output('```markdown');
            output(content);
            output('```');
            output('');
          } else {
            output('┌' + '─'.repeat(78) + '┐');
            output('│ CONTENT' + ' '.repeat(70) + '│');
            output('└' + '─'.repeat(78) + '┘');
            output();

            // Add line numbers to content for easier reference
            const lines = content.split('\n');
            const maxLineNumWidth = String(lines.length).length;
            lines.forEach((line, idx) => {
              const lineNum = String(idx + 1).padStart(maxLineNumWidth, ' ');
              output(`${lineNum} │ ${line}`);
            });

            output();
            output('┌' + '─'.repeat(78) + '┐');
            output('│ END OF CONTENT' + ' '.repeat(63) + '│');
            output('└' + '─'.repeat(78) + '┘');
            output('\n');
          }
        }
      } else {
        if (isFileOutput) {
          output(`### ❌ ${file.name}`);
          output('');
          output(`- **Path**: \`${path.relative(ROOT, file.absolutePath)}\``);
          output(`- **Status**: FILE NOT FOUND`);
          output('');
        } else {
          output(`❌ ${file.name}`);
          output(`   Path: ${path.relative(ROOT, file.absolutePath)}`);
          output(`   Status: FILE NOT FOUND\n`);
        }
      }
    }
  }

  // Final Summary
  if (section) {
    printSection('🎯 TARGET SECTION');
    output(`The AI will work on: ${section}`);
    output('');
  }

  printHeader('End of Prompt Context', 80);
  output('');

  if (!showContent && !isFileOutput) {
    output('💡 Tip: Run with --content flag to see full file contents');
    output('   Example: npm run show-prompt -- --content');
    output('');
  }

  // Write to file if outputFile is specified
  if (outputFile) {
    try {
      const outputPath = path.isAbsolute(outputFile) ? outputFile : path.join(ROOT, outputFile);
      fs.writeFileSync(outputPath, outputBuffer.join('\n'), 'utf8');
      console.log(`✅ Output written to: ${path.relative(ROOT, outputPath)}`);
      console.log(`   Size: ${formatBytes(Buffer.byteLength(outputBuffer.join('\n'), 'utf8'))}`);
      console.log(`   Lines: ${outputBuffer.length.toLocaleString()}`);
    } catch (error) {
      console.error(`❌ Failed to write file: ${error.message}`);
      process.exit(1);
    }
  }
}

main();
