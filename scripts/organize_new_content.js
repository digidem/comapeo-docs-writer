const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'content', 'new');
const IMAGES_DIR_NEW = path.join(SOURCE_DIR, 'images');
const CONTENT_ROOT = path.join(ROOT, 'content');
const OLD_DIR = path.join(CONTENT_ROOT, 'old');

const SECTION_MAP = {
    '10-Preparing to use CoMapeo': '01_preparing_to_use_comapeo_mobile',
    '20-Gathering Observations & Tracks': '02_gathering_observations',
    '30-Reviewing Observations & Tracks': '03_reviewing_observations',
    '40-Managing Data and Privacy': '05_managing_data_and_privacy',
    '50-Managing Projects': '04_managing_projects',
    '60-Exchanging Observations': '06_exchanging_observations',
    '70-Sharing and Exporting different data types': '07_sharing_observations_outside_of_comapeo_mobile',
    '80-Ending a project': '08_ending_a_project',
    '90+ - Miscellaneous': '11_miscellaneous',
    'Overview': '01_preparing_to_use_comapeo_mobile'
};

function snakeCase(str) {
    return str
        .toLowerCase()
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/__+/g, '_');
}

function parseFrontMatter(content) {
    const lines = content.split('\n');
    const metadata = {};
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            metadata[key] = value;
        }
    }
    return metadata;
}

function getCleanTitle(filename) {
    return filename.replace(/ [a-f0-9]{32}\.md$/, '');
}

