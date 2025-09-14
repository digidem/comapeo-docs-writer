# Sources Index

Use this as a quick map of where to find authoritative materials under `context/sources/`. Always cite exact files in `referenced.md`.

Folders
- `quickstart_guides/`
  - What: Canonical quickstart materials organized by topic (sub-guides, each with an `index.md` and images/).
  - When to use: First stop for feature- and workflow-level instructions, screenshots, and vocabulary used in current content.
  - How: Start from `context/sources/quickstart_guides/INDEX.md` to locate relevant sub-guides.
  - What: Documentation from the legacy Mapeo platform.
  - When to use: High-level, non-app-specific background/context only. Never rely on technical/app-specific instructions.
- `mega_deck/`
  - What: Deck-derived source text (e.g., `mega_deck_primary_template.txt`).
  - When to use: To understand overarching narratives, feature scopes, and terms when quickstarts are insufficient.
- `setup_guide/`
  - What: Materials focused on setup/installation flows and device preparation (with `images/`).
  - When to use: Installing, onboarding, device setup/maintenance, and related screenshots.
- `screenshots/`
  - What: General screenshots with caption `.txt` files.
  - When to use: Supplement sections with visual examples when quickstart-specific images are missing.
- `videos/`
  - What: Video assets relevant to features or flows (mp4).
  - When to use: For sequence validation or to extract stills/context (do not embed large videos unless required).
- `to_convert/`
  - What: Materials pending conversion.
  - When to use: Only if explicitly requested; otherwise ignore.

Helper files
- `IMAGE_SUMMARY.md`: High-level listing of image assets and where they originated.

Recommended lookup order
1) `quickstart_guides/INDEX.md` → specific quickstart guide folder.
2) `mega_deck/` → overarching narrative and terminology.
3) `setup_guide/` and `screenshots/` → installation/device details and visuals.
4) `videos/` → sequence/context confirmation (optional).
5) `mapeo_docs/` → background only (no technical instructions).

Citations
- In `referenced.md`, add inline `[Source: context/…]` for each claim or grouped list and a final `Sources:` block listing every file used.
