# CoMapeo Docs Writer

A content authoring workspace for CoMapeo Product Support documentation. Write and organize Markdown drafts, reference source materials under `context/`, and prepare sections for publication.

## Structure

- `context/` — Source of truth (style guide, templates, quickstart materials, images). Do not edit originals.
- `content/` — Your drafts by section. Each section must include `index.md`, `referenced.md`, and `TODO.md`.
- `scripts/` — Local helpers for previewing docs.
- `.github/` — PR template and CI automations.

## Getting Started

- Install dependencies: `npm ci`
- Lint Markdown: `npm run lint:md`
- Preview locally (no build required):
  - Start server: `npm run docs:serve`
  - Open: `npm run docs:open` (opens `http://localhost:4000`)
- Tests: `npm test` (placeholder)

## Authoring Workflow (required)

1) Create the section folder under `./content/<section_name>/` (use `snake_case`).
2) Copy the TODO template: `cp context/templates/TODO.template.md content/<section_name>/TODO.md` and fill it.
3) Draft `index.md` following `context/STYLE_GUIDE.md` and `context/templates/SECTION.template.md`.
4) Add images:
   - Prefer existing assets under `context/comapeo_support_materials/**` using relative links from your section.
   - If no image exists, create a placeholder file under `./content/<section_name>/images/placeholder_<topic>.txt` describing what to capture, and reference it with a visible TODO.
5) Create `referenced.md` as an exact copy of `index.md` and add inline `[Source: context/…]` annotations per claim or grouped list.
6) Add a final `Sources:` block at the end listing every `context/` file used.
7) Run the checklist in `context/AGENT_CONTENT_CHECKLIST.md` and fix any issues (links, images, style, naming).

## Conventions

- Use only information from `context/`. If a detail is missing, add `TODO:` and do not speculate.
- File/folder naming: `snake_case`, lowercase, ASCII.
- Use relative links to assets, for example: `![alt](./comapeo_support_materials/screenshots/example.png)` when linking from within the `context/` tree, or relative paths from your section when linking assets in `context/`.
- Treat `context/comapeo_support_materials/mapeo_docs/` as legacy: reuse only high‑level, non‑app‑specific background when strictly appropriate.

## Useful Commands

- `npm ci` — install deps from lockfile
- `npm run lint:md` — run Markdown lint
- `npm run docs:serve` — serve local preview
- `npm run docs:open` — open preview URL
- `npm test` — placeholder

## Where to Start

- Locate materials via the quickstart index: `context/comapeo_support_materials/quickstart_guides/INDEX.md`.
- Follow voice, tone, and structure guidance in `context/STYLE_GUIDE.md` and `context/templates/SECTION.template.md`.
- Check the content roadmap: `context/CONTENT_INDEX.txt` and `context/MATERIALS_INDEX.md`.

---

Sources: context/STYLE_GUIDE.md; context/AGENT_CONTENT_CHECKLIST.md; context/templates/SECTION.template.md; context/templates/REFERENCED_SECTION.template.md; context/templates/TODO.template.md; context/CONTENT_INDEX.txt; context/MATERIALS_INDEX.md; context/comapeo_support_materials/quickstart_guides/INDEX.md
