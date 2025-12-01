# CoMapeo Docs Writer

A content authoring workspace for CoMapeo Product Support documentation. Write and organize Markdown drafts, reference source materials under `context/`, and prepare sections for publication.

## Structure

- `context/` — Source of truth and codebase documentation
  - Module documentation (`01-*.md` through `06-*.md`) explains system architecture for agents
  - Style guide, templates, prompts for content generation
  - Source materials (quickstart guides, screenshots, legacy docs)
  - Content roadmap and deck materials
- `content/` — Your drafts by section. Each section version includes `index.md` and `referenced.md`.
- `scripts/` — Local helpers for previewing docs.
- `.github/` — PR template and CI automations.

## Getting Started

- Install dependencies: `npm i`
- Preview locally: `npm run docs` (builds and serves)
- Optional: `npm run docs:open` to open `http://localhost:4000`
- Lint Markdown: `npm run lint:md`

## Content Migration and Organization

If you have a bulk export of content (e.g. from Notion) placed in `content/new/`, you can use the organization script to automatically structure it into the repository's hierarchy.

1. Place markdown files and images in `content/new/`.
2. Run `node scripts/organize_new_content.js`.
   - This will archive existing content to `content/old/`.
   - It will process files in `content/new/` and create structured `template` directories in `content/`.
   - Files marked with `Publish Status: Remove` will be skipped.
3. Verify the structure in `content/`.

## Authoring Workflow (required)

[Codex](https://github.com/openai/codex) (terminal-based assistant) is used to process the `context/` materials and enforce the rules in this repo. It follows the constraints defined in `AGENTS.md` and the guidance in the `context/` files listed below, so drafts end up consistent and verifiable.

1) Create the section folder under `./content/<section_name>/` (use `snake_case`).
2) Use `context/templates/TODO.template.md` as a thinking aid (do not create `TODO.md` in sections).
3) Draft `index.md` following `context/system/STYLE_GUIDE.md` and `context/templates/SECTION.template.md`.
4) Add images:
   - Prefer existing assets under `context/sources/**` using relative links from your section.
   - If no image exists, create a placeholder file under `./content/<section_name>/images/placeholder_<topic>.txt` describing what to capture, and reference it with a visible TODO.
5) Create `referenced.md` as an exact copy of `index.md` and add inline `[Source: context/…]` annotations per claim or grouped list.
6) Add a final `Sources:` block at the end of `referenced.md` listing every `context/` file used. Do not add a `Sources` section to `index.md`.
7) Run the checklist in `context/system/AGENT_CONTENT_CHECKLIST.md` and fix any issues (links, images, style, naming).

### How Codex behaves (rules and guardrails)

- Source of truth is `context/` only. Codex does not invent details; if a detail is missing it inserts a visible `TODO:`.
- Starts from quickstart index to locate materials: `context/sources/quickstart_guides/INDEX.md`.
- Treats `context/sources/mapeo_docs/` as legacy (only high‑level background, no app‑specific instructions).
- Enforces structure and naming: versioned folders with `index.md` and `referenced.md`, `snake_case` folders, compact headings.
- Follows `context/system/STYLE_GUIDE.md` tone and `context/templates/SECTION.template.md` structure, so content reads consistently.
- Manages images per repo rules: prefer existing assets with relative links; otherwise creates precise placeholders under `content/<section>/images/`.
- Adds inline `[Source: context/…]` annotations in `referenced.md` and a final `Sources:` block there to make every claim traceable.
- Uses `context/system/AGENT_CONTENT_CHECKLIST.md` before marking a section complete.
- Obeys `AGENTS.md` for tool usage, minimal diffs, and safe iteration (no destructive changes, no secrets, focused patches).

Reference files:
- `AGENTS.md` — Agent guide with module reference table
- `context/01-content-generation-system.md` — Generation scripts and versioning
- `context/02-documentation-builder.md` — Static site builder and viewer
- `context/03-context-system.md` — Templates, prompts, sources
- `context/04-content-storage.md` — Content structure and conventions
- `context/05-utility-scripts.md` — Validation and maintenance tools
- `context/06-configuration-infrastructure.md` — Project setup and workflows
- `context/system/STYLE_GUIDE.md`
- `context/system/AGENT_CONTENT_CHECKLIST.md`
- `context/templates/SECTION.template.md`
- `context/templates/REFERENCED_SECTION.template.md`
- `context/templates/TODO.template.md`

## Conventions

