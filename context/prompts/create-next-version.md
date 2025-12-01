# Create Next Version For a Section

- Purpose: Populate the next version of documentation with content from sources.

Required input
- Target version directory (relative to repo root), e.g.: `content/01_topic/01_section/v2`
- This is provided at the end of the prompt as: `Target: <path>`

## Steps
1) **Source Check (CRITICAL)**:
   - Search `context/sources/` for material specifically relevant to this section's topic.
   - Check `context/sources/quickstart_guides/INDEX.md` and `context/content_deck/INDEX.md` first.
   - **IF NO SPECIFIC SOURCE MATERIAL IS FOUND**: STOP. Do not generate generic filler content. Output "NO SPECIFIC SOURCE FOUND" and exit.

2) **Content Generation**:
   - The target directory (`Target:`) has been initialized with `index.md` and `referenced.md` (containing templates).
   - **Plan**: Focus on the specific section topic (e.g., purpose, offline features, collaboration steps) based *only* on found sources.
   - **Image Handling**:
     - Identify relevant hero or screenshot images in `context/sources/`.
     - **COPY** them into `<Target>/images/` (do not link to `context/` directly in the final markdown).
     - Use relative links in markdown: `![Alt text](./images/filename.png)`.
   - **Overwrite `index.md`**: Write action-oriented content.
     - Adhere to `context/system/STYLE_GUIDE.md` and `GOLD_STANDARD.md`.
     - If the content is procedural, follow the structure of `context/templates/step-by-step.template.md`.
     - Otherwise, follow `context/templates/SECTION.template.md`.
   - **Overwrite `referenced.md`**: Copy the new `index.md` content and add:
     - Inline `[Source: context/...]` citations for every claim.
     - A `Sources:` block at the end listing all files used.

3) **Quality Control**:
   - Ensure no `TODO` files are created (use the template only for thinking).
   - Ensure images are referenced correctly (prefer existing `context/sources` images; else use placeholders).
   - Verify against `context/system/AGENT_CONTENT_CHECKLIST.md`.

## Read‑only / approvals=never fallback
- Output a single `apply_patch` block to update the files:
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

