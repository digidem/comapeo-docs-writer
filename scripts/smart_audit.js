
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
};

function runScript(scriptName) {
    try {
        console.log(`${colors.bold}${colors.blue}➤ Running ${scriptName}...${colors.reset}`);
        return execSync(`node scripts/${scriptName}`, { encoding: 'utf8' });
    } catch (error) {
        return `Error running ${scriptName}: ${error.message}`;
    }
}

async function smartAudit() {
    console.log(`${colors.bold}${colors.green}STARTING SMART AUDIT...${colors.reset}\n`);

    // 1. Run the inspection tools
    const contentTree = runScript('visualize_content.js');
    const healthScan = runScript('scan_health.js');
    const duplicates = runScript('find_duplicates.js');
    // Context tree is usually too large for a prompt context window, so we skip it or truncate it
    // const contextTree = runScript('visualize_context.js'); 

    // 2. Compose the Analysis Prompt
    const fullReport = `
# PROJECT HEALTH REPORT

## 1. CONTENT STRUCTURE (Visual)
${contentTree}

## 2. INTEGRITY SCAN (Health)
${healthScan}

## 3. DUPLICATE ANALYSIS
${duplicates}
`;

    console.log(`\n${colors.bold}${colors.blue}➤ Analyzing report with Codex (GPT-5.1)...${colors.reset}\n`);

    // 3. Execute Codex
    // We use the 'exec' command to send the prompt.
    // Escaping the report for the shell command is tricky, so we'll write it to a temp file
    // or a specific prompt file.
    
    const promptPath = path.join(__dirname, '../context/prompts/temp_audit_prompt.md');
    const promptContent = `
You are a Senior Technical Writer and Repository Maintainer. 
Below is the automated Health Report for the CoMapeo Documentation project.

Your task is to analyze this raw output and provide a concise, actionable summary.

**Report:**
${fullReport}

**Required Output Format:**
1. **Executive Summary**: 1-2 sentences on the overall state (e.g. "Early template stage", "Mature but disorganized").
2. **Critical Issues**: Bullet points of things that block deployment or break integrity (missing files, broken links).
3. **Action Items**: Prioritized list of what the developer/writer should do next.
4. **Optimization**: 1 suggestion for better organization if applicable.

Keep it professional and strictly based on the data provided.
`;
    
    fs.writeFileSync(promptPath, promptContent);

    try {
        // Adjusting command to use the globally available 'codex' if possible, or npx
        execSync(`codex -m gpt-5.1 --dangerously-bypass-approvals-and-sandbox exec "$(cat ${promptPath})"`, { stdio: 'inherit' });
    } catch (err) {
        console.error("Failed to run Codex analysis.", err);
    } finally {
        // Cleanup
        if (fs.existsSync(promptPath)) {
            fs.unlinkSync(promptPath);
        }
    }
}

smartAudit();
