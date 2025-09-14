# Project Goals and Structure (Temporary Working Draft)

Purpose
- Align on goals, structure, responsibilities, and the workflow for creating versioned documentation. This file will be replaced by a canonical process doc under `context/system/` once agreed.

Objectives
- Produce high‑quality, versioned documentation for CoMapeo with minimal code.
- Start work from prompts; use only sources under `context/` for factual content.
- Enforce consistency via templates, style guide, and content checklist.

Non‑Goals
- No ad‑hoc structure changes per section.
- No editing of templates in place (templates are immutable).
- No sourcing from memory or external web content.

Canonical Sources and Roadmap
- Roadmap: `context/content_deck/INDEX.md` (authoritative topic/section order).
- Sources: `context/sources/**` (includes `quickstart_guides/`, `mapeo_docs/` background, screenshots, setup guide).
- Templates (immutable): `context/templates/SECTION.template.md`, `REFERENCED_SECTION.template.md`.
  - `TODO.template.md` is a thinking aid only; do not create `TODO.md` files in sections.
- Style + Checks: `context/system/STYLE_GUIDE.md`, `context/system/AGENT_CONTENT_CHECKLIST.md`.

Folder Map (Responsibilities)
- `AGENTS.md` (minimal orientation):
  - Start from prompts; never modify files under `context/templates/`.
  - Always create/update content under version folders (`vN`) in `./content/…`.
  - Follow system docs (style, checklist, process).
- `README.md`: Contributor quickstart (install/build/serve) with links to system docs.
- `context/system/` (process docs, single source of truth):
  - `STYLE_GUIDE.md` — voice, tone, formatting.
  - `AGENT_CONTENT_CHECKLIST.md` — pre‑publish validation.
  - `PROCESS.md` (to be created) — end‑to‑end workflow; folder map; versioning behavior; numbering rules; build behavior.
- `context/prompts/` (entry points):
  - Prompts coordinate task selection (from deck index), drafting, and validation.
  - Prompts must reference `context/system/PROCESS.md` and the style/checklist docs.
- `context/content_deck/` (planning/deck inputs):
  - `INDEX.md` — roadmap ordering with summaries and location of folders.
  - `MATERIALS_INDEX.md` — simple roadmap ordering.
- `context/sources/` (evidence): Authoritative materials used to complement/verify content.
- `content/` (published structure):
  - `NN_topic/NN_section/` with versioned subfolders `v1/`, `v2/`, … each containing `index.md` + `referenced.md`.
  - `template/` holds seeded deck text/assets per section (reference only, not published, never alter).

Numbering and Versioning
- Numbering reflects roadmap order from `context/content_deck/INDEX.md`.
- New work creates or increments `vN/` within the section. Do not overwrite or edit `template/`.
- The build picks the highest `vN/index.md` as latest and shows a versions bar linking previous versions.

Section File Roles (and Relations)
- `index.md`: reader‑facing draft;
  - No “Sources:” list; keep prose concise and scannable.
- `referenced.md`: exact copy of `index.md` with inline `[Source: context/…]` per claim/group and a final `Sources:` block.
- Internal TODOs: use `context/templates/TODO.template.md` as a guide for your own thinking; do not add `TODO.md` files to sections.
- `template/`: seeded deck text and local images used for drafting; not published.

Workflow (Create or Update a Section)
1) Start from a prompt in `context/prompts/` (prompts list next items from the deck index).
2) Create or increment `content/<NN_topic>/<NN_section>/vN/`.
3) Copy structure from `context/templates/SECTION.template.md` into `vN/index.md`.
4) Copy existing section text (minimal, safe improvements allowed); then complement with new facts strictly from `context/sources/**`.
5) Create `vN/referenced.md` as an exact copy of `index.md`, then add source annotations and the final `Sources:` block.
6) Validate with `context/system/AGENT_CONTENT_CHECKLIST.md`.
7) Keep images local to the section (`vN/images/` or section `images/` if shared) and ensure alt text is meaningful.

Build and Serve
- `npm run docs:build`: builds latest version per section; writes `dist/` with `files.json` and `versions.json`.
- `npm run docs:serve`: serves `dist/`; viewer injects a versions bar when multiple versions exist.

Do / Don’t Summary
- Do: start from prompts; follow roadmap; version every change; cite sources in `referenced.md`; pass checklist.
- Don’t: edit templates; invent facts; add a “Sources:” section to `index.md`.

Immediate Next Steps (after agreement)
- Create `context/system/PROCESS.md` by promoting this GOALS.md (tightened for reference).
- Update prompts in `context/prompts/` to reference PROCESS.md and deck index.
- Standardize quickstart folder naming under `context/sources/quickstart_guides/**` (migrate singular folder if approved).

Open Questions
- Confirm the canonical name/location for the process doc: `context/system/PROCESS.md`.
- Confirm standardization to `context/sources/quickstart_guides/**` (move current singular folder?).
- Should we add an automated “seed v1 from template” helper when a section has no versions yet?
