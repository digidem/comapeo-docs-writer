# Migration Guide: Hardcoded to Configurable Context System

This guide explains the transition from the hardcoded context file system to the new configurable JSON-based system.

## Overview

Previously, context files were hardcoded in two places:
1. `scripts/gen.js` - Lines 447-457 (9 file paths)
2. `scripts/show-prompt.js` - Lines 16-26 (same 9 file paths)

Now, all context configuration is centralized in `context-config.json` with a shared utility module.

## What Changed

### Before (Hardcoded)

**gen.js**:
```javascript
const PROMPT_FILE = path.join(ROOT, 'context/prompts/create-next-version.md');
const SECTION_TEMPLATE = path.join(ROOT, 'context/templates/SECTION.template.md');
// ... 7 more constants

const injectedContext = [
  { name: 'PROMPT: create-next-version.md', path: PROMPT_FILE },
  { name: 'TEMPLATE: SECTION.template.md', path: SECTION_TEMPLATE },
  // ... 7 more entries
];
```

**show-prompt.js**:
```javascript
const CONTEXT_FILES = [
  { name: 'PROMPT: create-next-version.md', path: 'context/prompts/create-next-version.md' },
  { name: 'TEMPLATE: SECTION.template.md', path: 'context/templates/SECTION.template.md' },
  // ... 7 more entries
];
```

### After (Configurable)

**context-config.json**:
```json
{
  "defaultContextSet": "standard",
  "contextSets": {
    "standard": {
      "name": "Standard Generation Context",
      "files": [
        {
          "id": "main-prompt",
          "name": "PROMPT: create-next-version.md",
          "path": "context/prompts/create-next-version.md",
          "category": "Core Prompt",
          "required": true,
          "injectOrder": 1
        },
        // ... 8 more file definitions
      ]
    }
  }
}
```

**scripts/context-loader.js** (shared utility):
```javascript
function loadContextConfig(contextSet = null) {
  // Loads and validates configuration
}

function loadContextContent(files) {
  // Loads and combines file content
}
```

## Backward Compatibility

The system maintains full backward compatibility:

1. **Default behavior unchanged**: The `standard` context set exactly matches the original 9 files
2. **Script behavior unchanged**: `npm run gen` works exactly as before
3. **File locations unchanged**: All context files remain in their original locations
4. **Template loading**: Falls back to default template location if not specified in config

## New Features

### 1. Multiple Context Sets
- `standard` - Original 9 files (default)
- `minimal` - 3 essential files for testing
- `extended` - All standard files plus content roadmap

### 2. CLI Options
```bash
# Select context set
npm run gen -- --context-set minimal

# List available sets
npm run show-prompt -- --list-sets
```

### 3. Configuration Validation
- JSON schema validation ensures configuration correctness
- Required file validation before generation
- Clear error messages for missing files

### 4. Enhanced Metadata
Each context file now includes:
- Unique ID for reference
- Category for organization
- Required flag (true/false)
- Injection order control
- Optional notes

## Migration Steps for Users

### For Regular Users (No Action Required)
If you only use the default generation workflow:
- **No changes needed**
- `npm run gen` continues to work exactly as before
- All existing documentation generation workflows remain functional

### For Advanced Users
If you want to use the new features:

1. **Explore available context sets**:
   ```bash
   npm run show-prompt -- --list-sets
   ```

2. **Try different context sets**:
   ```bash
   # Minimal context for testing
   npm run gen -- --context-set minimal

   # Extended context for complex sections
   npm run gen -- --context-set extended
   ```

3. **View prompts with different sets**:
   ```bash
   npm run show-prompt -- --context-set minimal
   npm run show-prompt -- --context-set extended
   ```

### For Developers/Contributors
If you need to modify or extend the context system:

1. **Add new context files**:
   - Add file to appropriate location in `context/` directory
   - Add entry to `context-config.json` in desired context set(s)

2. **Create new context sets**:
   - Copy an existing set in `context-config.json`
   - Modify the files array as needed
   - Update `defaultContextSet` if desired

3. **Modify existing context sets**:
   - Edit the files array in `context-config.json`
   - The schema will validate your changes

