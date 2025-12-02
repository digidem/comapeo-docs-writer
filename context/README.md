# Context Configuration System

This system manages the context files that are injected into AI prompts for documentation generation. It replaces the previous hardcoded approach with a flexible, configurable JSON-based system.

## Overview

The context configuration system allows you to:
- Define multiple sets of context files for different generation scenarios
- Easily trace, follow, and modify which context files are used
- Validate configuration with JSON schema
- Select different context sets via CLI options
- Maintain backward compatibility with existing workflows

## Configuration Files

### Main Configuration: `context-config.json`

Located at the project root, this file defines all available context sets:

```json
{
  "$schema": "./schemas/context-config.schema.json",
  "version": "1.0.0",
  "description": "Configuration for context files injected into generation prompts",
  "defaultContextSet": "standard",
  "contextSets": {
    "standard": {
      "name": "Standard Generation Context",
      "description": "Default context for regular content generation. Matches the original hardcoded 9 files.",
      "files": [
        {
          "id": "main-prompt",
          "name": "PROMPT: create-next-version.md",
          "path": "context/prompts/create-next-version.md",
          "category": "Core Prompt",
          "required": true,
          "injectOrder": 1,
          "notes": "Primary prompt that defines the generation task"
        },
        // ... more files
      ]
    },
    "minimal": {
      // Reduced context for testing
    },
    "extended": {
      // Extended context with additional files
    }
  }
}
```

### Schema: `schemas/context-config.schema.json`

Validates the configuration structure and ensures all required fields are present.

## Available Context Sets

### 1. `standard` (default)
- **Purpose**: Regular content generation
- **Files**: 9 files (matches original hardcoded configuration)
- **Use when**: Generating new documentation sections or improving existing ones

### 2. `minimal`
- **Purpose**: Testing and quick iterations
- **Files**: 3 essential files only
- **Use when**: Testing prompts, debugging, or when you need faster generation

### 3. `extended`
- **Purpose**: Complex sections or new contributors
- **Files**: All standard files plus content roadmap
- **Use when**: Working on complex sections, onboarding new contributors, or when you need maximum context

## Using Context Sets

### Command Line Options

#### `gen.js` Script
```bash
# Use standard context set (default)
npm run gen

# Use minimal context set
npm run gen -- --context-set minimal

# Use extended context set
npm run gen -- --context-set extended

# Show help with all options
npm run gen -- --help
```

#### `show-prompt.js` Script
```bash
# Show prompt with standard context set
npm run show-prompt

# Show prompt with minimal context set
npm run show-prompt -- --context-set minimal

# List all available context sets
npm run show-prompt -- --list-sets

# Show help with all options
npm run show-prompt -- --help
```

### Environment Variable

You can also set the context set via environment variable:
```bash
CONTEXT_SET=minimal npm run gen
```

## Context File Structure

Each context file definition includes:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (lowercase, hyphens, underscores) |
| `name` | string | Yes | Display name for the file |
| `path` | string | Yes | Relative path from project root |
| `category` | string | Yes | Grouping category (Core Prompt, Templates, etc.) |
| `required` | boolean | No | Whether file is required (default: true) |
| `injectOrder` | integer | No | Order in which file is injected (lower numbers first) |
| `notes` | string | No | Optional notes about the file |

## File Categories

Context files are organized into categories for better organization:

1. **Core Prompt** - Primary prompt files that define generation tasks
2. **Templates** - Section and procedural content templates
3. **Process Guides** - Workflow and process documentation
4. **Style & Tone** - Writing style, formatting, and voice guidelines
5. **Quality Controls** - Validation checklists and quality standards
6. **References** - Terminology, glossary, and reference materials
7. **Content Roadmap** - Content planning and prioritization

## Adding New Context Sets

To add a new context set:

1. Edit `context-config.json`
2. Add a new entry to the `contextSets` object
3. Define the files array with the desired context files
4. Update the `defaultContextSet` if needed
5. The schema will validate your changes

Example:
```json
"my-custom-set": {
  "name": "My Custom Context",
  "description": "Custom context for specific use cases",
  "files": [
    {
      "id": "main-prompt",
      "name": "PROMPT: create-next-version.md",
      "path": "context/prompts/create-next-version.md",
      "category": "Core Prompt",
      "required": true,
      "injectOrder": 1
    },
    // Add other files as needed
  ]
}
```

## Technical Details

### Context Loader Module

The `scripts/context-loader.js` module provides shared functionality:

- `loadContextConfig(contextSet)` - Loads and validates configuration
- `getContextStats(files)` - Returns statistics about context files
- `loadContextContent(files)` - Loads and combines file content
- `validateContextFiles(files)` - Validates that required files exist
- `listContextSets()` - Lists all available context sets

### Template Loading

The `ensureNextVersion` function in `gen.js` now accepts a `sectionTemplatePath` parameter, allowing templates to be specified in the configuration rather than hardcoded.

### Error Handling

The system provides clear error messages for:
- Missing configuration files
- Invalid context set names
- Missing required context files
- Configuration validation errors

## Migration from Hardcoded System

The new system is backward compatible. The `standard` context set exactly matches the original 9 hardcoded files, so existing workflows continue to work without changes.

## Best Practices

1. **Use appropriate context sets**:
   - `standard` for regular generation
   - `minimal` for testing and debugging
   - `extended` for complex sections

2. **Keep file paths relative** to project root for portability

3. **Use meaningful IDs** that describe the file's purpose

4. **Set `required: false`** for optional files that can be missing

5. **Use `injectOrder`** to control the sequence of file injection

6. **Validate changes** by running `npm run show-prompt -- --context-set <your-set>` to see the combined prompt

## Troubleshooting

### Common Issues

1. **"Context set not found"**
   - Check that the context set name exists in `context-config.json`
   - Use `npm run show-prompt -- --list-sets` to see available sets

2. **"Required context file not found"**
   - Verify the file path exists relative to project root
   - Check file permissions

3. **Configuration validation errors**
   - Run JSON validation against the schema
   - Check for missing required fields

4. **Template loading issues**
   - Ensure the section template file is specified in the context set
   - Check that the template file exists at the specified path

### Debugging

Enable debug mode to see detailed information:
```bash
DEBUG=1 npm run gen -- --context-set minimal
```

This will show:
- Which context set is being used
- File loading and validation details
- Template loading information
- Command construction details

## Related Files

- `context-config.json` - Main configuration
- `schemas/context-config.schema.json` - Configuration schema
- `scripts/context-loader.js` - Shared utility module
- `scripts/gen.js` - Generation script (updated)
- `scripts/show-prompt.js` - Prompt viewing script (updated)