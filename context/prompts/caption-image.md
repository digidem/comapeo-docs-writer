Title: Caption Single Image

Purpose
- Create a precise, consistent caption for one specified image and save it as a sidecar `.txt` file with the same base name, in the same directory.

Arguments
1) Working directory (optional): project root; defaults to current directory.
2) Image path (required): file path to the image to be captioned (relative or absolute). Use as given; no need for it to be under `./context/`.

Sidecar Rules
- Primary sidecar path: `<image_dir>/<image_basename>.txt` (e.g., `photo.jpeg` -> `photo.txt`).
- If any of the following exist, do not overwrite and exit with a skip notice:
  - `<image_basename>.txt`
  - `<image_basename>.caption.txt`
  - `caption.txt` (generic, in the same directory)

Validation
- Supported image extensions (case-insensitive): `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.tiff`, `.bmp`, `.avif`.
- If the file doesn’t exist or extension is unsupported, abort with a clear message.

Caption Style Guide
- Be factual, specific, and concise (8–20 words ideal).
- Lead with the subject; avoid “Image of”/“Picture of”.
- Mention key visual details (colors, setting, composition) when relevant.
- Use present tense; sentence case; no trailing period for single-sentence captions.
- For charts/diagrams: state what is shown, key axes, trend, and timeframe if visible.

Procedure
1) Resolve image path and validate existence/extension.
2) Check for existing sidecar files per Sidecar Rules; if found, output "skipped (caption exists)" and stop.
3) Open/preview the image for inspection.
4) Draft a caption following the Style Guide. Keep one line if possible.
5) Write the caption to the sidecar `.txt` file (UTF-8, trailing newline).
6) Output the sidecar path and a brief confirmation.

Done Criteria
- A single sidecar caption file is created for the provided image path, or the command reports a skip if a caption already exists.
