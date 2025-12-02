# Utility Scripts

## Purpose
Provides maintenance, validation, transformation, and formatting utilities for the documentation system. These scripts handle tasks like link checking, image management, file numbering, and content validation.

## Key Files and Directories

### Validation Scripts
- `scripts/check_links.js` - Validates Markdown links across the repository
  - Checks internal links (between Markdown files)
  - Verifies image references exist
  - Skips external URLs
  - Skips template examples
  - Reports broken links with file and line number

- `scripts/check_context_links.js` - Validates links specifically in `context/` folder
  - Ensures source material references are valid
  - Similar to `check_links.js` but context-specific

### Image Management Scripts
- `scripts/assign_remaining_images.js` - Distributes unused images to sections
  - Scans `context/sources/screenshots/` for unassigned images
  - Matches images to sections based on content analysis
  - Copies images to section `images/` folders
  - Updates Markdown to reference new images

- `scripts/move_section_images.js` - Reorganizes section images
  - Moves images from global `images/` to version-specific `vN/images/`
  - Updates Markdown references accordingly
  - Ensures each version has its own image set

- `scripts/convert-office-to-md.js` - Converts Office documents to Markdown
  - Handles DOCX, PPTX files
  - Uses Pandoc or similar converters
  - Outputs Markdown for inclusion in `context/sources/`

- `scripts/docx_to_md.sh` - Shell script wrapper for DOCX conversion
- `scripts/pptx_to_md.sh` - Shell script wrapper for PPTX conversion

### Content Formatting Scripts
- `scripts/number_content.js` - Adds or updates numeric prefixes to folders
  - Ensures topics and sections have `01_`, `02_` prefixes
  - Re-numbers if order changes
  - Updates references in Markdown files

- `scripts/clean_templates.js` - Removes unused or redundant template files
  - Scans for template duplicates
  - Removes old template versions
  - Ensures only canonical templates exist in `context/templates/`

- `scripts/fix_template_headers.js` - Standardizes template heading styles
  - Ensures consistent heading levels
  - Fixes placeholder syntax
  - Normalizes whitespace

- `scripts/slice_templates.js` - Extracts sections from large template files
  - Splits monolithic templates into per-section templates
  - Used during initial template setup

### Testing Utilities
Already covered in module 01 (Content Generation), but summarized here:
- `scripts/gen-smoke.js` - Zero-token smoke test for generation system
- `scripts/gen-test.js` - Generates first three sections for testing
- `scripts/gen-test-ds.js` - Dataset-specific test generation

## Major Functions/Classes

### check_links.js
- **`findMarkdownFiles(dir)`** - Recursively finds all `.md` files
- **`extractLinks(content)`** - Parses Markdown to extract links in `[text](url)` format
- **`resolveLink(baseFile, linkPath)`** - Resolves relative links to absolute paths
- **`checkLink(absPath)`** - Verifies a file or image exists
- **`main()`** - Orchestrates link checking, reports errors

### assign_remaining_images.js
- **`listUnusedImages()`** - Finds images not referenced in any Markdown
- **`matchImagesToSections(images, sections)`** - AI-driven or heuristic matching
- **`copyImageToSection(image, section)`** - Copies and updates references
- **`updateMarkdown(file, imageRefs)`** - Inserts image references into Markdown

### number_content.js
- **`scanContentStructure()`** - Walks `content/` to build hierarchy
- **`assignNumbers(structure)`** - Determines correct numeric prefixes
- **`renameDirectories(oldName, newName)`** - Safely renames folders
- **`updateReferences(oldPath, newPath)`** - Updates links in Markdown files

### convert-office-to-md.js
- **`convertDocx(inputPath, outputPath)`** - DOCX → Markdown
- **`convertPptx(inputPath, outputPath)`** - PPTX → Markdown
- **`cleanMarkdown(md)`** - Post-processes converted Markdown (removes artifacts)

## External Dependencies
- **Pandoc** (for Office conversion) - External CLI tool
- **Node.js core modules** - `fs`, `path`, `child_process`
- **Regular expressions** - For link extraction and Markdown parsing

## Context Engineering Considerations

### When Working in This Module
1. **Link Checking is Critical** - Always run `npm run check:links` before committing. Broken links degrade user experience.
2. **Image Assignment is Semi-Automated** - Review AI-suggested image placements before accepting. Context matters.
3. **Numbering Changes Require Updates** - If you re-number sections, all internal links must update. Use `number_content.js` carefully.
4. **Template Integrity** - Never auto-clean templates without review. Templates are the foundation.
5. **Office Conversion is Lossy** - DOCX/PPTX → Markdown loses formatting. Manual cleanup is often needed.
6. **Git-Friendly Operations** - These scripts should produce minimal diffs. Avoid reformatting entire files unnecessarily.
7. **Idempotency** - Scripts should be safe to run multiple times without causing damage.
8. **Dry-Run Mode** - Prefer scripts that offer `--dry-run` to preview changes before applying.

### Common Workflows

#### Validating Links After Content Changes
```bash
npm run check:links
# Fix any reported broken links manually
# Re-run until clean
```

#### Re-Numbering Content Sections
```bash
node scripts/number_content.js
# Review changes in git diff
git add <specific-files>
git commit -m "Re-number content sections"
```

#### Converting Office Documents
```bash
node scripts/convert-office-to-md.js path/to/document.docx
# Output: path/to/document.md
# Manually review and clean Markdown
mv path/to/document.md context/sources/new_source.md
```

#### Assigning Unused Images
```bash
node scripts/assign_remaining_images.js
# Review suggested placements
# Accept or reject each assignment
# Commit updated Markdown and images
```

#### Cleaning Templates
```bash
node scripts/clean_templates.js --dry-run
# Review output
node scripts/clean_templates.js
# Commit changes
```

### Known Limitations
- **Link Checker** - Does not validate external URLs (only internal links)
- **Image Assignment** - Requires manual review; AI suggestions may be inaccurate
- **Numbering** - Does not handle merge conflicts if multiple people renumber simultaneously
- **Office Conversion** - Complex formatting (tables, embedded images) may not convert cleanly
- **Template Cleaning** - May remove templates you want to keep if not configured properly

### Error Handling
Most utility scripts:
- Log errors to console with file/line numbers
- Exit with non-zero status on failure
- Provide `--help` or usage instructions
- Support `--dry-run` or `--verbose` flags

### Testing
- **Test link checker**: `npm run check:links` (should have zero errors)
- **Test numbering**: `node scripts/number_content.js --dry-run` (review output)
- **Test smoke generation**: `npm run gen:smoke` (verifies generation scaffolding)
- **Test image assignment**: `node scripts/assign_remaining_images.js --dry-run`

### Best Practices
1. **Always Use Version Control** - Run utilities on a clean git branch
2. **Review Before Committing** - Inspect `git diff` after running scripts
3. **Stage Specific Files** - Never `git add -A` after utility runs; stage intentionally
4. **Document Custom Scripts** - If adding new utilities, update this document
5. **Prefer Composition** - Small, focused scripts are better than monolithic ones
6. **Handle Edge Cases** - Test with missing files, empty folders, malformed Markdown
