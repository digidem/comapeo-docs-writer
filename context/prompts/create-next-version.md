# Create Next Version For a Section

- Purpose: Populate the next version of documentation with content from `context/` sources only, without guessing or using external knowledge.

Required input
- Target version directory (relative to repo root), e.g.: `content/01_topic/01_section/v2`
- This is provided at the end of the prompt as: `Target: <path>`

## Steps
1) **Source Check (CRITICAL)**:
   - **Strategy**: Do not guess. Use only files under `context/` as your source of truth.
   - **Locate candidates efficiently**:
     - Derive the section slug from the target path (e.g., `content/01_topic/07_installing_comapeo/v2` → slug: `installing_comapeo` and title: `Installing Comapeo`).
     - Read `context/sources/INDEX.md` once to understand available subfolders and their purpose.
     - Use a *small* number of filesystem searches (e.g., `rg` or `find`) scoped to the most likely folders (start with `context/sources/quickstart_guides/`, then follow the order in `context/sources/INDEX.md`) to find filenames or headings that match the slug or title.
   - **Verify**:
     - Open only the most relevant candidate files and skim for sections that clearly match this documentation section.
     - Maintain a short list of the specific `context/...` files you will rely on.
   - **IF NO SPECIFIC SOURCE MATERIAL IS FOUND**:
     - STOP. Do not generate generic filler content.
     - Output exactly: `NO SPECIFIC SOURCE FOUND` and exit.

2) **Content Generation**:
   - The target directory (`Target:`) has been initialized with `index.md` and `referenced.md` (containing templates).
   - **Plan**: Focus on the specific section topic (e.g., purpose, offline features, collaboration steps) based *only* on the verified sources from Step 1.
   - **Image Handling**:
     - Prefer images that are already used or referenced in the chosen source files.
     - Identify relevant hero or screenshot images in `context/sources/`.
     - **COPY** them into `<Target>/images/` (do not link to `context/` directly in the final markdown).
     - If a sidecar caption file like `image.png.txt` exists next to the image, reuse that text as the alt text.
     - Use relative links in markdown: `![Alt text](./images/filename.png)`.
   - **Overwrite `index.md`**: Write action-oriented content.
     - Adhere to `context/system/STYLE_GUIDE.md` and `GOLD_STANDARD.md`.
     - If the content is procedural, follow the structure of `context/templates/step-by-step.template.md`.
     - Otherwise, follow `context/templates/SECTION.template.md`.
   - **Overwrite `referenced.md`**: Copy the new `index.md` content and add:
     - Inline `[Source: context/…]` citations for every claim, list group, or concrete fact, using the exact `context/...` paths collected in Step 1.
     - A `Sources:` block at the end listing all files used.

3) **Quality Control**:
   - Ensure no `TODO` files are created (use `context/templates/TODO.template.md` only as an internal thinking aid).
   - Ensure images are referenced correctly (prefer existing `context/sources` images; else use clearly labeled placeholders under `<Target>/images/placeholder_<name>.txt` with a visible `TODO` in the draft).
   - Verify against `context/system/AGENT_CONTENT_CHECKLIST.md`.

## Read‑only / approvals=never fallback
- If you cannot write to the filesystem, output a single `apply_patch` block to update the files:
```
*** Begin Patch
*** Add File: <Target>/index.md
[Content]
*** Add File: <Target>/referenced.md
[Content with citations]
*** End Patch
```

## References
- Process: `context/system/PROCESS.md`
- Sources: `context/sources/INDEX.md`
- Templates: `context/templates/INDEX.md`
