# Documentation Builder & Server

## Purpose
Builds a browsable static documentation site from versioned Markdown content and serves it locally for preview. This module transforms the `content/` and `context/` folders into an interactive HTML viewer with navigation, version switching, and GitHub integration.

## Key Files and Directories

### Builder Scripts
- `scripts/build-docs.js` - Main static site generator
  - Creates `dist/` output directory
  - Copies `context/` and `content/` to `dist/`
  - Generates `index.html` with section/topic navigation
  - Generates `viewer.html` for rendering Markdown
  - Produces JSON manifests: `files.json`, `versions.json`, `sidebar.json`
  - Supports `--all` mode to include all Markdown files (vs. latest versions only)

- `scripts/serve-docs.js` - Local development server
  - Serves `dist/` directory on port 4000
  - Provides hot-reloading for development
  - Accessible at `http://localhost:4000`

### Generated Outputs (in dist/)
- `dist/index.html` - Main landing page with CoMapeo theme
- `dist/viewer.html` - Markdown viewer with sidebar navigation
- `dist/files.json` - List of all Markdown file paths (latest versions)
- `dist/versions.json` - Version metadata for each section/topic
- `dist/sidebar.json` - Structured navigation tree
- `dist/context/` - Copy of all context materials
- `dist/content/` - Copy of all versioned content

## Major Functions/Classes

### build-docs.js Functions
- `buildContentTree(contentRoot)` - Walks content directory and builds navigation structure
  - Identifies sections matching `\d{2}_*` pattern
  - Finds topics within sections
  - Extracts versions (`v1`, `v2`, etc.) and determines latest
  - Returns `{ latestFiles, versionsMap, sections }`

- `makeIndexHtml(items, sections)` - Generates landing page HTML
  - Creates styled index with CoMapeo branding (blue/brown/orange theme)
  - Two modes: simple file list or structured section/topic hierarchy
  - Includes filter/search functionality
  - Links to viewer for each topic

- `makeViewerHtml()` - Generates Markdown viewer page
  - Uses Marked.js for Markdown parsing
  - Uses DOMPurify for XSS protection
  - Implements sidebar navigation with active state
  - Adds version selector bar at top of content
  - Fixes relative image paths (especially `../context/` references)
  - Injects footer with GitHub links (view, edit, referenced.md)
  - Styled with CoMapeo color palette and responsive design

- `collectMarkdownFiles(root)` - Recursively finds all `.md` files
- `relToRoot(fullPath)` - Converts absolute paths to repo-relative forward-slash paths
- `titleCaseName(seg)` - Same title casing logic as generation scripts
- `toDisplayName(relPath)` - Derives human-readable names from file paths

### serve-docs.js Functions
- Simple HTTP server using Node.js `http` module
- Serves static files from `dist/`
- Sets appropriate MIME types
- Logs requests to console

## External Dependencies
- Node.js core modules: `fs`, `fs/promises`, `path`, `http`
- Client-side libraries (CDN):
  - `marked` (Markdown parser)
  - `dompurify` (v3.1.6, XSS sanitization)
  - `github-markdown-css` (v5.2.0, GitHub-flavored styling)

## Context Engineering Considerations

### When Working in This Module
1. **Path Resolution** - All paths use forward slashes and are relative to repo root. This ensures cross-platform compatibility.
2. **Image Handling** - Viewer auto-fixes image paths, especially for `../context/sources/**` references from content files.
3. **Version Management** - Builder respects versioning: latest version of each topic is featured, older versions accessible via version bar.
4. **Responsive Design** - Viewer uses CSS Grid with sidebar that collapses on mobile (<900px).
5. **Security** - All Markdown is sanitized via DOMPurify before rendering to prevent XSS attacks.
6. **GitHub Integration** - Footer links assume GitHub repo `digidem/comapeo-docs-writer` on `main` branch. Update if repo changes.
7. **Offline-First** - Site works fully offline once built. CDN dependencies are the only external requirement.
8. **CoMapeo Branding** - Color scheme: Blue (`#1f4ed8`), Orange (`#f97316`), Brown (`#6b4423`). Maintain consistency when editing styles.

### Data Flow
1. User runs `npm run docs:build`
2. Script clears and recreates `dist/` directory
3. Copies `context/` → `dist/context/` (templates, sources, guides)
4. Copies `content/` → `dist/content/` (versioned sections)
5. Walks content tree to identify topics and versions
6. Generates `sidebar.json` with navigation structure
7. Generates `versions.json` mapping sections to version lists
8. Generates `index.html` with topic links
9. Generates `viewer.html` with Markdown renderer
10. User runs `npm run docs:serve` to start local server
11. Browser loads `http://localhost:4000/index.html`
12. Clicking a topic loads `viewer.html?file=<path>`
13. Viewer fetches Markdown file, parses with Marked, sanitizes with DOMPurify, and displays

### Viewer Features
- **Sidebar Navigation** - Hierarchical section/topic tree with active state highlighting
- **Version Switcher** - Top bar shows all versions (v1, v2, Template) with links
- **Image Handling** - Auto-resolves relative paths, displays images with shadow/rounded corners
- **Footer Actions** - View on GitHub, Edit on GitHub, Referenced.md link, Repo Home
- **Responsive** - Grid layout adapts to mobile (stacked) and desktop (sidebar + content)
- **Back Navigation** - "← Back to index" link in sidebar

### Known Limitations
- No live reload (must rebuild after content changes)
- External CDN dependencies (Marked, DOMPurify, GitHub CSS)
- No search functionality (only client-side filter on index page)
- No dark mode support
- Assumes GitHub repo structure for footer links

### Testing
- Run `npm run docs:build && npm run docs:serve`
- Open `http://localhost:4000` in browser
- Verify navigation, version switching, image display, and GitHub links
- Test on mobile viewport (<900px) for responsive behavior
