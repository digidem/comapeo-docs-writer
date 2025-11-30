# Configuration & Project Infrastructure

## Purpose
Defines project-level configuration, development workflows, Git conventions, CI/CD, and agent guidance. This module contains the "meta" layer that configures how the entire system operates.

## Key Files and Directories

### Root Configuration Files
- **`package.json`** - Node.js project manifest
  - Defines scripts: `docs:build`, `docs:serve`, `gen:all`, `gen:test`, `check:links`, etc.
  - Dependencies: `@openai/codex` (v0.34.0), `markdownlint-cli` (v0.45.0)
  - Uses CommonJS modules (`"type": "commonjs"`)
  - No test script defined yet

- **`package-lock.json`** - Lockfile for deterministic dependency installation

- **`.markdownlint.json`** - Markdown linting rules
  - Enforces consistent Markdown style
  - Used by `npm run lint:md`

- **`.gitignore`** - Git exclusions
  - Excludes `node_modules/`, `dist/`, temporary files
  - Keeps repository clean

- **`README.md`** - Project overview and setup instructions
  - Describes project purpose (CoMapeo documentation authoring)
  - Documents structure: `content/`, `context/`, `scripts/`
  - Provides getting started steps
  - Lists npm commands
  - Explains Codex workflow and rules
  - Points to reference files (`AGENTS.md`, `CLAUDE.md`)

- **`AGENTS.md`** - Minimal agent guide
  - Non-negotiable rules for AI agents
  - Prompts as entry points
  - Content-first workflow (use Codex, not ad-hoc scripts)
  - Version management rules
  - Git commit conventions
  - References to templates and style guides

- **`CLAUDE.md`** - Claude Code project instructions
  - Override instructions for Claude Code
  - Emphasizes structured content-first approach
  - Lists core rules (never modify templates, version all content, minimal git staging)
  - File naming conventions
  - Links to context files

### GitHub Configuration (`.github/`)
- **`.github/PULL_REQUEST_TEMPLATE.md`** - PR template
  - Ensures PRs include necessary context
  - Checklist for reviewers
  - Links to related issues

### Git Branch Strategy
From system prompt:
- Development branch: `claude/add-context-documentation-0126hH4BRBvoAfSnzdLMceTY`
- All work should be done on this branch
- Push with `git push -u origin <branch-name>`
- Branch naming: starts with `claude/`, ends with session ID

### NPM Scripts (package.json)

#### Documentation Scripts
- **`docs:build`** - Build static site (`node scripts/build-docs.js`)
- **`docs:serve`** - Serve docs on port 4000 (`node scripts/serve-docs.js`)
- **`docs`** - Build and serve in one command
- **`docs:open`** - Open docs in browser (cross-platform)

#### Content Generation Scripts
- **`gen`** - Generate next version for a section (`node scripts/gen.js`)
- **`gen:all`** - Generate all missing sections (`node scripts/gen-all.js`)
- **`gen:smoke`** - Smoke test scaffolding (`node scripts/gen-smoke.js`)
- **`gen:test`** - Generate first three sections (`node scripts/gen-test.js`)
- **`gen:next`** - Generate next version via Codex prompt
- **`test:ds`** - Dataset-specific test (`node scripts/gen-test-ds.js`)

#### Image & Caption Scripts
- **`caption:all`** - Generate captions for all images (uses Codex + `gpt-5`)
- **`caption`** - Generate caption for single image (uses Codex + `gpt-5`)

#### Validation Scripts
- **`check:links`** - Validate Markdown links (`node scripts/check_links.js`)
- **`lint:md`** - Lint Markdown files (`markdownlint "**/*.md" --ignore node_modules --ignore dist`)

#### Utility Scripts
- **`update-prompts`** - Copy prompts to Codex user directory (`mkdir -p "$HOME/.codex/prompts" && cp -a context/prompts/. "$HOME/.codex/prompts/"`)

## Major Concepts

### Content-First Workflow
From `AGENTS.md` and `CLAUDE.md`:
- This project is **content-first** (low/no-code)
- Agents should use Codex prompts in `context/prompts/`, not write ad-hoc scripts
- Generation tasks use `npm run gen:*` commands, not manual file manipulation
- Validation is done via `AGENT_CONTENT_CHECKLIST.md`, not custom code

