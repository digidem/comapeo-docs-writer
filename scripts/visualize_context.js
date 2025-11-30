
const fs = require('fs');
const path = require('path');

const CONTEXT_ROOT = path.join(__dirname, '../context');

// ANSI colors
const colors = {
    reset: "\x1b[0m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
};

function drawTree(dir, prefix = '') {
    const name = path.basename(dir);
    const stats = fs.statSync(dir);
    
    if (!stats.isDirectory()) {
        // It's a file
        console.log(`${prefix}${colors.gray}├── ${colors.reset}${name}`);
        return;
    }

    console.log(`${prefix}${colors.blue}📁 ${name}${colors.reset}`);

    const items = fs.readdirSync(dir).filter(item => !item.startsWith('.'));
    
    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const itemPath = path.join(dir, item);
        const connector = isLast ? '└── ' : '├── ';
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        
        if (fs.statSync(itemPath).isDirectory()) {
            console.log(`${prefix}${connector}${colors.blue}${item}${colors.reset}`);
            // Recurse
            const subItems = fs.readdirSync(itemPath).filter(i => !i.startsWith('.'));
            subItems.forEach((subItem, subIndex) => {
                 const subIsLast = subIndex === subItems.length - 1;
                 const subPath = path.join(itemPath, subItem);
                 drawSubTree(subPath, childPrefix + (subIsLast ? '    ' : '│   '), subIsLast);
            });
        } else {
             console.log(`${prefix}${connector}${colors.cyan}${item}${colors.reset}`);
        }
    });
}

function drawSubTree(fullPath, prefix, isLast) {
    const name = path.basename(fullPath);
    const stats = fs.statSync(fullPath);
    const connector = isLast ? '└── ' : '├── ';

    if (stats.isDirectory()) {
        console.log(`${prefix}${connector}${colors.blue}${name}${colors.reset}`);
        const items = fs.readdirSync(fullPath).filter(i => !i.startsWith('.'));
        items.forEach((item, index) => {
            const itemIsLast = index === items.length - 1;
            drawSubTree(path.join(fullPath, item), prefix + (isLast ? '    ' : '│   '), itemIsLast);
        });
    } else {
        console.log(`${prefix}${connector}${colors.cyan}${name}${colors.reset}`);
    }
}

// Simpler recursive approach for clean output
function printTree(dir, prefix = '') {
    const items = fs.readdirSync(dir).filter(item => !item.startsWith('.'));
    
    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        const marker = isLast ? '└── ' : '├── ';
        
        if (stats.isDirectory()) {
            console.log(`${prefix}${marker}${colors.blue}${item}${colors.reset}/`);
            printTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        } else {
            console.log(`${prefix}${marker}${colors.reset}${item}`);
        }
    });
}

console.log(`\n${colors.green}CONTEXT LIBRARY STRUCTURE:${colors.reset}\n`);
printTree(CONTEXT_ROOT);
