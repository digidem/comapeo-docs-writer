# Create Next Version For a Section

- Purpose: Generate the next version (vN+1) for a specific section, based on templates and sources.

Required input
- Section path (relative to repo root), e.g.:
  - `content/01_preparing_to_use_comapeo_mobile/01_understanding_comapeo_s_core_concepts_and_functions`
- This prompt expects the section path to be provided at the end of the user message as:
  - `Section: <path>`

## Steps
1) Resolve the section directory from `Section:`. Abort with a clear message if missing or invalid.
2) Detect the current highest version `vN` (folders like `v1`, `v2`, ...). If none, set N=0.
3) Create `vN+1/` with:
   - `index.md` from `context/templates/SECTION.template.md` (substitute H1 with the section title inferred from folder name; follow `context/system/STYLE_GUIDE.md`).
   - `referenced.md` as a copy of `index.md` plus inline `[Source: context/…]` per claim/group and a final `Sources:` block.
   - `images/` folder (empty) under `vN+1/`.
4) Use `context/sources/INDEX.md` to choose materials; start with `quickstart_guides/INDEX.md`, then follow the order in the checklist (mega_deck, setup_guide/screenshots, videos, legacy background).
5) Keep prose concise and scannable; use imperative tone (`context/system/TONE_GUIDE.md`).
6) Do not create a `TODO.md`; use `context/templates/TODO.template.md` only as a thinking aid.

## Read‑only / approvals=never fallback
- If you cannot write files, output a single apply_patch block with minimal diffs to add:
  - `content/.../vN+1/index.md`
  - `content/.../vN+1/referenced.md`
- Use this exact envelope:
```
*** Begin Patch
*** Add File: content/.../vN+1/index.md
[# Title]
[Body per SECTION.template.md]
*** Add File: content/.../vN+1/referenced.md
[# Title]
[Body matching index.md with [Source: context/…] annotations]
*** End Patch
```

## Acceptance
- A new `vN+1/` folder with `index.md` and `referenced.md` is created under the specified section.
- Drafts pass the `context/system/AGENT_CONTENT_CHECKLIST.md`.

## References
- Process: `context/system/PROCESS.md`
- Style: `context/system/STYLE_GUIDE.md`
- Tone: `context/system/TONE_GUIDE.md`
- Checklist: `context/system/AGENT_CONTENT_CHECKLIST.md`
- Glossary: `context/system/GLOSSARY_REF.md`
- Templates: `context/templates/INDEX.md`
- Sources: `context/sources/INDEX.md`, `context/content_deck/INDEX.md`

