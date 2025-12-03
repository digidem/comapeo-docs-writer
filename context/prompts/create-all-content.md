# Create All Content From Deck Roadmap

- Purpose: Generate all missing items from the deck roadmap by repeatedly invoking the “Create Next Missing Content” procedure, without re-reading or re-scanning more than necessary.

## Scope and Inputs
- Working directory: project root containing `./content/` and `./context/content_deck/`.
- Roadmap: `context/content_deck/INDEX.md` (summaries + folders) or `context/content_deck/MATERIALS_INDEX.md` (order only).

## Preflight
- Ensure `./context/content_deck/INDEX.md` exists and is readable.
- Ensure `./content/` exists (create if missing).

## Optional Stash
- If `./content/` is not empty (excluding optional `.gitkeep`), run `stash-content.md` to move existing content to `../old-content/<timestamp>/`.

## Generation
- Loop: apply the `create-next-content.md` procedure until no missing items remain.
  - Reuse knowledge of the roadmap and already-created sections across iterations; you do not need to re-parse the index from scratch every time.
  - If you cannot write files (read‑only FS / `never` approvals), output a single `apply_patch` block that aggregates the minimal diffs to add all missing sections, following the format documented in `create-first-three.md`.
- Stop condition: one full pass over the index yields no new files created.

## Rules
- “Call” other prompts by following their instructions precisely (inlining their steps is fine).
- Idempotent after stashing; do not overwrite generated output.
- Safety: never delete or overwrite files in `../old-content`; do not modify the deck index.
- Versioning: always create or update `vN/` inside the numbered topic/section folder (do not edit `template/`).

## Edge Cases
- Missing index: abort with a clear error message.
- Empty index: do nothing and report.
- Concurrent changes: if new files appear mid-run, skip on the next check without failing.

## Acceptance
- Every item in `context/content_deck/INDEX.md` has a corresponding section under `./content/` as defined in `create-next-content.md`.
- For sections generated during this run, do not create `TODO.md` files; use `context/templates/TODO.template.md` as an internal thinking aid only.
  - If a patch was emitted, it applies cleanly and creates the same files.

## References
- Process: `context/system/PROCESS.md`
- Style: `context/system/STYLE_GUIDE.md`
- Tone: `context/system/TONE_GUIDE.md`
- Checklist: `context/system/AGENT_CONTENT_CHECKLIST.md`
- Templates: `context/templates/INDEX.md`
- Sources: `context/sources/INDEX.md`

## Reporting
- Print a concise summary: number of items created, list of created sections, whether stashing occurred, and any items skipped.
