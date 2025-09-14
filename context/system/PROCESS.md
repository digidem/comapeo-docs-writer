# Content Authoring Process

Use this process to create consistent, versioned documentation. Follow the roadmap, use only `context/` sources, and keep structure and tone aligned.

Scope
- Applies to all sections under `./content/<NN_topic>/<NN_section>/vN/`.
- Templates are immutable; copy structure from `context/templates/`.

1) Pick the next item
- Roadmap order: `context/content_deck/MATERIALS_INDEX.md`.
- Summaries and folder pointers: `context/content_deck/INDEX.md`.

2) Create or update a version
- Work under `content/<NN_topic>/<NN_section>/vN/`.
- Do not edit the section’s `template/` (deck seed) or overwrite existing versions.

3) Draft `vN/index.md`
- Copy structure from `context/templates/SECTION.template.md`.
- Keep prose concise and scannable (see Style Guide, Tone Guide).
- Use images local to the section; add a `./images/placeholder_<name>.txt` if needed.

4) Draft `vN/referenced.md`
- Copy `index.md` and add `[Source: context/…]` per claim/group.
- Add a final `Sources:` block listing every `context/` file used.
- Never add “Sources:” to `index.md`.

5) Source lookup order
- Start with `context/sources/quickstart_guides/INDEX.md`.
- If needed: `context/sources/mega_deck/` for narrative/terms.
- For install/device: `context/sources/setup_guide/` and `context/sources/screenshots/`.
- Optional: `context/sources/videos/` for sequence confirmation.
- Legacy background only: `context/sources/mapeo_docs/` (no app‑specific steps).
- See `context/sources/INDEX.md` for folder descriptions.

6) Validate
- Run `context/system/AGENT_CONTENT_CHECKLIST.md`.
- Ensure naming (snake_case), relative links, images resolve, and tone/structure match.

7) Versioning behavior
- The site renders the highest `vN/index.md` as latest.
- A versions bar links to older versions.

References
- Style: `context/system/STYLE_GUIDE.md`
- Tone: `context/system/TONE_GUIDE.md`
- Templates: `context/templates/INDEX.md`
- Sources map: `context/sources/INDEX.md`
- Roadmap: `context/content_deck/MATERIALS_INDEX.md` and `context/content_deck/INDEX.md`

