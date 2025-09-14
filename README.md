# CoMapeo Docs Writer

A content authoring workspace for CoMapeo Product Support documentation. Write and organize Markdown drafts, reference source materials under `context/`, and prepare sections for publication.

## Structure

- `context/` — Source of truth (style guide, templates, quickstart materials, images). Do not edit originals.
- `content/` — Your drafts by section. Each section version includes `index.md` and `referenced.md`.
- `scripts/` — Local helpers for previewing docs.
- `.github/` — PR template and CI automations.

## Getting Started

- Install dependencies: `npm i`
- Preview locally: `npm run docs` (builds and serves)
- Optional: `npm run docs:open` to open `http://localhost:4000`
- Lint Markdown: `npm run lint:md`

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
- `AGENTS.md`
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
- `npm run gen:test` — Generate first three missing sections (non‑interactive). Uses deck roadmap and sources; in read‑only/never mode, Codex outputs an `apply_patch` you can apply manually.
- `npm run gen:all` — Generate all missing sections (non‑interactive). Same behavior as above for read‑only/never.
- `npm run gen:next` — Create next version for a specific section. Provide the section path via env var:
  - `SECTION="content/01_preparing_to_use_comapeo_mobile/01_understanding_comapeo_s_core_concepts_and_functions" npm run gen:next`
- `npm run caption:all` — Propose captions for all images under `context/` (writes sidecars if permitted).
- `npm run caption` — Propose a caption for a single image (expects path in the interactive session or adapted script).
- `npm run check:links` — Check Markdown links across the repo (skips external links and template examples).

## Where to Start

- Locate materials via the quickstart index: `context/sources/quickstart_guides/INDEX.md`.
- Follow voice, tone, and structure guidance in `context/system/STYLE_GUIDE.md` and `context/templates/SECTION.template.md`.
- Check the content roadmap: `context/content_deck/INDEX.md` (summaries + folders) and `context/content_deck/MATERIALS_INDEX.md` (order only).
