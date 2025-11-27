# Context System

## Purpose
Provides the **source of truth** for content generation: templates, prompts, style guides, source materials, and content roadmap. This module is the curated knowledge base that AI agents use to generate accurate, consistent documentation.

## Key Files and Directories

### Templates (`context/templates/`)
- `SECTION.template.md` - Standard template for `index.md` files
  - Defines heading structure
  - Placeholder: `[SECTION TITLE]`
  - Used by generation scripts to scaffold new sections

- `REFERENCED_SECTION.template.md` - Template for `referenced.md` files
  - Same structure as `SECTION.template.md`
  - Includes inline source citations `[Source: context/...]`
  - Includes "Sources:" block at end

- `TODO.template.md` - Thinking aid for planning sections
  - Not used in final content
  - Helps agents plan before generating

- `INDEX.md` - Template documentation

### Prompts (`context/prompts/`)
Codex prompts that drive content generation. Each prompt is a standalone Markdown file that the agent reads.

- `create-next-version.md` - Main prompt for generating next version of a section
- `create-next-content.md` - Prompt for creating new content sections
- `create-first-three.md` - Prompt for generating first three missing sections
- `create-all-content.md` - Prompt for batch generation
- `caption-image.md` - Prompt for generating image captions
- `caption-all-images.md` - Batch image captioning prompt
- `stash-content.md` - Utility prompt for content management

### System Guides (`context/system/`)
Core documentation that defines processes, style, and quality standards.

- `STYLE_GUIDE.md` - Defines tone, voice, formatting conventions
  - Short, direct sentences
  - Active voice
  - User-centric language
  - Avoids jargon unless necessary
  - Uses CoMapeo-specific terminology correctly

- `TONE_GUIDE.md` - Voice and personality guidelines
  - Supportive but not patronizing
  - Clear and actionable
  - Empowering language

- `PROCESS.md` - Workflow for content creation
  - Step-by-step instructions for generating content
  - Version management rules
  - Quality gates

- `AGENT_CONTENT_CHECKLIST.md` - Validation checklist for generated content
  - Link validation
  - Image verification
  - Citation completeness
  - Template adherence
  - Style compliance

- `INDEX.md` - Overview of system folder
- `README.md` - Usage notes

### Source Materials (`context/sources/`)
Primary source materials that content is derived from. These are **read-only** reference materials.

- `quickstart_guides/` - Quick-start guides for various CoMapeo features
  - Organized by feature/topic
  - `INDEX.md` provides navigation

- `mapeo_docs/` - Legacy documentation (treated as background only)
  - Not app-specific
  - Used sparingly for high-level context

- `mega_deck/` - Presentation materials
- `setup_guide/` - Setup and installation guides
- `screenshots/` - Screenshot library for illustrations
- `videos/` - Video resources
- `quickstart_guide_unaccom/` - Additional quick-start materials
- `INDEX.md` - Master index for navigating sources
- `IMAGE_SUMMARY.md` - Catalog of available images with descriptions

### Content Roadmap (`context/content_deck/`)
Defines **what** content to create and in what order.

- `INDEX.md` - Comprehensive content roadmap
  - Lists all planned sections/topics
  - Links to Notion pages for source material
  - Maps to folder structure in `content/`
  - Provides summaries of each topic

- `MATERIALS_INDEX.md` - Ordered list of materials (priority sequence)
- `content_deck.md` - Detailed content specifications

## Major Concepts

### Content Deck Hierarchy
The content deck organizes documentation into a hierarchy:
1. **Top-level topics** (e.g., "Preparing to Use CoMapeo Mobile")
2. **Sections** within topics (e.g., "Installing & Uninstalling CoMapeo")
3. **Versions** of each section (e.g., `v1/`, `v2/`)

This maps to filesystem structure:
```
content/
  01_preparing_to_use_comapeo_mobile/
    01_understanding_comapeo_s_core_concepts_and_functions/
      v1/
        index.md
        referenced.md
        images/
```

### Template Structure
All sections follow the same structure defined in `SECTION.template.md`:
- **Title** - Section heading
- **Introduction** - Overview paragraph
- **Body** - Main content (steps, explanations, tips)
- **Related Topics** - Links to other sections (optional)

