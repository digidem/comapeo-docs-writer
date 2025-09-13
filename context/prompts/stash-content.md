Title: Stash Content

Purpose
- Move all existing items from `./content/` into `./old-content/` to preserve a snapshot before regeneration.
- Prepare `./content/` to be empty for fresh content creation.

Assumptions
- Working directory is the project root that contains `./content/`.
- Stashing should never overwrite previous snapshots.

Stash Destination
- Create a new timestamped directory under `./old-content/` using the format `YYYYMMDD-HHMMSS` (local time), e.g., `./old-content/20250131-142530/`.
- Move the entire contents of `./content/` (files and subdirectories) into that timestamped directory.
- Do not move the `./context/` directory (it is outside `./content/` and not part of the stash process).

Procedure
1) Ensure directories
   - Ensure `./content/` exists; create if missing.
   - Ensure `./old-content/` exists; create if missing.

2) Detect if there is anything to stash
   - If `./content/` is empty (or only contains `.gitkeep`), output "Nothing to stash" and exit.

3) Create timestamped stash folder
   - Compute a timestamp `YYYYMMDD-HHMMSS` and create `./old-content/<timestamp>/`.

4) Move content
   - Move all files and subdirectories from `./content/` into `./old-content/<timestamp>/`.
   - If any name conflicts occur (unexpected), append a numeric suffix to the moved name to avoid overwriting within the stash folder.

5) Leave a clean content directory
   - Recreate `./content/` if needed and ensure it is empty.
   - Optionally add an empty `.gitkeep` file to retain the directory in version control.

6) Report summary
   - Output the path of the stash folder and a count of items moved.

Safety
- Never delete or modify prior stash folders in `./old-content/`.
- Do not attempt to merge or deduplicate stashes; each run creates a new folder.

Done Criteria
- All prior content under `./content/` is moved into a new `./old-content/<timestamp>/` folder, and `./content/` is empty (except optional `.gitkeep`).
