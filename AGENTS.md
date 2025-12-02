# Agent Guide

> **Purpose**: This project is content‑first (low/no‑code). Your job is to produce clear, versioned Markdown docs by following our prompts and system guidelines.

## Quick Reference

**I want to...**
- **Generate content** → `npm run gen:all` or `npm run gen:test` ([details](context/manual/01-content-generation-system.md))
- **Preview docs locally** → `npm run docs` ([details](context/manual/02-documentation-builder.md))
- **Validate my work** → `npm run check:links` + [`context/system/AGENT_CONTENT_CHECKLIST.md`](context/system/AGENT_CONTENT_CHECKLIST.md)
- **Understand a module** → See Module Reference table below
- **Find source materials** → [`context/sources/quickstart_guides/INDEX.md`](context/sources/quickstart_guides/INDEX.md)
- **See what to build next** → [`context/content_deck/INDEX.md`](context/content_deck/INDEX.md)

## Module Reference

| Module | File | Tags | Summary |
|--------|------|------|---------|
| Content Generation System | [`context/manual/01-content-generation-system.md`](context/manual/01-content-generation-system.md) | `generation` `automation` `versioning` | Codex-driven generation scripts, versioning logic, and prompt orchestration |
| Documentation Builder | [`context/manual/02-documentation-builder.md`](context/manual/02-documentation-builder.md) | `build` `preview` `presentation` | Static site generation, viewer, and local preview server |
| Context System | [`context/manual/03-context-system.md`](context/manual/03-context-system.md) | `source-of-truth` `templates` `style` | Templates, prompts, style guides, source materials, and content roadmap |
| Content Storage | [`context/manual/04-content-storage.md`](context/manual/04-content-storage.md) | `content` `versioning` `structure` | Versioned documentation structure, file conventions, and quality gates |
| Utility Scripts | [`context/manual/05-utility-scripts.md`](context/manual/05-utility-scripts.md) | `validation` `maintenance` `tools` | Validation, image management, formatting, and maintenance tools |
| Configuration & Infrastructure | [`context/manual/06-configuration-infrastructure.md`](context/manual/06-configuration-infrastructure.md) | `infrastructure` `config` `git` | Project setup, npm scripts, Git conventions, and agent workflows |

### Filter by Tag
- **Content creation**: `generation`, `content`, `source-of-truth`
- **Quality assurance**: `validation`, `style`
- **Development workflow**: `build`, `preview`, `tools`, `versioning`
- **Project setup**: `infrastructure`, `config`, `git`

## Getting Started

### First-Time Agent Setup
1. **Read this file completely** (you are here)
2. **Install dependencies**: `npm ci`
3. **Verify setup**: `npm run docs` → open `http://localhost:4000`
4. **Check validation works**: `npm run check:links`
5. **Pick a task**: See [`context/content_deck/INDEX.md`](context/content_deck/INDEX.md) for roadmap

### Daily Workflow
```bash
# 1. Generate content (uses prompts in context/prompts/)
npm run gen:test  # First 3 sections
# or
npm run gen:all   # All sections

# 2. Validate
npm run check:links
npm run lint:md

# 3. Preview
npm run docs

# 4. Commit (stage specific files only)
git add <specific-files>
git commit -m "Descriptive message"
git push
```

## Non‑Negotiable Rules

### Templates (NEVER MODIFY)
- ❌ **Do not edit** files under `context/templates/`
- ✅ **Copy them** when creating new versions
- 📍 Templates: [`SECTION.template.md`](context/templates/SECTION.template.md), [`REFERENCED_SECTION.template.md`](context/templates/REFERENCED_SECTION.template.md), [`TODO.template.md`](context/templates/TODO.template.md)

### Versioning (ALWAYS FOLLOW)
- All content lives under `./content/<NN_topic>/<NN_section>/vN/`
- Version format: `v1`, `v2`, `v3` (monotonically increasing, no gaps)
- Each version contains: `index.md`, `referenced.md`, `images/`
- Latest version = highest number (auto-detected by site builder)

