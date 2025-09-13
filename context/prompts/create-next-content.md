# Create Next Missing Content

- Purpose: Generate the next missing item from `context/CONTENT_INDEX.txt` and resolve its TODOs.

## Scope and Inputs
- Working directory: project root containing `./content/` and `./context/`.
- Input index: `context/CONTENT_INDEX.txt` (ignore blank lines and lines starting with `#` or `//`).

## Selection
- Iterate index in order. Pick the first item whose section does not contain `index.md`.
- If the line has an extension (`.md|.mdx|.txt|.json|.yaml|.yml`): treat as explicit path. Section folder: `./content/<dirparts>/<base-no-ext>/`.
- Otherwise: treat as a title. Slugify (lowercase, trim, replace non-alphanumerics with `-`, trim `-`). Section folder: `./content/<slug>/`.

## Create Section (only if missing)
- `index.md`: Use `context/templates/SECTION.template.md` and `context/system/STYLE_GUIDE.md`. Substitute `{{title}}`, `{{slug}}`, `{{date}}`. If template absent, create a minimal outline per style guide.
- `referenced.md`: Same text as `index.md` plus inline `[Source: context/…]` per claim/list group and a final “Sources:” block with exact file paths.
- `TODO.md`: From `context/templates/TODO.template.md`, populated with open questions/TODOs. If template absent, create a minimal checklist.
- Images: Prefer `context/sources/**` via relative links. If none fit, create `images/placeholder_<slug>.txt` describing the needed image and reference it with a TODO.

## Rules
- Use only facts from `context/`; do not use external knowledge. Note missing details with a clear TODO.
- Always consult `context/sources/quickstart_guides/INDEX.md` first for relevant material.
- Avoid app-specific steps from `context/sources/mapeo_docs/`; reuse only high-level background.
- Naming: snake_case, lowercase, ASCII. Keep content scannable per `context/system/STYLE_GUIDE.md`.
- Create exactly one new section, or output: “No action: all items exist.”

## TODO Resolution (mandatory)
- Ensure `TODO.md` is a checkbox list.
- For each item, use only `context/` to resolve. Update `index.md` accordingly and update `referenced.md` with matching text and `[Source: context/…]`.
- Mark each item as checked `[x]` with a short note. If info is not present in `context/`, add the limitation explicitly to `index.md` and check the item with note “not found in context/”.

## Execution Notes
- Title: for explicit paths, derive from base filename (title case with spaces). For titles, use the trimmed line.
- Canonical filename is `index.md`.
- Alt text: use captions from `context/sources/**/<image>.txt` when present.

## Acceptance
- Exactly one new section folder with `index.md`, `referenced.md`, and `TODO.md`.
- `index.md` follows `context/system/STYLE_GUIDE.md`.
- `referenced.md` mirrors `index.md` and includes inline sources plus a final “Sources:” block.
- Images link to `context/sources/**` or a placeholder file exists.
- All items in `TODO.md` are checked `[x]` (resolved with sources or noted as “not found in context/”).

## Reporting
- Print a concise summary: title, section path, files created, templates used, TODOs resolved.
