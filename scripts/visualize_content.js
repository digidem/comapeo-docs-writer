
const fs = require('fs');
const path = require('path');

const CONTENT_ROOT = path.join(__dirname, '../content');

// ANSI colors
const colors = {
    reset: "\x1b[0m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
};

function printTree(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir).filter(item => !item.startsWith('.'));
    
    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        const marker = isLast ? '└── ' : '├── ';
        
        if (stats.isDirectory()) {
            let note = '';
            
            // Check content status for version folders
            if (/^v\d+$/.test(item)) {
                const hasIndex = fs.existsSync(path.join(fullPath, 'index.md'));
                const hasRef = fs.existsSync(path.join(fullPath, 'referenced.md'));
                if (hasIndex && hasRef) {
                    note = ` ${colors.green}✓${colors.reset}`;
                } else if (hasIndex || hasRef) {
                    note = ` ${colors.yellow}⚠ (Partial)${colors.reset}`;
                } else {
                    note = ` ${colors.red}✘ (Empty)${colors.reset}`;
                }
            }

            console.log(`${prefix}${marker}${colors.blue}${item}${colors.reset}/${note}`);
            printTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        } else {
            console.log(`${prefix}${marker}${colors.reset}${item}`);
        }
    });
}

console.log(`\n${colors.green}GENERATED CONTENT STRUCTURE:${colors.reset}\n`);
printTree(CONTENT_ROOT);
