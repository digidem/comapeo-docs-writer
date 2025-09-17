# Claude Code Guide

This project follows a structured content-first approach. Your role is to work within established patterns and guidelines.

## Getting Started
- Use prompts under `context/prompts/` to guide work. These define entry points and link to process documentation.
- Reference `context/content_deck/INDEX.md` for content roadmap and priorities.

## Core Rules
- **Never modify** files under `context/templates/`. Templates are static; copy them when starting new versions.
- **Version all content** under `./content/<NN_topic>/<NN_section>/vN/` (e.g., `v1/index.md`). Site renders latest version with links to previous ones.
- **Follow template structure** from `context/templates/SECTION.template.md` and `REFERENCED_SECTION.template.md`:
  - Copy existing section content into `vN/index.md` with minimal improvements
  - Add new information strictly from `context/sources/**`
  - Follow `context/system/STYLE_GUIDE.md` and validate with `context/system/AGENT_CONTENT_CHECKLIST.md`
  - Keep "Sources:" only in `referenced.md` (never in `index.md`)
- **Minimal git staging**: Stage only specific files you modified, never use `git add -A`
- **Use generation tools**: Use `npm run gen:all`, `npm run gen:test` via Codex prompts under `context/prompts/` for content creation
- **Read-only environments**: Output valid apply_patch with minimal diffs when environment restricts file writes
- **Human validation**: Use `context/system/AGENT_CONTENT_CHECKLIST.md` to validate outputs; ensure all claims in `referenced.md` cite `context/` files

## References
- Style & tone: `context/system/STYLE_GUIDE.md`
- Review checklist: `context/system/AGENT_CONTENT_CHECKLIST.md`
- Templates: `context/templates/SECTION.template.md`, `context/templates/REFERENCED_SECTION.template.md`, `context/templates/TODO.template.md`
- Sources: `context/sources/**` and `context/content_deck/`

## File Conventions
- Use `snake_case`, lowercase, ASCII for filenames/folders
- Keep images local to each section
- Add visible TODOs for missing details not found in `context/`