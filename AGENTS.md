# Agent Guide (Minimal)

This project is content‑first (low/no‑code). Your job is to produce clear, versioned Markdown docs by following our prompts and system guidelines.

Start Here
- Use the prompts under `context/prompts/` to drive work. Prompts define entry points and link to process docs.
- Roadmap: `context/content_deck/INDEX.md` is the source for what to create next and in what order.

Non‑negotiable Rules
- Never modify files under `context/templates/`. Templates are static; copy them when starting a new version.
- All new content is versioned under `./content/<NN_topic>/<NN_section>/vN/` (e.g., `v1/index.md`). The site renders the latest version and links to previous ones.
- Use the structure from `context/templates/SECTION.template.md` and `REFERENCED_SECTION.template.md`:
  - Start by copying existing section content into `vN/index.md` (only minimal improvements if clearly better).
  - Complement with new information strictly from `context/sources/**`.
  - Ensure every new claim follows `context/system/STYLE_GUIDE.md` and passes `context/system/AGENT_CONTENT_CHECKLIST.md`.
  - Keep “Sources:” only in `referenced.md` (never in `index.md`).

References (do not duplicate rules here)
- Style & tone: `context/system/STYLE_GUIDE.md`
- Review checklist: `context/system/AGENT_CONTENT_CHECKLIST.md`
- Templates: `context/templates/SECTION.template.md`, `context/templates/REFERENCED_SECTION.template.md`, `context/templates/TODO.template.md`
- Sources of truth: `context/sources/**` and deck materials under `context/content_deck/`

Notes
- Filenames/folders use `snake_case`, lowercase, ASCII. Keep images local to each section.
- If a needed detail is not in `context/`, add a visible TODO rather than guessing.
