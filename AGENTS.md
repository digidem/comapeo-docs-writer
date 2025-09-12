# Repository Guidelines

## Project Structure & Module Organization

- Root: Node metadata (`package.json`).
- Content: `context/` — guides (`STYLE_GUIDE.md`, `MATERIALS_INDEX.md`), materials in `comapeo_support_materials/` (screenshots, videos), docs in `quickstart_guides/`, `mapeo_docs/`.
- Use relative links to assets (example): `![alt](./comapeo_support_materials/screenshots/example.png)`.

## Build, Test, and Development Commands

- `npm ci` — install deps from lockfile.
- `npm test` — placeholder (no tests).
- Preview Markdown locally; no build step. Node 18+, npm 9+.

## Coding Style & Naming Conventions

- Markdown with clear headings and compact paragraphs.
- Filenames/folders: `snake_case`, lowercase, ASCII.
- Assets under `context/comapeo_support_materials/`; optional image captions `image_name.txt`.
- JSON: 2‑space indent. Follow `context/STYLE_GUIDE.md`.

## Testing Guidelines

- Manual checks: links and image paths resolve; preview readability and scannability.

## Commit & Pull Request Guidelines

- Conventional Commits (examples): `docs: add data export quickstart`, `chore: reorganize screenshots`.
- PRs: description + rationale, linked issues, before/after screenshots for visual changes, focused diffs.

## Security & Assets

- Never add secrets or private URLs. Anonymize screenshots. Keep binaries minimal/compressed.

## Agent Role & Tasks

- Most important: strictly follow `context/STYLE_GUIDE.md` for all content.
- Analyze: parse and summarize context files.
- Organize: enforce `snake_case`, tidy folders, add image captions.
- Create: drafts aligned to style and roadmap.
- Principles: accuracy, clarity, consistency; iterate safely (no overwrites without backup).

### Source of Truth & Citations

- Use `context/` as the single source of truth for all content. Do not introduce information from memory or external sources.
- Always consult `context/comapeo_support_materials/quickstart_guides/INDEX.md` to locate relevant quickstart materials before drafting.
- The folder `context/comapeo_support_materials/mapeo_docs/` contains documentation from the old Mapeo platform; never rely on its technical/app‑specific instructions. Only reuse high‑level, non‑app‑specific background/context from this folder when clearly appropriate.
- When producing any content (notes, drafts, guides), 100% of claims must be traceable to files under `context/`. Always include an explicit “Sources” line listing the exact file paths used (e.g., `Sources: context/.../multi_project/index.md; context/.../security_features/index.md`).
- If a required detail is not present in `context/`, surface a clear TODO instead of inferring. Example: `TODO: confirm max audio duration — not found in context/`.

### Workflow & Deliverables

- Content roadmap: the full list of content to produce lives in `context/CONTENT_INDEX.txt`. Use it to plan and prioritize work.
- Three‑file section structure (required for every section):
  - `index.md` — primary reader‑facing draft for the section.
  - `referenced.md` — exact content of `index.md` but annotated with inline source references per claim (paths under `context/`).
  - `TODO.md` — working notes using `context/templates/TODO.template.md`.
- Images for every section:
  - Prefer referencing existing assets under `context/comapeo_support_materials/**` using relative links from the section folder.
  - If a relevant image does not exist, create a placeholder description file under the section’s `images/` folder (e.g., `images/placeholder_<topic>.txt`) describing exactly what the image should show; reference it in the draft with a clear TODO.
  - When captions exist as `image_name.txt` alongside the image under `context/`, use them to inform alt text or a short caption.
- Process to create/update a section:
  1) Create the section folder under `./content/section_name/` (snake_case).
  2) Copy `context/templates/TODO.template.md` to `./content/section_name/TODO.md` and fill it.
  3) Draft `index.md` following `context/STYLE_GUIDE.md` and `context/templates/SECTION.template.md` for structure.
  4) Add illustrative images: link existing assets from `context/…` or add placeholders under `./content/section_name/images/`.
  5) Create `referenced.md` as an exact text copy of `index.md` and add inline `[Source: context/…]` references for each factual claim or list group. Keep a final `Sources:` block at the end.
  6) Run the checklist at `context/AGENT_CONTENT_CHECKLIST.md` and resolve any TODOs you can with available `context/` sources.
  7) Only then consider the section ready for review.
- Before marking a section complete, go through the checklist at `context/AGENT_CONTENT_CHECKLIST.md` and ensure every item is satisfied.
- Finalized content should be placed under the `./content` folder, preserving `snake_case` naming and using relative links to assets in `context/comapeo_support_materials/`.
- Use `context/templates/SECTION.template.md` when starting a new section to ensure consistent structure and tone. Also see `context/templates/REFERENCED_SECTION.template.md` for the annotated version.

#### Using the TODO template

- For each task, copy `context/templates/TODO.template.md` to a `TODO.md` alongside your draft and fill it in at the start of work.
- Keep `TODO.md` updated during drafting (questions, missing details, decisions). Remove or archive it once the section is finalized and moved to `./content/`.
- Example: `cp context/templates/TODO.template.md path/to/your/section/TODO.md`
