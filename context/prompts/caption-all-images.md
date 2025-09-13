Title: Caption All Images in Context

Purpose
- Discover all image assets under `./context/` and create sidecar caption files for each image.
- For each image, draft a precise, consistent caption and save it as a `.txt` file with the same base name, in the same directory.
- Skip any image that already has a caption sidecar or a sibling `caption.txt` file.

Scope and Discovery
- Root search directory: `./context/` (recursive).
- Image extensions (case-insensitive): `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.tiff`, `.bmp`, `.avif`.
- Exclude typical non-asset folders if present (optional): `node_modules`, `.git`, `.cache`, `dist`, `build`.

Sidecar Rules
- Primary sidecar path: `<image_dir>/<image_basename>.txt` (e.g., `diagram.png` -> `diagram.txt`).
- If any of the following exist, skip the image:
  - `<image_basename>.txt`
  - `<image_basename>.caption.txt`
  - `caption.txt` (generic, in the same directory)

Caption Style Guide
- Be factual, specific, and concise (ideally 8–20 words).
- Lead with the subject; avoid “Image of”/“Picture of”.
- Mention key visual details (colors, setting, composition) when relevant.
- Include context that aids understanding or accessibility; avoid subjective adjectives and marketing language.
- Use present tense; sentence case; no trailing period for single-sentence captions.
- For charts/diagrams: state what is shown, key axes, trend, and timeframe if visible.

Procedure
1) Collect images
   - Recursively list files under `./context/` matching the extensions above, ignoring excluded folders.

2) For each image
   - Determine sidecar path per Sidecar Rules.
   - If a sidecar or `caption.txt` exists, record as "skipped (caption exists)" and continue.
   - Open/preview the image for inspection.
   - Draft a caption following the Style Guide. Keep one line if possible.
   - Save caption as UTF-8 text in the sidecar file with a trailing newline.

3) Summary
   - Report: total images found, created captions, skipped (already captioned).

Safety and Idempotency
- Do not overwrite existing sidecar files unless explicitly instructed elsewhere.
- Only create `.txt` files; never modify the images.

Done Criteria
- Every image under `./context/` has either an existing caption or a newly created sidecar `.txt` file.