### Content Structure (USE TEMPLATES)
1. Copy existing `vN/index.md` as starting point (or use template)
2. Add new information **only from** `context/sources/**`
3. Create `referenced.md` with inline `[Source: context/...]` citations
4. Add `Sources:` block **only** in `referenced.md` (never in `index.md`)
5. Validate with [`AGENT_CONTENT_CHECKLIST.md`](context/system/AGENT_CONTENT_CHECKLIST.md)

### Git Workflow (MINIMAL DIFFS)
- ❌ **Never** run `git add -A`
- ✅ **Always** stage specific files: `git add <file1> <file2>`
- 📝 **Write** descriptive commit messages
- 🔍 **Review** diffs before committing: `git diff <file>`

### Content Generation (USE CODEX, NOT SCRIPTS)
- ✅ Use `npm run gen:*` commands (driven by prompts in `context/prompts/`)
- ❌ Do not write ad-hoc scripts to generate content
- 📖 Follow [`context/system/PROCESS.md`](context/system/PROCESS.md)
- ✅ When read-only mode: output valid `apply_patch` for maintainer

### Source of Truth (CONTEXT ONLY)
- ✅ Use **only** information from `context/` folder
- ❌ Do not invent or speculate details
- 📝 If detail missing: add visible `TODO:` marker
- 🎯 Citations: every claim in `referenced.md` must cite a `context/` file

## Examples

### Example 1: Generating a New Version
```bash
# Check what sections exist
ls content/01_preparing_to_use_comapeo_mobile/

# Generate next version for specific section
SECTION="content/01_preparing_to_use_comapeo_mobile/01_understanding_comapeo_s_core_concepts_and_functions" npm run gen:next

# Generated files:
# - vN/index.md
# - vN/referenced.md
# - vN/images/
```

### Example 2: Validating Content
```bash
# Run all validations
npm run check:links     # Check Markdown links
npm run lint:md         # Lint Markdown files

# Manual checklist
cat context/system/AGENT_CONTENT_CHECKLIST.md
```

### Example 3: Committing Changes
```bash
# Good (specific files)
git add content/01_preparing_to_use_comapeo_mobile/01_understanding/v2/index.md
git add content/01_preparing_to_use_comapeo_mobile/01_understanding/v2/referenced.md
git commit -m "Add v2 of understanding core concepts section"

# Bad (avoid)
git add -A  # ❌ Adds everything indiscriminately
```

## File Conventions

- **Naming**: `snake_case`, lowercase, ASCII only
- **Images**: Keep local to each version (`vN/images/`)
- **Links**: Use relative paths (e.g., `./images/screenshot.png` or `../../../context/sources/screenshots/photo.jpg`)

## Key References

### For Content Work
- **Style & tone**: [`context/system/STYLE_GUIDE.md`](context/system/STYLE_GUIDE.md)
- **Process**: [`context/system/PROCESS.md`](context/system/PROCESS.md)
- **Validation checklist**: [`context/system/AGENT_CONTENT_CHECKLIST.md`](context/system/AGENT_CONTENT_CHECKLIST.md)
- **Content roadmap**: [`context/content_deck/INDEX.md`](context/content_deck/INDEX.md)

### For Code Work
- **Module navigation**: Use table above to find `context/*.md` files
- **Data flow**: `context/manual/03-context-system.md` (inputs) → `context/manual/01-content-generation-system.md` (processing) → `context/manual/04-content-storage.md` (outputs) → `context/manual/02-documentation-builder.md` (presentation)
- **Adding modules**: Create `context/0N-module-name.md` following established pattern (Purpose, Key Files, Major Functions, Dependencies, Context Engineering Considerations)

---

**Learn more**: [GitHub's AGENTS.md Guide](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) | [Anthropic's Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | [AGENTS.md Standard](https://agents.md/)