- Use only information from `context/`. If a detail is missing, add `TODO:` and do not speculate.
- File/folder naming: `snake_case`, lowercase, ASCII.
- Use relative links to assets, for example: `![alt](context/sources/screenshots/photo_4997224093216518211_y.jpg)` when linking from within the `context/` tree, or relative paths from your section when linking assets in `context/`.
- Treat `context/sources/mapeo_docs/` as legacy: reuse only high‑level, non‑app‑specific background when strictly appropriate.

## Useful Commands

- `npm ci` — install deps from lockfile
- `npm run docs` — build and serve local preview
- `npm run docs:open` — open preview URL
- `npm run lint:md` — run Markdown lint

### Codex (prompt‑driven generation)
- `npm run gen:test` — Generate first three missing sections (non-interactive). Uses deck roadmap and sources; in read-only/never mode, Codex outputs an `apply_patch` you can apply manually.
  - Options: `npm run gen:test -- -m <model> -e <engine> -y` (e.g. `npm run gen:test -- -e gemini`)
- `npm run gen:all` — Generate all missing sections (non-interactive). Same behavior as above for read-only/never.
  - Options: `npm run gen:all -- -m <model> -e <engine> -y`
- `npm run gen` — Generate content for a specific section.
  - Usage: `npm run gen <section_path> -- [options]`
  - Options:
    - `-m, --model <model>`: Set the model (defaults to gpt-5.1, or gemini-3-pro-preview if engine is gemini).
    - `-e, --engine <engine>`: Set the engine (e.g. gemini). **Note: `-y` is implicitly active when engine is 'gemini'.**
    - `-y, --yes`: Bypass approval prompts (automatic execution).
    - `-p, --profile <profile>`: Use a Codex profile.
    - `--dry-run`: Skip Codex execution.
- `npm run gen:smoke` — Dry-run sanity check that scaffolds a test section without calling Codex (0 tokens) and verifies a new `v1/` is produced.
- `npm run gen:next` — Create next version for a content section.
  - **Smart Selection**: Automatically identifies the next logical section to work on (prioritizes new sections, then lowest versions).
  - Usage: `npm run gen:next -- [options]` (e.g., `npm run gen:next -- -e gemini`)
  - Override: To target a specific section, use `npm run gen:next <section_path>` or set `SECTION="<path>" npm run gen:next`.
- `npm run show-prompt` — **View generation prompt context** (for human analysis). Displays all context files that get injected into gen calls with statistics and file information.
  - Options:
    - `-c, --content`: Show full content of each file (default: summary only)
    - `--no-stats`: Hide statistics summary
    - `-s, --section <path>`: Specify target section path
    - `-o, --output <file>`: Write output to markdown file (auto-enables --content)
  - Examples:
    - `npm run show-prompt` - View summary in console
    - `npm run show-prompt -- --content` - View full content in console
    - `npm run show-prompt -- --output prompt-context.md` - Save to markdown file
- `npm run caption:all` — Propose captions for all images under `context/` (writes sidecars if permitted).
- `npm run caption` — Propose a caption for a single image (expects path in the interactive session or adapted script).
- `npm run check:links` — Check Markdown links across the repo (skips external links and template examples).

### Maintenance & Analysis
- `npm run audit` — **Smart Health Check**. Runs all visualization and scanning tools, then uses Codex to analyze the output and provide a prioritized list of action items.
- `node scripts/scan_health.js` — Run the structural integrity scanner (gaps, orphans).
- `node scripts/find_duplicates.js` — Scan for duplicate content or potential copy-paste errors.
- `node scripts/visualize_content.js` — Display a tree view of the `content/` folder with status indicators (✓/⚠/✘).
- `node scripts/visualize_context.js` — Display a tree view of the `context/` source library.

## Where to Start

### For Content Authors
- Locate materials via the quickstart index: `context/sources/quickstart_guides/INDEX.md`.
- Follow voice, tone, and structure guidance in `context/system/STYLE_GUIDE.md` and `context/templates/SECTION.template.md`.
- Check the content roadmap: `context/content_deck/INDEX.md` (summaries + folders) and `context/content_deck/MATERIALS_INDEX.md` (order only).

### For Agents/Developers
- Start with `AGENTS.md` for an overview and module reference table
- When working in a specific module, open the corresponding `context/*.md` file (e.g., `context/01-content-generation-system.md` for generation scripts)
- Follow the data flow: Context System (inputs) → Content Generation (processing) → Content Storage (outputs) → Documentation Builder (presentation)