## Script Changes

### gen.js Changes
1. **Removed**: Hardcoded file path constants (PROMPT_FILE, SECTION_TEMPLATE, etc.)
2. **Removed**: Hardcoded `injectedContext` array
3. **Added**: `--context-set` CLI option parsing
4. **Added**: Configuration loading via `loadContextConfig()`
5. **Added**: Context content loading via `loadContextContent()`
6. **Added**: Template path parameter to `ensureNextVersion()`
7. **Added**: Help text with new options

### show-prompt.js Changes
1. **Removed**: Hardcoded `CONTEXT_FILES` array
2. **Added**: `--context-set` and `--list-sets` CLI options
3. **Added**: Configuration loading via `loadContextConfig()`
4. **Updated**: Statistics to use configuration data
5. **Added**: Context set listing functionality

## Template Loading Changes

Previously, the section template path was hardcoded:
```javascript
const template = fs.readFileSync(SECTION_TEMPLATE, 'utf8');
```

Now, it's configurable via the context set:
```javascript
function ensureNextVersion(sectionPath, { sectionTemplatePath = null } = {}) {
  // Load section template from config or fallback
  let template;
  if (sectionTemplatePath && fs.existsSync(sectionTemplatePath)) {
    template = fs.readFileSync(sectionTemplatePath, 'utf8');
  } else {
    // Fallback to default location
    const defaultTemplatePath = path.join(ROOT, 'context/templates/SECTION.template.md');
    template = fs.readFileSync(defaultTemplatePath, 'utf8');
  }
}
```

## Error Handling Improvements

### Before
- Generic file not found errors
- No validation of required files

### After
- Clear error messages: "Context set 'xyz' not found. Available sets: standard, minimal, extended"
- Required file validation before generation starts
- Configuration schema validation
- Fallback mechanisms for missing optional files

## Testing the Migration

To verify the migration was successful:

1. **Test default behavior**:
   ```bash
   npm run gen -- --skip-codex
   ```
   Should work exactly as before

2. **Test new context sets**:
   ```bash
   npm run gen -- --context-set minimal --skip-codex
   npm run gen -- --context-set extended --skip-codex
   ```

3. **Test prompt viewing**:
   ```bash
   npm run show-prompt
   npm run show-prompt -- --context-set minimal
   npm run show-prompt -- --list-sets
   ```

4. **Test error handling**:
   ```bash
   # Invalid context set
   npm run gen -- --context-set invalid-set --skip-codex
   # Should show: "Context set 'invalid-set' not found..."

   # Missing required file (temporarily rename a required file)
   mv context/prompts/create-next-version.md context/prompts/create-next-version.md.bak
   npm run gen -- --skip-codex
   # Should show: "Required context file not found..."
   mv context/prompts/create-next-version.md.bak context/prompts/create-next-version.md
   ```

## Benefits of the New System

1. **Centralized configuration** - One place to manage all context files
2. **Flexibility** - Multiple context sets for different scenarios
3. **Traceability** - Easy to see which files are included in each set
4. **Maintainability** - No duplication between scripts
5. **Validation** - Schema validation prevents configuration errors
6. **Extensibility** - Easy to add new context sets or files
7. **Documentation** - Configuration includes descriptions and notes

## Common Questions

### Q: Will my existing workflows break?
**A**: No, the `standard` context set matches the original 9 files exactly.

### Q: Do I need to update my CI/CD pipelines?
**A**: No, unless you want to use the new context set options.

### Q: Can I still use environment variables?
**A**: Yes, `SECTION` environment variable still works for section selection.

### Q: What if I don't specify a context set?
**A**: The `defaultContextSet` from `context-config.json` is used (currently "standard").

### Q: How do I add a new context file?
**A**: Add the file to the `context/` directory, then add an entry to the desired context set in `context-config.json`.

## Support

If you encounter issues with the migration:
1. Check the error messages - they are designed to be helpful
2. Verify `context-config.json` exists and is valid JSON
3. Ensure required context files exist at the specified paths
4. Use `DEBUG=1` environment variable for detailed logging
5. Refer to `context/README.md` for comprehensive documentation