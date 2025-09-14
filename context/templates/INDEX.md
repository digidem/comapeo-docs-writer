# Templates Index

Immutable templates for creating and reviewing sections. Do not edit these files directly; copy their structure when creating a new version under `content/.../vN/`.

- `SECTION.template.md` — Base structure for `vN/index.md`
  - Title (H1), “In this page you will learn” bullets
  - Overview, Core concepts, Key flows, Images, Notes
  - No `[Source: ...]` annotations, no final `Sources:` block

- `REFERENCED_SECTION.template.md` — Annotated structure for `vN/referenced.md`
  - Same sections as `SECTION.template.md`
  - Add `[Source: context/…]` annotations per claim/group
  - Include a final `Sources:` block listing every `context/` file used

- `TODO.template.md` — Thinking aid only
  - Use as a guide for your own internal TODOs/questions
  - Do not create a `TODO.md` file in sections

Usage
- Start from prompts, then create or increment `vN/` in the target section.
- Copy the relevant structure from templates into `vN/index.md` and `vN/referenced.md`.
- Keep images local to the section; if missing, add a `./images/placeholder_<name>.txt` and a visible TODO in the draft.

Related
- Style and process: `context/system/STYLE_GUIDE.md`, `context/system/TONE_GUIDE.md`, `context/system/AGENT_CONTENT_CHECKLIST.md`, and (soon) `context/system/PROCESS.md`.