// --- 0. Pre-process Source Files (Extract Base64 to content/new/images) ---
// This ensures the source files themselves are clean for grep, and simplifies subsequent processing.
if (fs.existsSync(SOURCE_DIR)) {
    if (!fs.existsSync(IMAGES_DIR_NEW)) {
        fs.mkdirSync(IMAGES_DIR_NEW, { recursive: true });
    }

    const sourceFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));
    
    sourceFiles.forEach(filename => {
        const filePath = path.join(SOURCE_DIR, filename);
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace base64 links/images with relative paths to extracted files
        const newContent = content.replace(/(!?)\[([^\]]*?)\]\(([^)]+?)\)/g, (match, prefix, alt, link) => {
            const cleanLink = link.trim();
            if (cleanLink.startsWith('data:image')) {
                const matchParts = cleanLink.match(/^data:image\/(\w+);base64,([\s\S]+)$/);
                if (matchParts) {
                    const ext = matchParts[1] === 'jpeg' ? 'jpg' : matchParts[1];
                    const data = matchParts[2].replace(/\s/g, '');
                    const buffer = Buffer.from(data, 'base64');
                    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 12);
                    const imageName = `extracted_${hash}.${ext}`;
                    const imagePath = path.join(IMAGES_DIR_NEW, imageName);

                    if (!fs.existsSync(imagePath)) {
                        fs.writeFileSync(imagePath, buffer);
                        console.log(`Extracted base64 image from ${filename} to ${imageName}`);
                    }
                    
                    modified = true;
                    // Return as standard markdown image link
                    return `![${alt}](./images/${imageName})`;
                }
            }
            return match;
        });

        if (modified) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated source file: ${filename}`);
        }
    });
}

// --- 1. Clean Content Directory ---
const items = fs.readdirSync(CONTENT_ROOT);
items.forEach(item => {
    const itemPath = path.join(CONTENT_ROOT, item);
    if (item === 'new' || item === 'old' || !fs.statSync(itemPath).isDirectory()) {
        return;
    }
    fs.rmSync(itemPath, { recursive: true, force: true });
});
console.log('Cleaned content directory (preserved new/ and old/).');

// --- 2. Analyze Existing Structure ---
const existingSections = new Map();
if (fs.existsSync(OLD_DIR)) {
    const topics = fs.readdirSync(OLD_DIR, { withFileTypes: true }).filter(d => d.isDirectory());
    topics.forEach(topic => {
        const sections = fs.readdirSync(path.join(OLD_DIR, topic.name), { withFileTypes: true }).filter(d => d.isDirectory());
        existingSections.set(topic.name, sections.map(s => s.name));
    });
}

// --- 3. Process New Content (Standard Logic) ---
// Now that source files are clean, we just process them normally.
const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));
const nodes = new Map();

files.forEach(filename => {
    const content = fs.readFileSync(path.join(SOURCE_DIR, filename), 'utf8');
    const metadata = parseFrontMatter(content);
    
    if (metadata['Publish Status'] && metadata['Publish Status'].trim().toLowerCase() === 'remove') {
        return;
    }

    let parentFilename = null;
    if (metadata['Parent item']) {
        const match = metadata['Parent item'].match(/\((.*?)\)$/);
        if (match) {
            try { parentFilename = decodeURIComponent(match[1]); } catch (e) { parentFilename = match[1]; }
        }
    }

    nodes.set(filename, {
        filename,
        cleanTitle: getCleanTitle(filename),
        section: metadata['Content Section'],
        order: parseInt(metadata['Page Order'] || metadata['Order'] || '0', 10),
        language: metadata['Language'],
        parentFilename,
        content,
        children: []
    });
});

const roots = [];
nodes.forEach(node => {
    if (node.parentFilename && nodes.has(node.parentFilename)) {
        nodes.get(node.parentFilename).children.push(node);
    } else {
        roots.push(node);
    }
});

roots.forEach(root => {
    let topicDir = SECTION_MAP[root.section];
    if (root.cleanTitle.toLowerCase().includes('glossary')) topicDir = '10_glossary';
    if (root.cleanTitle.toLowerCase().includes('troubleshooting')) topicDir = '09_troubleshooting';
    
    if (!topicDir) {
        topicDir = snakeCase(root.section || 'uncategorized');
    }

    let sectionDirName = null;
    const snakeTitle = snakeCase(root.cleanTitle);
    
    if (existingSections.has(topicDir)) {
        const existing = existingSections.get(topicDir);
        const match = existing.find(e => e.includes(snakeTitle) || snakeTitle.includes(e.replace(/^\d+_/, '')));
        if (match) sectionDirName = match;
    }
    
    if (!sectionDirName) {
        const prefix = root.order > 0 ? String(root.order).padStart(2, '0') : '00';
        sectionDirName = `${prefix}_${snakeTitle}`;
    }

    let contentNode = root.children.find(c => c.language === 'English');
    if (!contentNode) {
        if (root.language === 'English' || !root.language) {
            contentNode = root;
        } else {
            return;
        }
    }

    const sectionPath = path.join(CONTENT_ROOT, topicDir, sectionDirName);
    const templatePath = path.join(sectionPath, 'template');
    fs.mkdirSync(templatePath, { recursive: true });
    const imagesDir = path.join(templatePath, 'images');

    // The content is already cleaned of base64, so we just need to resolve image paths
    let newContent = contentNode.content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, link) => {
        const decodedLink = decodeURIComponent(link);
        const linkParts = decodedLink.split('/');
        if (linkParts.length > 1) {
            const imageName = linkParts[linkParts.length - 1];
            const resourceFolder = linkParts.slice(0, -1).join('/');
            
            const candidates = [
                path.join(SOURCE_DIR, resourceFolder, imageName),
                path.join(SOURCE_DIR, decodeURIComponent(resourceFolder), imageName),
                path.join(SOURCE_DIR, contentNode.cleanTitle, imageName),
                path.join(IMAGES_DIR_NEW, imageName) // Also check the new centralized images folder
            ];
            
            for (const srcPath of candidates) {
                if (fs.existsSync(srcPath)) {
                    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
                    fs.copyFileSync(srcPath, path.join(imagesDir, imageName));
                    return `![${alt}](./images/${imageName})`;
                }
            }
        }
        return match;
    });

    fs.writeFileSync(path.join(templatePath, 'template.md'), newContent);
});

console.log('Content reorganization complete.');