
const fs = require('fs');
const path = require('path');

const CONTENT_ROOT = path.join(__dirname, '../content');
const CONTEXT_ROOT = path.join(__dirname, '../context');
const DECK_INDEX = path.join(CONTEXT_ROOT, 'content_deck/INDEX.md');

// ANSI colors for output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
    console.log('\n' + '='.repeat(50));
    console.log(message);
    console.log('='.repeat(50));
}

// 1. Parse Deck Index for "Intended" Structure
function getIntendedSections() {
    if (!fs.existsSync(DECK_INDEX)) {
        log(colors.red, `Error: Deck index not found at ${DECK_INDEX}`);
        return [];
    }
    const content = fs.readFileSync(DECK_INDEX, 'utf-8');
    const intended = [];
    const regex = /Folder: `\.\.\/\.\.\/(content\/[^`]+)`/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        intended.push(path.normalize(match[1]));
    }
    return intended;
}

// 2. Walk Directory Recursively
function walkDir(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            // Ignore hidden folders (like .git)
            if (!file.startsWith('.')) {
                fileList = walkDir(filePath, fileList);
            }
        } else {
            fileList.push(filePath);
        }
    });
    return fileList;
}

// Helper to get subdirectories
function getSubDirectories(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .map(file => path.join(dir, file))
        .filter(p => fs.statSync(p).isDirectory() && !path.basename(p).startsWith('.'));
}

// Main Audit Function
async function audit() {
    header("STARTING HEALTH SCAN");

    // --- Check 1: Intended vs Actual Sections ---
    const intendedPaths = getIntendedSections().map(p => path.join(__dirname, '../', p)); // Resolve to absolute
    const topicDirs = getSubDirectories(CONTENT_ROOT);
    
    const actualSections = [];
    topicDirs.forEach(topicDir => {
        const sections = getSubDirectories(topicDir);
        sections.forEach(section => actualSections.push(section));
    });

    const intendedSet = new Set(intendedPaths.map(p => path.resolve(p)));
    const actualSet = new Set(actualSections.map(p => path.resolve(p)));

    const missingOnDisk = [...intendedSet].filter(x => !actualSet.has(x));
    const orphansOnDisk = [...actualSet].filter(x => !intendedSet.has(x));

    header("1. STRUCTURE INTEGRITY (Deck vs Disk)");
    
    if (missingOnDisk.length === 0 && orphansOnDisk.length === 0) {
        log(colors.green, "✓ Deck and Disk are perfectly synced.");
    } else {
        if (missingOnDisk.length > 0) {
            log(colors.red, "MISSING ON DISK (Listed in Deck but not found):");
            missingOnDisk.forEach(p => console.log(`  - ${path.relative(CONTENT_ROOT, p)}`));
        }
        if (orphansOnDisk.length > 0) {
            log(colors.yellow, "ORPHANS ON DISK (Found on disk but not in Deck):");
            orphansOnDisk.forEach(p => console.log(`  - ${path.relative(CONTENT_ROOT, p)}`));
        }
    }

    // --- Check 2: Version Health (Gaps, Missing Pairs, Unused Images) ---
    header("2. VERSION HEALTH CHECK");
    
    let issuesFound = false;

    actualSections.forEach(sectionPath => {
        const sectionName = path.relative(CONTENT_ROOT, sectionPath);
        const versions = getSubDirectories(sectionPath)
            .map(p => path.basename(p))
            .filter(name => /^v\d+$/.test(name)); // Match v1, v2, etc.

        if (versions.length === 0) {
            // Ignore if it only has templates or is empty, but worth noting if it's an active section
             // check if it has templates
             const hasTemplate = fs.existsSync(path.join(sectionPath, 'template'));
             if(!hasTemplate) {
                 log(colors.yellow, `⚠ ${sectionName}: No versions found.`);
                 issuesFound = true;
             }
             return;
        }

        // Sort versions numerically
        versions.sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));

        // Check for Gaps
        const nums = versions.map(v => parseInt(v.substring(1)));
        for (let i = 0; i < nums.length; i++) {
            if (i > 0 && nums[i] !== nums[i - 1] + 1) {
                log(colors.red, `✘ ${sectionName}: Version gap detected (${versions[i-1]} -> ${versions[i]})`);
                issuesFound = true;
            }
        }

        // Check Inside Versions
        versions.forEach(ver => {
            const vPath = path.join(sectionPath, ver);
            const indexPath = path.join(vPath, 'index.md');
            const refPath = path.join(vPath, 'referenced.md');
            const imagesDir = path.join(vPath, 'images');

            const hasIndex = fs.existsSync(indexPath);
            const hasRef = fs.existsSync(refPath);

            if (!hasIndex || !hasRef) {
                log(colors.red, `✘ ${sectionName}/${ver}: Missing file pair. Index: ${hasIndex}, Ref: ${hasRef}`);
                issuesFound = true;
            }

            // Check Images
            if (fs.existsSync(imagesDir)) {
                const images = fs.readdirSync(imagesDir).filter(f => !f.startsWith('.'));
                if (images.length > 0) {
                    const indexContent = hasIndex ? fs.readFileSync(indexPath, 'utf-8') : '';
                    const refContent = hasRef ? fs.readFileSync(refPath, 'utf-8') : '';
                    
                    const unusedImages = images.filter(img => {
                        return !indexContent.includes(img) && !refContent.includes(img);
                    });

                    if (unusedImages.length > 0) {
                         log(colors.yellow, `⚠ ${sectionName}/${ver}: ${unusedImages.length} unused images found in folder.`);
                         // Uncomment to list details
                         // unusedImages.forEach(img => console.log(`    - ${img}`));
                         issuesFound = true;
                    }
                }
            }
        });
    });

    if (!issuesFound) {
        log(colors.green, "✓ No version health issues found.");
    }

    // --- Check 3: Source Usage (Basic) ---
    header("3. SOURCE USAGE (Referenced.md citations)");
    // Collect all citations from all referenced.md files
    const allCitations = new Set();
    actualSections.forEach(sectionPath => {
        const versions = getSubDirectories(sectionPath).filter(p => /^v\d+$/.test(path.basename(p)));
        versions.forEach(vPath => {
             const refPath = path.join(vPath, 'referenced.md');
             if (fs.existsSync(refPath)) {
                 const content = fs.readFileSync(refPath, 'utf-8');
                 // Look for [Source: path] or Sources: list
                 // Regex for [Source: context/...]
                 const inlineRegex = / \[Source:\s*(context\/[^\\\]]+)\]/g;
                 let match;
                 while ((match = inlineRegex.exec(content)) !== null) {
                     allCitations.add(path.resolve(path.join(__dirname, '../', match[1].trim())));
                 }
                 
                 // Also look for list items under "Sources:" block (simple check)
                 // This is harder to parse strictly without frontmatter or strict structure, 
                 // but we can search for lines containing "context/"
                 const lines = content.split('\n');
                 lines.forEach(line => {
                     if (line.includes('context/') && (line.trim().startsWith('-') || line.trim().startsWith('*'))) {
                         // Extract path
                         const pathMatch = line.match(/(context\/[\w.\/-]+)/);
                         if (pathMatch) {
                             allCitations.add(path.resolve(path.join(__dirname, '../', pathMatch[1])));
                         }
                     }
                 });
             }
        });
    });

    log(colors.blue, `Found ${allCitations.size} unique source files cited across all content.`);
    
    // Check if important sources are unused (Sample check: quickstart guides)
    const quickstartsDir = path.join(CONTEXT_ROOT, 'sources/quickstart_guides');
    if (fs.existsSync(quickstartsDir)) {
        const guides = walkDir(quickstartsDir).filter(f => f.endsWith('.md') && !f.endsWith('INDEX.md'));
        const unusedGuides = guides.filter(g => !allCitations.has(path.resolve(g)));
        
        if (unusedGuides.length > 0) {
            log(colors.yellow, `⚠ ${unusedGuides.length} Quickstart Guides are NOT cited in any content yet.`);
            if (unusedGuides.length < 10) {
                unusedGuides.forEach(g => console.log(`  - ${path.relative(CONTEXT_ROOT, g)}`));
            } else {
                console.log(`  (First 5):`);
                unusedGuides.slice(0, 5).forEach(g => console.log(`  - ${path.relative(CONTEXT_ROOT, g)}`));
            }
        } else {
            log(colors.green, "✓ All Quickstart Guides are cited.");
        }
    }
    
    header("SCAN COMPLETE");
}

audit().catch(err => console.error(err));
