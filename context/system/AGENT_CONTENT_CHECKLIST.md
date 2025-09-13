# Content Section QA Checklist

Use this checklist after creating or updating any content section. Do not skip items.

- [ ] Style guide compliance: Follows `context/system/STYLE_GUIDE.md` (voice, clarity, brevity, structure guidance).
- [ ] Tone match: Matches the tone and writing style in `context/templates/SECTION.template.md` (imperative, action‑oriented, concise).
- [ ] Structure match: Mirrors `SECTION.template.md` structure (Title, Hero image, “This chapter will…/Table of contents”, clear subtitles, step lists, troubleshooting/known issues as needed).
- [ ] Sources present in referenced.md only: `referenced.md` adds a `Sources:` line with exact file paths from `context/` used (e.g., `Sources: context/.../multi_project/index.md; context/.../security_features/index.md`). Confirm `index.md` has no `Sources` section.
- [ ] Referenced version: A `referenced.md` exists alongside `index.md` with the same content and inline `[Source: context/…]` annotations per claim or grouped bullet.
- [ ] Start from index: Located materials via `context/sources/quickstart_guides/INDEX.md`.
- [ ] Legacy docs caution: Did NOT use technical/app‑specific content from `context/sources/mapeo_docs/` (legacy). Only high‑level non‑app context if necessary.
- [ ] No guessing: Any missing detail is flagged with a clear `TODO:` instead of inferred text.
- [ ] Links & assets: Relative links; use images under `context/sources/**` when available. If not available, add a placeholder description in `./content/<section>/images/placeholder_*.txt` and a visible `TODO` in the draft.
- [ ] Naming: Filenames and folders use `snake_case`, lowercase, ASCII.
- [ ] Readability pass: Manually preview Markdown; verify headings, scannability, and that all links/images resolve.

Optional but recommended

- [ ] Cross‑links: Add helpful `🔗 Go to ...` references to related sections when useful.
- [ ] Tips/Notes: Use `💡 Tip` and `👉🏾 More` per the style guide where they add value.
