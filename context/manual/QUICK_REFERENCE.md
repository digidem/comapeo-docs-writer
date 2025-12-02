# Context Configuration Quick Reference

## Command Cheat Sheet

### Generation (gen.js)
```bash
# Default (standard context set)
npm run gen

# With specific context set
npm run gen -- --context-set minimal
npm run gen -- --context-set extended

# Dry run (skip Codex)
npm run gen -- --skip-codex

# Dry run with specific context set
npm run gen -- --context-set minimal --skip-codex

# Help
npm run gen -- --help
```

### Prompt Viewing (show-prompt.js)
```bash
# View standard prompt
npm run show-prompt

# View with specific context set
npm run show-prompt -- --context-set minimal
npm run show-prompt -- --context-set extended

# View with full content
npm run show-prompt -- --content

# List available context sets
npm run show-prompt -- --list-sets

# Save prompt to file
npm run show-prompt -- --output my-prompt.md

# Help
npm run show-prompt -- --help
```

## Context Sets at a Glance

| Set | Files | Purpose | When to Use |
|-----|-------|---------|-------------|
| **standard** | 9 | Regular generation | Default for all documentation work |
| **minimal** | 3 | Testing & debugging | Quick iterations, prompt testing |
| **extended** | 10 | Complex sections | New contributors, complex topics |

## File Categories

| Category | Example Files | Purpose |
|----------|---------------|---------|
| **Core Prompt** | `create-next-version.md` | Primary generation instructions |
| **Templates** | `SECTION.template.md` | Content structure templates |
| **Process Guides** | `PROCESS.md` | Workflow documentation |
| **Style & Tone** | `STYLE_GUIDE.md` | Writing guidelines |
| **Quality Controls** | `AGENT_CONTENT_CHECKLIST.md` | Validation checklists |
| **References** | `GLOSSARY_REF.md` | Terminology reference |
| **Content Roadmap** | `content_deck/INDEX.md` | Content planning |

## Configuration File Reference

### context-config.json Structure
```json
{
  "$schema": "./schemas/context-config.schema.json",
  "version": "1.0.0",
  "description": "Configuration for context files",
  "defaultContextSet": "standard",
  "contextSets": {
    "set-name": {
      "name": "Human-readable name",
      "description": "When to use this set",
      "files": [
        {
          "id": "unique-id",
          "name": "Display name",
          "path": "relative/path/to/file.md",
          "category": "Category",
          "required": true,
          "injectOrder": 1,
          "notes": "Optional notes"
        }
      ]
    }
  }
}
```

### File Definition Fields
- `id`: Unique identifier (lowercase, hyphens, underscores)
- `name`: Display name shown in output
- `path`: Relative path from project root
- `category`: Grouping category
- `required`: Whether generation fails if missing (default: true)
- `injectOrder`: Order in prompt (lower = earlier)
- `notes`: Optional description

## Common Tasks

### Add a New Context File
1. Place file in `context/` directory
2. Add entry to desired context set in `context-config.json`:
```json
{
  "id": "my-new-file",
  "name": "MY_FILE.md",
  "path": "context/path/to/my-file.md",
  "category": "References",
  "required": false,
  "injectOrder": 10
}
```

### Create a New Context Set
1. Copy an existing set in `context-config.json`
2. Modify the `files` array as needed
3. (Optional) Update `defaultContextSet` if this should be default

### Debug Context Loading
```bash
# Enable debug logging
DEBUG=1 npm run gen -- --skip-codex

# View prompt with debug info
DEBUG=1 npm run show-prompt
```

### Validate Configuration
```bash
# Check JSON syntax
node -c context-config.json

# Test loading
node -e "require('./scripts/context-loader').listContextSets()"
```

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `SECTION` | Auto-select section | `SECTION="installing comapeo" npm run gen` |
| `CONTEXT_SET` | Override context set | `CONTEXT_SET=minimal npm run gen` |
| `DEBUG` | Enable debug logging | `DEBUG=1 npm run gen` |

## Error Messages & Solutions

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| "Context set 'xyz' not found" | Invalid context set name | Use `npm run show-prompt -- --list-sets` to see available sets |
| "Required context file not found" | Missing file at specified path | Check file exists at path in configuration |
| "Failed to parse context configuration" | Invalid JSON in config | Validate JSON syntax: `node -c context-config.json` |
| "Invalid context set: missing name or files" | Configuration structure error | Check schema compliance |

## Performance Tips

1. **Use `minimal` set** for testing - faster generation with 3 files vs 9
2. **Dry run first** - `--skip-codex` to test without AI costs
3. **Debug mode** - `DEBUG=1` to see what's being loaded
4. **Prompt preview** - Use `show-prompt` before generation to verify context

## Integration Examples

### CI/CD Pipeline
```yaml
# Generate with minimal context for testing
- name: Test generation
  run: npm run gen -- --context-set minimal --skip-codex

# Generate documentation with standard context
- name: Generate docs
  run: npm run gen
  env:
    SECTION: ${{ env.TARGET_SECTION }}
```

### Development Workflow
```bash
# 1. Preview prompt
npm run show-prompt -- --context-set minimal

# 2. Test generation (dry run)
npm run gen -- --context-set minimal --skip-codex

# 3. Generate with AI
npm run gen -- --context-set standard
```

### Batch Processing
```bash
# Generate multiple sections with different context sets
for section in "installing" "configuring" "using"; do
  SECTION="$section" npm run gen -- --context-set minimal --skip-codex
done
```

## Related Documentation

- `../README.md` - Comprehensive system documentation
- `./MIGRATION.md` - Migration from hardcoded system
- `../../schemas/context-config.schema.json` - Configuration schema
- `../../scripts/context-loader.js` - API documentation in code comments