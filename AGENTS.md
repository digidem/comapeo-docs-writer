# Agent Guide (Minimal)

This project is content‑first (low/no‑code). Your job is to produce clear, versioned Markdown docs by following our prompts and system guidelines.

## Context Overview

This document links into the `./context/` folder, where each module of the codebase is documented for the agent. The context files provide comprehensive information about system architecture, workflows, and best practices.

### Module Reference

| Module | File | Summary |
|--------|------|---------|
| Content Generation System | [`context/01-content-generation-system.md`](context/01-content-generation-system.md) | Codex-driven generation scripts, versioning logic, and prompt orchestration |
| Documentation Builder | [`context/02-documentation-builder.md`](context/02-documentation-builder.md) | Static site generation, viewer, and local preview server |
| Context System | [`context/03-context-system.md`](context/03-context-system.md) | Templates, prompts, style guides, source materials, and content roadmap |
| Content Storage | [`context/04-content-storage.md`](context/04-content-storage.md) | Versioned documentation structure, file conventions, and quality gates |
| Utility Scripts | [`context/05-utility-scripts.md`](context/05-utility-scripts.md) | Validation, image management, formatting, and maintenance tools |
| Configuration & Infrastructure | [`context/06-configuration-infrastructure.md`](context/06-configuration-infrastructure.md) | Project setup, npm scripts, Git conventions, and agent workflows |

## Start Here

### Quick Start for New Agents
1. **First time?** Read this file (`AGENTS.md`) completely
2. **Need to understand a module?** Use the Module Reference table above to find the right `context/*.md` file
3. **Generating content?** Start with [`context/01-content-generation-system.md`](context/01-content-generation-system.md) → Data Flow section
4. **Validating work?** Use [`context/system/AGENT_CONTENT_CHECKLIST.md`](context/system/AGENT_CONTENT_CHECKLIST.md)

### For Content Work
- Use the prompts under `context/prompts/` to drive work. Prompts define entry points and link to process docs.
- Roadmap: `context/content_deck/INDEX.md` is the source for what to create next and in what order.
- **When you need to operate in a specific module**, open the corresponding `context/*.md` file to view the summary and links to code files.

Non‑negotiable Rules
- Never modify files under `context/templates/`. Templates are static; copy them when starting a new version.
- All new content is versioned under `./content/<NN_topic>/<NN_section>/vN/` (e.g., `v1/index.md`). The site renders the latest version and links to previous ones.
- Use the structure from `context/templates/SECTION.template.md` and `REFERENCED_SECTION.template.md`:
  - Start by copying existing section content into `vN/index.md` (only minimal improvements if clearly better).
  - Complement with new information strictly from `context/sources/**`.
  - Ensure every new claim follows `context/system/STYLE_GUIDE.md` and passes `context/system/AGENT_CONTENT_CHECKLIST.md`.
  - Keep “Sources:” only in `referenced.md` (never in `index.md`).
- When committing, never run `git add -A`; stage only the specific files you modified to keep diffs minimal and focused.
 - Content generation is a content creation task, not a coding task. Do not write ad‑hoc scripts or automation to produce drafts; use Codex prompts under `context/prompts/` (e.g., `npm run gen:all`, `npm run gen:test`) to drive creation aligned with PROCESS, templates, and sources.
 - When the environment is read‑only or approvals are disabled (`never`), output a valid apply_patch patch with minimal diffs so that a maintainer can apply it. Include all file additions/updates required, and keep the patch self‑contained and correct.
 - Keep a human‑in‑the‑loop: validate outputs with `context/system/AGENT_CONTENT_CHECKLIST.md`, and ensure every new claim in `referenced.md` cites `context/` files.

References (do not duplicate rules here)
- Style & tone: `context/system/STYLE_GUIDE.md`
- Review checklist: `context/system/AGENT_CONTENT_CHECKLIST.md`
- Templates: `context/templates/SECTION.template.md`, `context/templates/REFERENCED_SECTION.template.md`, `context/templates/TODO.template.md`
- Sources of truth: `context/sources/**` and deck materials under `context/content_deck/`

Notes
- Filenames/folders use `snake_case`, lowercase, ASCII. Keep images local to each section.
- If a needed detail is not in `context/`, add a visible TODO rather than guessing.

## Usage for the Coding Agent

When you need to operate in module X, open `./context/<filename>.md` to view the summary and links to the code files.

**Navigation:**
- To add new modules: Create a new `context/0N-module-name.md` file following the established pattern (Purpose, Key Files, Major Functions, Dependencies, Context Engineering Considerations)
- To update modules: Edit the corresponding `.md` file in `context/`
- To understand data flow: Start with `context/03-context-system.md` (inputs) → `context/01-content-generation-system.md` (processing) → `context/04-content-storage.md` (outputs) → `context/02-documentation-builder.md` (presentation)

**Common Workflows:**
- **Generate content**: See `context/01-content-generation-system.md` → Data Flow section
- **Build docs**: See `context/02-documentation-builder.md` → Data Flow section
- **Validate content**: See `context/05-utility-scripts.md` → Common Workflows section
- **Update configuration**: See `context/06-configuration-infrastructure.md` → Configuration Updates section
