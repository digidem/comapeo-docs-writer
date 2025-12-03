# Create First Three Sections From Deck

- Purpose: Generate the first three missing items from the deck roadmap using the standard process and `context/` sources, in a single, efficient pass.

## Scope and Inputs
- Working directory: project root containing `./content/` and `./context/content_deck/`.
- Roadmap: `context/content_deck/INDEX.md` (preferred) or `MATERIALS_INDEX.md`.

## Selection
- **Read Roadmap Once**: Read `context/content_deck/INDEX.md` (or `MATERIALS_INDEX.md`) to get the ordered list.
- **Iterate**: For each item, compute the expected section path and check if any `vN/index.md` exists.
- **Select**: Identify up to the first three items that are missing a version folder (no `v1/index.md`, `v2/index.md`, …).

## Create Sections (only if missing)
- For each selected item (up to 3):
  - Create or increment `content/<NN_topic>/<NN_section>/vN/`.
  - `index.md`: Use `context/templates/SECTION.template.md` and follow `context/system/STYLE_GUIDE.md`.
  - `referenced.md`: Same text as `index.md` with inline `[Source: context/…]` per claim/group and a final `Sources:` block.
  - Images:
    - Prefer `context/sources/**` images that are clearly related to the section.
    - Copy them into `vN/images/` and link as `![Alt text](./images/filename.ext)`.
    - If a sidecar caption file exists (e.g., `image.png.txt`), reuse its text as alt text.
    - If none fit, add `images/placeholder_<name>.txt` and a visible `TODO` in the draft.

### Fallback when filesystem is read‑only or approvals are disabled
- If you cannot write to the repository (read‑only FS or approval policy is `never`), do NOT stop.
- Instead, output a single, valid `apply_patch` block with minimal diffs that the user can apply manually. Follow this format exactly:

```
*** Begin Patch
*** Add File: content/<NN_topic>/<NN_section>/v1/index.md
[# Title]
[Body per SECTION.template.md]
*** Add File: content/<NN_topic>/<NN_section>/v1/referenced.md
[# Title]
[Body matching index.md with [Source: context/…] annotations]
*** End Patch
```

- Include up to three new sections in the same patch block.
- Do not add `TODO.md`.

## Rules
- Use only facts from `context/`; if a detail is missing add a visible `TODO:` (do not invent details).
- Use `context/sources/INDEX.md` to choose folders; start with `quickstart_guides/INDEX.md`, then follow the order in the checklist.
- Versioning: work inside `vN/` and never modify `template/`.
- Internal TODOs: Use `context/templates/TODO.template.md` as a personal aid only; do not create `TODO.md` in the section.

## Acceptance
- Up to three new section folders with `vN/index.md` and `vN/referenced.md` created.
- Drafts pass the `context/system/AGENT_CONTENT_CHECKLIST.md`.

If outputting a patch (fallback):
- The patch applies cleanly and creates the same files.


## References
- Process: `context/system/PROCESS.md`
- Style: `context/system/STYLE_GUIDE.md`
- Tone: `context/system/TONE_GUIDE.md`
- Checklist: `context/system/AGENT_CONTENT_CHECKLIST.md`
- Templates: `context/templates/INDEX.md`
- Sources: `context/sources/INDEX.md`, `context/content_deck/INDEX.md`