The `referenced.md` variant adds:
- **Inline citations** - `[Source: context/path/to/file.md]` after each claim
- **Sources block** - Complete list of referenced files at the end

### Style Guidelines (from STYLE_GUIDE.md)
- **Clarity over cleverness** - Simple, direct language
- **User tasks, not system features** - Focus on what users do, not what the app does
- **Active voice** - "Tap the button" not "The button should be tapped"
- **Consistent terminology** - "CoMapeo" (capital M), "observation" (not "data point"), "Exchange" (not "sync")
- **Scannable format** - Short paragraphs, bulleted lists, clear headings
- **Avoid jargon** - Define technical terms on first use
- **Screenshots** - Use liberally with descriptive captions

### Prompt Engineering Patterns
Prompts in `context/prompts/` follow these patterns:
1. **Context Setting** - "You are generating documentation for CoMapeo..."
2. **Task Definition** - "Create the next version of section X..."
3. **Constraints** - "Use only information from context/sources/**"
4. **Quality Requirements** - "Follow STYLE_GUIDE.md, validate with AGENT_CONTENT_CHECKLIST.md"
5. **Output Format** - "Generate index.md and referenced.md with inline citations"

## External Dependencies
None. This module is pure data (Markdown files, images, videos).

## Context Engineering Considerations

### When Working in This Module
1. **Never Modify Templates** - Templates in `context/templates/` are immutable. Copy them when scaffolding new versions.
2. **Source Material is Read-Only** - `context/sources/**` should not be edited by generation processes. These are inputs, not outputs.
3. **Prompt Versioning** - If prompts change significantly, consider versioning them or documenting changes in git history.
4. **Image Management** - Images in `context/sources/screenshots/` are named with unique IDs. Use `IMAGE_SUMMARY.md` to find appropriate images.
5. **Content Deck Alignment** - Always check `context/content_deck/INDEX.md` before creating new sections. The roadmap defines priority and scope.
6. **Citation Requirements** - Every claim in `referenced.md` must cite a file in `context/`. If a detail isn't in `context/`, add a `TODO:` marker.
7. **Legacy Docs Caution** - `context/sources/mapeo_docs/` is legacy material. Use sparingly and only for background. Prefer `quickstart_guides/` for current information.
8. **Style Consistency** - All generated content must pass `AGENT_CONTENT_CHECKLIST.md`. This is non-negotiable.

### Navigation and Discovery
- **Start with** `context/sources/quickstart_guides/INDEX.md` to find source materials
- **Consult** `context/content_deck/INDEX.md` for content roadmap and priorities
- **Follow** `context/system/PROCESS.md` for step-by-step workflow
- **Validate** with `context/system/AGENT_CONTENT_CHECKLIST.md` before finalizing

### Agent Workflow
When an agent generates content:
1. Read the prompt (e.g., `create-next-version.md`)
2. Identify the section to generate (from prompt or CLI args)
3. Consult `context/content_deck/INDEX.md` to understand the section's purpose
4. Find relevant source materials in `context/sources/**`
5. Load templates from `context/templates/`
6. Review style guidelines in `context/system/STYLE_GUIDE.md`
7. Generate `index.md` following template structure
8. Generate `referenced.md` with inline citations
9. Validate output against `AGENT_CONTENT_CHECKLIST.md`
10. Copy images from `context/sources/screenshots/` to section's `images/` folder

### Known Patterns
- **Filename Convention** - All files/folders use `snake_case`, lowercase, ASCII
- **Section Numbering** - Top-level topics use `01_`, `02_` prefixes; sections within topics also use `01_`, `02_`
- **Image Paths** - Content files reference images as `./images/<filename>` or `../../../context/sources/screenshots/<filename>`
- **Notion Links** - Content deck includes Notion URLs for original source material (not used in final content)

### Testing
- Validate templates exist: `ls context/templates/*.md`
- Check source materials: `ls context/sources/quickstart_guides/`
- Verify style guide: `cat context/system/STYLE_GUIDE.md`
- Review content roadmap: `cat context/content_deck/INDEX.md | head -100`
