# Content Storage

## Purpose
Stores the **generated output** of the documentation system: versioned Markdown sections with images. This module is the deliverable content that gets built into the browsable docs site.

## Key Files and Directories

### Content Root (`content/`)
Top-level directory containing all generated documentation sections organized hierarchically.

### Topic-Level Directories
Pattern: `content/NN_topic_name/` (e.g., `01_preparing_to_use_comapeo_mobile/`)

Current topics:
- `01_preparing_to_use_comapeo_mobile/` - Preparation and setup guidance
- `02_gathering_observations/` - Creating observations and tracks
- `03_reviewing_observations/` - Managing and sharing observations
- `04_managing_projects/` - Project creation and team management
- `05_managing_data_and_privacy/` - Privacy settings and security
- `06_exchanging_observations/` - Peer-to-peer data sync
- `09_troubleshooting/` - Common issues and solutions
- `11_miscellaneous/` - Other topics

### Section-Level Directories
Pattern: `content/NN_topic/NN_section_name/` (e.g., `01_preparing_to_use_comapeo_mobile/01_understanding_comapeo_s_core_concepts_and_functions/`)

Each section represents a discrete user-facing help topic.

### Version Directories
Pattern: `content/NN_topic/NN_section/vN/` (e.g., `v1/`, `v2/`, `v3/`)

**Structure within each version:**
```
vN/
  index.md        # User-facing content (no source citations)
  referenced.md   # Same content with inline [Source: ...] citations and Sources: block
  images/         # Local images specific to this version
    screenshot1.png
    screenshot2.jpg
    ...
```

### File Purposes
- **`index.md`** - Clean user-facing documentation
  - No source citations
  - Follows `SECTION.template.md` structure
  - Ready for publication

- **`referenced.md`** - Auditable version with sources
  - Identical content to `index.md` but with citations
  - Inline `[Source: context/path/to/file.md]` annotations
  - `Sources:` section at end listing all referenced files
  - Follows `REFERENCED_SECTION.template.md` structure
  - Used for fact-checking and validation

- **`images/`** - Version-specific images
  - Screenshots from `context/sources/screenshots/` (copied)
  - Diagrams or illustrations
  - Named descriptively (e.g., `create_observation_button.png`)

## Major Concepts

### Versioning Strategy
- **Monotonic Versions** - Versions increment: `v1`, `v2`, `v3`, etc. Never skip versions.
- **Latest Version** - The highest version number is considered "latest" and featured in docs site.
- **Version History** - Previous versions remain accessible via version switcher in viewer.
- **Immutability** - Once published, a version should not be edited. Create a new version instead.

### Content Evolution
When updating a section:
1. Copy `vN/index.md` → `vN+1/index.md` (starting point)
2. Make improvements or additions to `vN+1/index.md`
3. Update `vN+1/referenced.md` to match with citations
4. Copy/add images to `vN+1/images/`
5. Validate with `AGENT_CONTENT_CHECKLIST.md`

### Naming Conventions
- **Topics** - Broad categories (e.g., "Preparing to Use CoMapeo Mobile")
- **Sections** - Specific help topics (e.g., "Installing and Uninstalling CoMapeo")
- **Prefixes** - Two-digit numeric prefixes define order (e.g., `01_`, `02_`)
- **Snake Case** - All folder names use `snake_case_with_underscores`
- **Lowercase** - All folder and file names are lowercase
- **ASCII Only** - No special characters, accents, or emojis in filenames

## File Conventions

### Markdown Structure
All `index.md` and `referenced.md` files follow this structure:
```markdown
# Section Title

Introduction paragraph explaining the topic.

## Subsection (optional)

Content organized by subtopics.

## Steps or Instructions

1. Step one
2. Step two
3. Step three

## Tips or Notes

- Tip one
- Tip two

## Related Topics (optional)

- `[Other Section](../other_section/v1/index.md)` - Link to related sections
```

### Image References
Within Markdown files, use one of these patterns:
- Local images: `![Description](./images/screenshot.png)`
- Context sources: `![Description](../../../context/sources/screenshots/photo_123.jpg)`

### Source Citations (referenced.md only)
```markdown
CoMapeo allows you to create observations with photos and GPS coordinates. [Source: context/sources/quickstart_guides/observation_guide.md]

...

## Sources:
- context/sources/quickstart_guides/observation_guide.md
- context/sources/quickstart_guides/gps_setup.md
- context/system/STYLE_GUIDE.md
```

## External Dependencies
None. This module is pure data (Markdown files and images).

## Context Engineering Considerations

### When Working in This Module
1. **Never Edit Published Versions** - Treat existing versions as immutable. Create a new version if changes are needed.
2. **Maintain Dual Files** - Always keep `index.md` and `referenced.md` in sync (same content, but one has citations).
3. **Image Organization** - Keep images local to each version. Avoid sharing images across versions to prevent breakage.
4. **Relative Paths** - Use relative paths for all image references. This ensures portability.
5. **No Orphan Images** - Every image in `images/` should be referenced in either `index.md` or `referenced.md`.
6. **Version Gaps** - If you find a gap (e.g., `v1`, `v3` but no `v2`), investigate before proceeding. Gaps may indicate data loss.
7. **Git-Friendly Diffs** - When updating versions, use minimal diffs. Don't reformat existing content unless necessary.
8. **Validation** - Before committing, run `npm run check:links` to verify all Markdown links are valid.

### Agent Workflow
When an agent creates or updates content:
1. Determine target section (e.g., `content/01_preparing.../01_understanding...`)
2. Identify next version number (highest existing + 1)
3. Create `vN/` directory
4. Create `vN/images/` directory
5. Copy previous version's `index.md` as starting point (or use template)
6. Enhance content with new information from `context/sources/**`
7. Generate `referenced.md` with inline citations
8. Copy relevant images from `context/sources/screenshots/` to `vN/images/`
9. Update image paths in Markdown to `./images/<filename>`
10. Validate with `AGENT_CONTENT_CHECKLIST.md`
11. Stage only modified files (no `git add -A`)

### Navigation Patterns
- **Topic Index** - Each topic folder contains multiple section folders
- **Section Versions** - Each section folder contains multiple version folders
- **Latest First** - Docs site features the latest version, with links to previous versions
- **Breadcrumbs** - Viewer shows: Topic > Section > Version

### Known Patterns
- **Empty Placeholders** - Some sections have only `v1/` with template content (not yet written)
- **Incomplete Topics** - Topics with fewer sections (e.g., `11_miscellaneous/`) may be works-in-progress
- **Image Reuse** - Some images appear in multiple sections (copied, not symlinked)
- **TODO Markers** - Content may include `TODO:` markers for missing information

### Quality Gates
Before considering content "done":
- [ ] `index.md` exists and follows template structure
- [ ] `referenced.md` exists and matches `index.md` with citations added
- [ ] All images referenced in Markdown exist in `images/` folder
- [ ] All inline citations point to valid files in `context/`
- [ ] `Sources:` block in `referenced.md` is complete
- [ ] Content passes `AGENT_CONTENT_CHECKLIST.md`
- [ ] Links to other sections are valid (use `npm run check:links`)
- [ ] Markdown is lint-clean (use `npm run lint:md`)

### Testing
- **Validate structure**: `find content/ -type d -name 'v*' | head -10`
- **Check versions**: `ls content/01_preparing_to_use_comapeo_mobile/01_understanding_comapeo_s_core_concepts_and_functions/`
- **View content**: `cat content/.../v1/index.md | head -50`
- **Verify images**: `ls content/.../v1/images/`
- **Run link checker**: `npm run check:links`
- **Lint Markdown**: `npm run lint:md`
