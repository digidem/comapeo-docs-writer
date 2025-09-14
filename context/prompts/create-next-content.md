# Create Next Missing Content

- Purpose: Generate the next missing item from the deck roadmap and resolve open questions using only `context/` sources.

## Scope and Inputs
- Working directory: project root containing `./content/` and `./context/`.
- Input index: use `context/content_deck/INDEX.md` (preferred) or `MATERIALS_INDEX.md`.

## Selection
- Iterate index in order. Pick the first item whose section does not contain `index.md`.
- If the line has an extension (`.md|.mdx|.txt|.json|.yaml|.yml`): treat as explicit path. Section folder: `./content/<dirparts>/<base-no-ext>/`.
- Otherwise: treat as a title. Slugify (lowercase, trim, replace non-alphanumerics with `-`, trim `-`). Section folder: `./content/<slug>/`.

## Create Section (only if missing)
- `index.md`: Use `context/templates/SECTION.template.md` and `context/system/STYLE_GUIDE.md`. Substitute `{{title}}`, `{{slug}}`, `{{date}}`.
- `referenced.md`: Same text as `index.md` plus inline `[Source: context/…]` per claim/list group and a final “Sources:” block with exact file paths.
- Internal TODOs: Use `context/templates/TODO.template.md` as a thinking aid only; do not create a `TODO.md` file in the section.
- Images: Prefer `context/sources/**` via relative links. If none fit, create `images/placeholder_<slug>.txt` describing the needed image and reference it with a TODO.

## Rules
- Use only facts from `context/`; do not use external knowledge. Note missing details with a clear TODO.
- Use `context/sources/INDEX.md` to choose folders. Start with `quickstart_guides/INDEX.md`, then follow the order in the checklist (mega_deck, setup_guide/screenshots, videos, legacy background).
- Avoid app-specific steps from `context/sources/mapeo_docs/`; reuse only high-level background.
- Naming: snake_case, lowercase, ASCII. Keep content scannable per `context/system/STYLE_GUIDE.md`.
- Create exactly one new section, or output: “No action: all items exist.”

## TODO Resolution (mandatory)
- Use `context/templates/TODO.template.md` as a personal checklist to drive your work; do not commit it to the section.
- For each open question, use only `context/` to resolve. Update `index.md` accordingly and update `referenced.md` with matching text and `[Source: context/…]`.
- If info is not present in `context/`, add the limitation explicitly to `index.md`.

## Execution Notes
- Title: for explicit paths, derive from base filename (title case with spaces). For titles, use the trimmed line.
- Canonical filename is `index.md`.
- Alt text: use captions from `context/sources/**/<image>.txt` when present.

## Acceptance
- Exactly one new section folder with `index.md` and `referenced.md`.
- `index.md` follows `context/system/STYLE_GUIDE.md`.
- `referenced.md` mirrors `index.md` and includes inline sources plus a final “Sources:” block.
- Images link to `context/sources/**` or a placeholder file exists.
- Internal TODOs are resolved in your working notes; section files contain only the final drafts and references.

## Reporting
- Print a concise summary: title, section path, files created, templates used, TODOs resolved.
