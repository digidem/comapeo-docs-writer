
const fs = require('fs');
const path = require('path');

const CONTENT_ROOT = path.join(__dirname, '../content');
const CONTEXT_ROOT = path.join(__dirname, '../context');

// Utility to get all markdown files recursively
function getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!file.startsWith('.')) getAllFiles(filePath, fileList);
        } else {
            if (file.endsWith('.md')) fileList.push(filePath);
        }
    });
    return fileList;
}

// Normalize text for comparison
function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[\[\]\(\)]/g, '') // Remove links, keep text
        .replace(/[#*`_\-]/g, '') // Remove common markdown chars
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}

// Jaccard Similarity (Set of shingles/words)
function getSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const set1 = new Set(text1.split(' '));
    const set2 = new Set(text2.split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
}

async function findDuplicates() {
    console.log("Scanning for content duplicates...");
    
    // 1. Get Content Files (Latest Versions Only)
    // Strategy: For each section, find the highest version folder.
    const contentFiles = [];
    const sections = [];
    
    const topics = fs.readdirSync(CONTENT_ROOT).filter(f => !f.startsWith('.'));
    topics.forEach(topic => {
        const topicPath = path.join(CONTENT_ROOT, topic);
        if (!fs.statSync(topicPath).isDirectory()) return;
        
        const subSections = fs.readdirSync(topicPath).filter(f => !f.startsWith('.'));
        subSections.forEach(section => {
            const sectionPath = path.join(topicPath, section);
            if (!fs.statSync(sectionPath).isDirectory()) return;
            
            const versions = fs.readdirSync(sectionPath).filter(v => v.startsWith('v'));
            if (versions.length > 0) {
                // Sort to get latest
                versions.sort((a, b) => parseInt(b.substring(1)) - parseInt(a.substring(1)));
                const latest = versions[0];
                const indexPath = path.join(sectionPath, latest, 'index.md');
                
                if (fs.existsSync(indexPath)) {
                    contentFiles.push(indexPath);
                }
            }
        });
    });

    // 2. Get Source Files (excluding some large/irrelevant ones if needed)
    const sourceFiles = getAllFiles(path.join(CONTEXT_ROOT, 'sources'));

    // 3. Compare Content vs Content (Internal Duplication)
    console.log(`\nComparing ${contentFiles.length} active content sections against each other...`);
    
    const contentCache = contentFiles.map(f => ({
        path: f,
        text: normalize(fs.readFileSync(f, 'utf-8')),
        name: path.relative(CONTENT_ROOT, f)
    }));

    for (let i = 0; i < contentCache.length; i++) {
        for (let j = i + 1; j < contentCache.length; j++) {
            const score = getSimilarity(contentCache[i].text, contentCache[j].text);
            if (score > 0.5) { // Threshold
                console.log(`\n⚠ High Similarity (${(score * 100).toFixed(1)}%):`);
                console.log(`  A: ${contentCache[i].name}`);
                console.log(`  B: ${contentCache[j].name}`);
            }
        }
    }

    // 4. Compare Content vs Sources (Source Fidelity / Redundancy)
    console.log(`\nComparing Content against ${sourceFiles.length} Source files...`);
    
    const sourceCache = sourceFiles.map(f => ({
        path: f,
        text: normalize(fs.readFileSync(f, 'utf-8')),
        name: path.relative(CONTEXT_ROOT, f)
    })).filter(s => s.text.length > 100); // Ignore tiny files

    contentCache.forEach(content => {
        let bestMatch = { score: 0, name: '' };
        
        sourceCache.forEach(source => {
            const score = getSimilarity(content.text, source.text);
            if (score > bestMatch.score) {
                bestMatch = { score, name: source.name };
            }
        });

        if (bestMatch.score > 0.7) {
             // This is actually good! It means the content follows the source closely.
             // But if it's 100%, it might just be a copy-paste.
             if (bestMatch.score > 0.95) {
                 console.log(`\nℹ Exact Copy Candidate (${(bestMatch.score * 100).toFixed(1)}%):`);
                 console.log(`  Content: ${content.name}`);
                 console.log(`  Source:  ${bestMatch.name}`);
             }
        }
    });
    
    console.log("\nScan complete.");
}

findDuplicates();
