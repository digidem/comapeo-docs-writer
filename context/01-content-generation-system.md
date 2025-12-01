# Content Generation System

## Purpose
Orchestrates AI-driven content generation using OpenAI Codex to create versioned documentation sections from source materials. This module handles the core workflow of generating new documentation versions by combining templates, prompts, and source materials.

## Key Files and Directories

### Generation Scripts
- `scripts/gen.js` - Main content generation script for individual sections
  - Creates next version folder (`vN/`) for a given section
  - Scaffolds directory structure with `index.md`, `referenced.md`, and `images/`
  - Invokes Codex with prompts from `context/prompts/`
  - Supports `-m`/`--model` to set model (defaults to `gpt-5.1`, or `gemini-3-pro-preview` if `-e gemini` is used)
  - Supports `-e`/`--engine` to set engine (e.g., `gemini`). **Note: `-y` is implicitly active when engine is `gemini`.**
  - Supports `-y`/`--yes` to bypass approvals (non-interactive)
  - Supports `--skip-codex` for dry-run testing
  - Validates generated content against templates

- `scripts/gen-all.js` - Batch generator for all sections
  - Iterates through all sections under `content/`
  - Calls `gen.js` for each section sequentially, forwarding flags
  - Exits on first failure to prevent cascading errors
  - Provides colorful progress logging

- `scripts/gen-test.js` - Generates first three missing sections (non-interactive)
  - Wrapper around generation prompt `context/prompts/create-first-three.md`
  - Used for testing and incremental development

- `scripts/gen-smoke.js` - Zero-token smoke test
  - Scaffolds a test section without calling Codex
  - Verifies directory structure creation works
  - Used for CI/CD validation

### Supporting Files
- `scripts/generate_content_structure.js` - Creates initial section folder structure
- `scripts/generate_missing_versions.js` - Identifies sections lacking version folders

## Major Functions/Classes

### gen.js Functions
- `ensureNextVersion(sectionPath, options)` - Creates and prepares next version directory
  - Scans existing versions (`v1`, `v2`, etc.)
  - Determines next version number
  - Optionally copies content from previous version
  - Inserts template content if needed
  - Returns metadata about created version

- `titleCaseName(seg)` - Converts snake_case folder names to Title Case
  - Handles special cases: CoMapeo, GPS, QR, ID
  - Respects minor words in titles (a, an, the, etc.)

- `stripPrefix(name)` - Removes numeric prefixes from folder names (e.g., `01_` → ``)

- `listSections()` - Enumerates all content sections
  - Finds topics matching pattern `\d{2}_*`
  - Returns sorted array of section paths

## External Dependencies
- `@openai/codex` (v0.34.0) - CLI tool for invoking OpenAI models
- Node.js `child_process` module for spawning Codex processes
- File system operations via `fs` and `fs/promises`

## Context Engineering Considerations

### When Working in This Module
1. **Prompt Engineering** - All generation prompts live in `context/prompts/`. Never hardcode prompts in scripts.
2. **Version Management** - The system assumes monotonically increasing version numbers (`v1`, `v2`, `v3`...). Do not skip versions.
3. **Idempotency** - Generation scripts are designed to be re-run safely. They check for existing files before creating.
4. **Template Integrity** - Templates in `context/templates/` must never be modified by generation scripts. Always copy, never mutate.
5. **Codex Model Selection** - Default model is `gpt-5.1`. Changes to model should be environment-configurable, not hardcoded.
6. **Error Handling** - Generation failures should be caught early. If template content remains unchanged after generation, scripts warn the user.
7. **Sandbox Mode** - Scripts use `--dangerously-bypass-approvals-and-sandbox` flag by default. Production systems should use proper approval profiles.
8. **Colorful Logging** - Uses ANSI color codes for terminal output (orange for general, green for success, red for warnings). DEBUG mode provides verbose output.

### Data Flow
1. User runs `npm run gen:all` or `npm run gen` with section path
2. Script reads section folder, determines next version number
3. Creates `vN/` directory with `index.md`, `referenced.md`, `images/`
4. Loads prompt from `context/prompts/create-next-version.md`
5. Appends section path to prompt
6. Invokes Codex with `gpt-5.1` (or configured model) and full prompt
7. Codex reads templates, sources, style guides, and previous versions
8. Codex generates content following `SECTION.template.md` structure
9. Script validates output is not identical to template or previous version
10. Reports success or warnings

### Known Limitations
- Requires OpenAI API credentials configured in Codex
- Generates one section at a time (sequential, not parallel)
- Cannot handle circular dependencies in content
- No automatic conflict resolution if multiple versions exist

### Testing
- Use `npm run gen:smoke` for zero-cost validation
- Use `npm run gen:test` to generate first three sections
- Set `DEBUG=1` environment variable for verbose logging
- Test with `--skip-codex` to validate scaffolding without API calls
