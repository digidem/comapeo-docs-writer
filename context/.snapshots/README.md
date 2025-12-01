# Prompt Context Snapshots

**⚠️ HUMAN USE ONLY - NOT FOR LLM CONSUMPTION**

This folder contains automatically generated snapshots of the prompt context that gets injected into content generation calls. These files are for human analysis, debugging, and documentation purposes only.

## Files

### `prompt_summary.md`
Quick reference snapshot showing:
- Table of contents of all context files
- Statistics (file count, total size, lines, token estimates)
- File metadata (paths, sizes, line counts)

**Use this for:** Quick overview, checking what files are included, understanding prompt structure

### `prompt_full.md`
Complete snapshot including:
- Everything from summary
- Full content of each context file in markdown code blocks

**Use this for:** Deep analysis, debugging generation issues, understanding exact prompt content

## Purpose

These snapshots help with:
1. **Debugging** - See exactly what the AI receives during generation
2. **Change Tracking** - Git history shows how context evolves over time
3. **Onboarding** - New contributors can understand the generation system
4. **Audit Trail** - Historical snapshots for troubleshooting issues
5. **Documentation** - Self-documenting generation system architecture

## How They're Generated

A GitHub Action automatically runs whenever context files change:
- Trigger: Push to main branch
- Generator: `npm run show-prompt` with different flags
- Update: Only commits when files actually change

## Important Notes

- **DO NOT** reference these files in prompts or context files
- **DO NOT** have LLMs read these files - they create circular references
- **DO** use them for human analysis and debugging
- **DO** keep them up to date (automated via GitHub Actions)

## Manual Generation

To regenerate locally:

```bash
# Summary only
npm run show-prompt -- --output context/.snapshots/prompt_summary.md --no-stats

# Full content
npm run show-prompt -- --output context/.snapshots/prompt_full.md
```

---

Last updated: Automatically via GitHub Actions on every context file change