### Immutable Templates
- Files in `context/templates/` are **read-only**
- Never modify templates directly
- Copy templates when creating new versions

### Version Management
- All content lives under `content/<topic>/<section>/vN/`
- Versions are `v1`, `v2`, `v3`, etc. (monotonically increasing)
- Latest version is determined by highest number

### Git Conventions
From `AGENTS.md`:
- **Never run `git add -A`** - Stage only specific files
- Use minimal diffs - don't reformat unnecessarily
- Commit messages should be descriptive
- No destructive git operations without user approval

### Codex Integration
- Codex is the primary content generation tool
- Uses `gpt-5` model by default
- Prompts in `context/prompts/` drive generation
- Flag: `--dangerously-bypass-approvals-and-sandbox` (for automation)

### Approval & Sandbox Modes
Some scripts use `--dangerously-bypass-approvals-and-sandbox` for non-interactive execution. Production systems should use proper approval profiles.

## External Dependencies
- **Node.js** (v14+) - JavaScript runtime
- **npm** - Package manager
- **Codex CLI** (`@openai/codex`) - OpenAI CLI tool
- **markdownlint-cli** - Markdown linting
- **Git** - Version control

## Context Engineering Considerations

### When Working in This Module
1. **Follow Agent Rules** - `AGENTS.md` and `CLAUDE.md` are authoritative. Do not deviate.
2. **No Ad-Hoc Scripts** - Use existing npm commands. Don't write one-off scripts for content tasks.
3. **Respect Git Conventions** - Minimal diffs, specific staging, descriptive commits.
4. **Update Documentation** - If adding new scripts, update `README.md` and `package.json`.
5. **Version Compatibility** - Ensure Node.js and npm versions are compatible.
6. **API Keys** - Codex requires OpenAI API credentials. Ensure they're configured before running generation scripts.
7. **Branch Naming** - Always use `claude/*` prefix for agent-created branches.
8. **PR Template** - Use `.github/PULL_REQUEST_TEMPLATE.md` when creating PRs.

### Agent Onboarding Workflow
When an agent starts working on this project:
1. Read `AGENTS.md` - Understand non-negotiable rules
2. Read `CLAUDE.md` - Understand Claude Code-specific instructions
3. Read `README.md` - Understand project structure and commands
4. Explore `context/system/INDEX.md` - Understand process and style
5. Review `context/content_deck/INDEX.md` - Understand content roadmap
6. Run `npm ci` - Install dependencies
7. Run `npm run docs` - Verify local preview works
8. Run `npm run check:links` - Ensure links are valid
9. Choose a section from `context/content_deck/INDEX.md`
10. Run `npm run gen` or `npm run gen:next` to generate content

### Configuration Updates
If modifying configuration:
- **package.json changes** - Run `npm install` to update lockfile
- **markdownlint rules** - Test with `npm run lint:md` before committing
- **Git ignore patterns** - Test with `git status` to ensure nothing important is ignored
- **Script additions** - Document in `README.md` and this file

### Environment Variables
- **`DEBUG`** - Set to `1` for verbose logging in generation scripts
- **`SECTION`** - Used by `npm run gen:next` to specify target section

### Testing Project Setup
```bash
# Install dependencies
npm ci

# Verify scripts work
npm run docs:build
npm run docs:serve &
curl http://localhost:4000

# Verify validation works
npm run check:links
npm run lint:md

# Verify generation scaffolding works
npm run gen:smoke
```

### Known Limitations
- **No automated tests** - `package.json` has `"test": "echo \"Error: no test specified\" && exit 1"`
- **Manual Codex setup** - Requires user to configure OpenAI API credentials
- **Single model** - Hardcoded to `gpt-5` in generation scripts
- **No CI/CD yet** - GitHub Actions not configured for automated testing

### Best Practices
1. **Use npm scripts** - Don't run scripts directly; use `npm run <script>`
2. **Check before pushing** - Run `npm run check:links` and `npm run lint:md`
3. **Update lockfile** - If modifying `package.json`, commit `package-lock.json` too
4. **Follow branch naming** - Use `claude/*` prefix for agent branches
5. **Document changes** - Update `README.md` if workflow changes
6. **Test locally** - Run `npm run docs` to preview changes before committing
