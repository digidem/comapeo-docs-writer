# Create Next Missing Content

- Purpose: Generate the next missing item from the deck roadmap and resolve open questions using only `context/` sources, with minimal, well-targeted tool calls.

## Scope and Inputs
- Working directory: project root containing `./content/` and `./context/`.
- Input index: use `context/content_deck/INDEX.md` (preferred) or `MATERIALS_INDEX.md`.

## Selection
- **Read Index Once**: Read `context/content_deck/INDEX.md` (or `MATERIALS_INDEX.md` if specified) to get the full ordered list of items.
- **Iterate**: For each item, compute the expected section path and check if any `vN/index.md` exists there.
- **Pick**: Select the *first* item that does not have any `vN/index.md`.
- **Resolve Path**:
  - If the line has an extension (`.md|.mdx|.txt|.json|.yaml|.yml`): treat as explicit path. Section folder: `./content/<dirparts>/<base-no-ext>/`.
  - Otherwise: treat as a title. Slugify (lowercase, trim, replace non-alphanumerics with `-`, trim `-`). Section folder: `./content/<slug>/`.
- If all items already have at least one version folder, output: `No action: all items exist.` and stop.

## Create Section (only if missing)
- **Source Lookup (efficient)**:
  - Read `context/sources/INDEX.md` to understand the available source categories.
  - Use at most a handful of filesystem searches (e.g., `rg` or `find`) scoped to the most relevant subfolders (start with `quickstart_guides/`, then follow the order in `context/sources/INDEX.md`) to discover candidate source files.
  - Open only the top candidate files that clearly relate to this section, and keep a running list of the exact `context/...` paths you rely on.
- `index.md`:
  - Use `context/templates/step-by-step.template.md` (preferred for procedural content) or `context/templates/SECTION.template.md`.
  - Refer to `context/system/GOLD_STANDARD.md` for tone and structural examples.
  - Substitute `{{title}}`, `{{slug}}`, `{{date}}` where relevant.
- `referenced.md`:
  - Same text as `index.md` plus inline `[Source: context/…]` per claim/list group and a final `Sources:` block with exact file paths from your source list.
- Internal TODOs:
  - Use `context/templates/TODO.template.md` as a thinking aid only; do not create a `TODO.md` file in the section.
- Versioning:
  - Create `v1/` for a brand-new section, or the next `vN/` inside the numbered topic/section folder.
  - Do not modify any `template/` folder.
- Images:
  - Prefer images already present in the chosen source files.
  - Copy them into `vN/images/` and link as `![Alt text](./images/filename.ext)`.
  - If a sidecar caption file exists (e.g., `image.png.txt`), reuse its text as alt text.
  - If none fit, create `images/placeholder_<slug>.txt` describing the needed image and reference it with a visible `TODO` in the draft.

## Rules
- Use only facts from `context/`; do not use external knowledge. Note missing details with a clear `TODO:` line.
- Use `context/sources/INDEX.md` to choose folders. Start with `quickstart_guides/INDEX.md`, then follow the order in the checklist (mega_deck, setup_guide/screenshots, videos, legacy background).
- Avoid app-specific steps from `context/sources/mapeo_docs/`; reuse only high-level background.
- Naming: snake_case, lowercase, ASCII. Keep content scannable per `context/system/STYLE_GUIDE.md`.
- Create exactly one new section per run, or output: `No action: all items exist.`

## TODO Resolution (mandatory)
- Use `context/templates/TODO.template.md` as a personal checklist to drive your work; do not commit it to the section.
- For each open question, use only `context/` to resolve. Update `index.md` accordingly and update `referenced.md` with matching text and `[Source: context/…]`.
- If info is not present in `context/`, say so explicitly in `index.md` (e.g., “TODO: Source material for X not present in context/.”).

## Execution Notes
- Title: for explicit paths, derive from base filename (title case with spaces). For titles, use the trimmed line.
- Canonical filename is `index.md`.
- Alt text: use captions from `context/sources/**/<image>.txt` when present; otherwise follow `context/system/TONE_GUIDE.md`.

## Acceptance
- Exactly one new section folder with `index.md` and `referenced.md`, or an explicit “No action” message.

## References
- Gold Standard: `context/system/GOLD_STANDARD.md`
- Process: `context/system/PROCESS.md`
- Style: `context/system/STYLE_GUIDE.md`
- Tone: `context/system/TONE_GUIDE.md`
- Checklist: `context/system/AGENT_CONTENT_CHECKLIST.md`
- Templates: `context/templates/INDEX.md`
- Sources: `context/sources/INDEX.md`
- `index.md` follows `context/system/STYLE_GUIDE.md`.
- `referenced.md` mirrors `index.md` and includes inline sources plus a final “Sources:” block.
- Images link to copied files under `vN/images/` or a placeholder file exists.
- Internal TODOs are resolved in your working notes; section files contain only the final drafts and references.

## Reporting
- Print a concise summary: title, section path, files created, templates used, TODOs resolved.
