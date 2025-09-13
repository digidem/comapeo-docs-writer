# Create All Content From Index

- Purpose: Generate all missing items from `context/CONTENT_INDEX.txt` by repeatedly invoking the “Create Next Missing Content” procedure.

## Scope and Inputs
- Working directory: project root containing `./content/` and `./context/CONTENT_INDEX.txt`.
- Index lines represent items (titles, slugs, or explicit filenames). Ignore blank lines and lines starting with `#` or `//`.

## Preflight
- Ensure `./context/CONTENT_INDEX.txt` exists and is readable.
- Ensure `./content/` exists (create if missing).

## Optional Stash
- If `./content/` is not empty (excluding optional `.gitkeep`), run `stash-content.md` to move existing content to `../old-content/<timestamp>/`.

## Generation
- Loop: apply the `create-next-content.md` procedure until no missing items remain.
- Stop condition: one full pass over the index yields no new files created.

## Rules
- “Call” other prompts by following their instructions precisely (inlining steps is fine).
- Idempotent after stashing; do not overwrite generated output.
- Safety: never delete or overwrite files in `../old-content`; do not modify `context/CONTENT_INDEX.txt`.

## Edge Cases
- Missing index: abort with a clear error message.
- Empty index: do nothing and report.
- Concurrent changes: if new files appear mid-run, skip on the next check without failing.

## Acceptance
- Every item in `context/CONTENT_INDEX.txt` has a corresponding section under `./content/` as defined in `create-next-content.md`.
- For sections generated during this run, their `TODO.md` has all items checked `[x]` per the `create-next-content.md` acceptance.

## Reporting
- Print a concise summary: number of items created, list of created sections, whether stashing occurred, and any items skipped.
