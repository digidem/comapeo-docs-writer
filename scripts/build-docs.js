#!/usr/bin/env node
/*
 Build a browsable docs site into dist/:
 - Copies context/ into dist/context
 - Generates dist/index.html with links to latest version files
 - Generates dist/viewer.html that renders any md via Marked + DOMPurify
 - Emits dist/versions.json mapping sections to all available versions
*/
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = process.cwd();
const CONTEXT_DIR = path.join(ROOT, 'context');
const CONTENT_DIR = path.join(ROOT, 'content');
const DIST_DIR = path.join(ROOT, 'dist');

async function exists(p) {
  try { await fsp.access(p); return true; } catch { return false; }
}

async function rmrf(dir) {
  if (!(await exists(dir))) return;
  await fsp.rm(dir, { recursive: true, force: true });
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function copyRecursive(src, dest) {
  const stat = await fsp.stat(src);
  if (stat.isDirectory()) {
    await ensureDir(dest);
    const entries = await fsp.readdir(src);
    for (const e of entries) {
      await copyRecursive(path.join(src, e), path.join(dest, e));
    }
  } else {
    await ensureDir(path.dirname(dest));
    await fsp.copyFile(src, dest);
  }
}

async function collectMarkdownFiles(root) {
  const out = [];
  async function walk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) {
        out.push(full);
      }
    }
  }
  await walk(root);
  return out;
}

function relToRoot(fullPath) {
  // Return a forward-slash path relative to repository root (e.g., "content/..." or "context/...")
  const rel = path.relative(ROOT, fullPath);
  return rel.split(path.sep).join('/');
}

function stripPrefix(seg) {
  return seg.replace(/^\d{2}_/, '');
}
function titleCaseName(seg) {
  // Convert snake_case to Title Case, fixing CoMapeo and similar tokens
  const minor = new Set(['a','an','and','as','at','but','by','for','from','in','into','nor','of','on','or','per','the','to','vs','via','with','your','outside']);
  const base = stripPrefix(seg).replace(/_/g, ' ');
  const parts = base.split(/\s+/).filter(Boolean).map((w, i) => {
    const lw = w.toLowerCase();
    if (i > 0 && minor.has(lw)) return lw;
    return lw.charAt(0).toUpperCase() + lw.slice(1);
  });
  let out = parts.join(' ');
  out = out.replace(/Comapeo/g, 'CoMapeo');
  out = out.replace(/CoMapeo s/g, "CoMapeo's");
  out = out.replace(/ Gps /g, ' GPS ');
  out = out.replace(/ Id /g, ' ID ');
  out = out.replace(/ Qr /g, ' QR ');
  out = out.replace(/Can t/g, "Can't");
  return out;
}

function toDisplayName(relPath) {
  const parts = relPath.split('/');
  const filename = parts[parts.length - 1] || '';
  let base;
  if (filename.toLowerCase() === 'index.md' && parts.length >= 2) {
    base = parts[parts.length - 2];
  } else {
    base = filename.replace(/\.md$/i, '');
  }
  return titleCaseName(base);
}

function makeIndexHtml(items) {
  const links = items
    .sort()
    .map((p) => {
      const label = toDisplayName(p);
      return '<li><a href="viewer.html?file=' + encodeURIComponent(p) + '">' + label + '</a></li>';
    })
    .join('\n');
  return '<!doctype html>\n'
  + '<html lang="en">\n'
  + '<head>\n'
  + '  <meta charset="utf-8" />\n'
  + '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n'
  + '  <title>Docs Index</title>\n'
  + '  <style>\n'
  + '    html, body { height: 100%; overflow-x: hidden; }\n'
  + '    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; margin: 0; }\n'
  + '    header { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }\n'
  + '    main { padding: 16px; max-width: 980px; margin: 0 auto; }\n'
  + '    input { width: 100%; padding: 8px 10px; margin: 8px 0 16px; }\n'
  + '    ul { line-height: 1.6; padding-left: 1rem; }\n'
  + '    li { margin: 2px 0; }\n'
  + '    .count { color: #6b7280; font-size: 12px; }\n'
  + '    a { color: #2563eb; text-decoration: none; word-break: break-word; }\n'
  + '    a:hover { text-decoration: underline; }\n'
  + '    @media (max-width: 640px) { header { padding: 10px 12px; } main { padding: 12px; } }\n'
  + '  </style>\n'
  + '  <script>\n'
  + '    (function injectFooterCSS(){\n'
  + '      try {\n'
  + '        var css = ".footer{margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb}.footer a.btn{display:inline-block;margin:4px 8px 0 0;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;color:#111827;background:#f9fafb;text-decoration:none;font-size:14px}.footer a.btn:hover{background:#f3f4f6;border-color:#9ca3af}.footer a.btn:active{background:#e5e7eb}";\n'
  + '        var s = document.createElement(\'style\'); s.textContent = css; document.head.appendChild(s);\n'
  + '      } catch(e) {}\n'
  + '    })();\n'
  + '    function filterList() {\n'
  + '      var q = document.getElementById(\'q\').value.toLowerCase();\n'
  + '      var items = document.querySelectorAll(\'#list li\');\n'
  + '      var shown = 0;\n'
  + '      items.forEach(function(li){\n'
  + '        var text = li.textContent.toLowerCase();\n'
  + '        var match = text.includes(q);\n'
  + '        li.style.display = match ? \"\" : \"none\";\n'
  + '        if (match) shown++;\n'
  + '      });\n'
  + '      document.getElementById(\'count\').textContent = shown + \" files\";\n'
  + '    }\n'
  + '  </script>\n'
  + '  </head>\n'
  + '<body>\n'
  + '  <header>\n'
  + '    <h1 style="margin: 0; font-size: 18px;">Docs Index</h1>\n'
  + '    <div class="count" id="count">' + items.length + ' files</div>\n'
  + '  </header>\n'
  + '  <main>\n'
  + '    <input id="q" type="search" placeholder="Filter files..." oninput="filterList()" />\n'
  + '    <ul id="list">' + links + '</ul>\n'
  + '  </main>\n'
  + '</body>\n'
  + '</html>';
}

function makeViewerHtml() {
  return '<!doctype html>\n'
  + '<html lang="en">\n'
  + '<head>\n'
  + '  <meta charset="utf-8" />\n'
  + '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n'
  + '  <title>Markdown Viewer</title>\n'
  + '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css" integrity="sha512-FyQ+P4Ie1oXv7fks8+f6ZfBfJ0qMZ2xM1u9Zc8mp6D9Wm2b5iQ4uVY1qv+L+QvJ2U3V1qNR1ZB9a4D2SZp3b0w==" crossorigin="anonymous" referrerpolicy="no-referrer" />\n'
  + '  <style>\n'
  + '    :root { --sidebar: 260px; }\n'
  + '    html, body { height: 100%; }\n'
  + '    body { margin: 0; display: grid; grid-template-columns: var(--sidebar) 1fr; height: 100vh; overflow-x: hidden; }\n'
  + '    nav { border-right: 1px solid #e5e7eb; padding: 12px; overflow: auto; max-width: 100%; }\n'
  + '    main { padding: 16px; overflow: auto; }\n'
  + '    .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 15px; overflow-wrap: anywhere; word-wrap: break-word; }\n'
  + '    .markdown-body img { max-width: 100%; height: auto; max-height: 80vh; display: block; margin: 8px auto; object-fit: contain; }\n'
  + '    .markdown-body pre { max-width: 100%; overflow: auto; }\n'
  + '    input { width: 100%; padding: 8px 10px; margin: 8px 0 16px; }\n'
  + '    a { color: #2563eb; text-decoration: none; }\n'
  + '    a:hover { text-decoration: underline; }\n'
  + '    .file { display:block; margin: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n'
  + '    @media (max-width: 900px) { body { grid-template-columns: 1fr; grid-template-rows: auto 1fr; } nav { border-right: none; border-bottom: 1px solid #e5e7eb; } .file { white-space: normal; } }\n'
  + '  </style>\n'
  + '  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>\n'
  + '  <script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>\n'
  + '</head>\n'
  + '<body>\n'
  + '  <nav>\n'
  + '    <a id="backLink" href="#">← Back to index</a>\n'
  + '    <div id="sidebar"></div>\n'
  + '  </nav>\n'
  + '  <main>\n'
  + '    <article id="content" class="markdown-body">Loading…</article>\n'
  + '    <div id="footer"></div>\n'
  + '  </main>\n'
  + '  <script>\n'
  + '    function getParam(name) {\n'
  + '      var url = new URL(window.location.href);\n'
  + '      return url.searchParams.get(name);\n'
  + '    }\n'
  + '    function setBaseFor(absUrl) {\n'
  + '      var base = document.querySelector(\'base\');\n'
  + '      if (!base) { base = document.createElement(\'base\'); document.head.prepend(base); }\n'
  + '      var href = typeof absUrl === \"string\" ? absUrl : (absUrl && absUrl.href) || \"\";\n'
  + '      var lastSlash = href.lastIndexOf(\"/\") + 1;\n'
  + '      base.href = href.slice(0, lastSlash);\n'
  + '    }\n'
  + '    var currentFile = null;\n'
  + '    var allFiles = null;\n'
  + '    function updateFooter() {\n'
  + '      try {\n'
  + '        var footer = document.getElementById(\'footer\');\n'
  + '        if (!footer || !currentFile) return;\n'
  + '        var repo = "https://github.com/digidem/comapeo-docs-writer";\n'
  + '        var blobUrl = repo + "/blob/main/" + currentFile;\n'
  + '        var editUrl = repo + "/edit/main/" + currentFile;\n'
  + '        var refPath = currentFile.replace(/[^/]+$/, "referenced.md");\n'
  + '        var hasRef = allFiles ? allFiles.indexOf(refPath) !== -1 : true;\n'
  + '        var refUrl = repo + "/blob/main/" + refPath;\n'
  + '        var btnStyle = "display:inline-block;margin:4px 8px 0 0;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;color:#111827;background:#f9fafb;text-decoration:none;font-size:14px";\n'
  + '        var links = [\n'
  + '          "<a style=\\\"" + btnStyle + "\\\" href=\\\"" + blobUrl + "\\\" target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\">View on GitHub</a>",\n'
  + '          "<a style=\\\"" + btnStyle + "\\\" href=\\\"" + editUrl + "\\\" target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\">Edit on GitHub</a>",\n'
  + '          hasRef ? "<a style=\\\"" + btnStyle + "\\\" href=\\\"" + refUrl + "\\\" target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\">Referenced.md</a>" : "",\n'
  + '          "<a style=\\\"" + btnStyle + "\\\" href=\\\"" + repo + "\\\" target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\">Repo Home</a>"\n'
  + '        ].filter(Boolean).join(" ");\n'
  + '        footer.innerHTML = links;\n'
  + '      } catch (e) {}\n'
  + '    }\n'
  + '    var versionsMap = null;\n'
  + '    function sectionBaseFromPath(p) {\n'
  + '      try {\n'
  + '        var parts = (p || "").split("/");\n'
  + '        var i = parts.indexOf("content");\n'
  + '        if (i === -1 || parts.length < i + 3) return null;\n'
  + '        return parts.slice(0, i + 3).join("/");\n'
  + '      } catch (e) { return null; }\n'
  + '    }\n'
  + '    function injectVersionsBar(file) {\n'
  + '      try {\n'
  + '        var base = sectionBaseFromPath(file);\n'
  + '        if (!base || !versionsMap || !versionsMap[base]) return;\n'
  + '        var info = versionsMap[base];\n'
  + '        if (!info || !info.versions || info.versions.length <= 1) return;\n'
  + '        var bar = document.createElement("div");\n'
  + '        bar.style.margin = "0 0 12px 0";\n'
  + '        bar.style.padding = "8px 10px";\n'
  + '        bar.style.background = "#f9fafb";\n'
  + '        bar.style.border = "1px solid #e5e7eb";\n'
  + '        bar.style.borderRadius = "8px";\n'
  + '        var html = "<strong>Versions:</strong> ";\n'
  + '        info.versions.forEach(function(v, idx){\n'
  + '          var isCurrent = (v.path === file);\n'
  + '          var label = v.label;\n'
  + '          if (isCurrent) html += "<span style=\\"margin-right:8px\\"><em>" + label + "</em></span>";\n'
  + '          else html += "<a style=\\"margin-right:8px\\" href=\\"viewer.html?file=" + encodeURIComponent(v.path) + "\\">" + label + "</a>";\n'
  + '        });\n'
  + '        var content = document.getElementById("content");\n'
  + '        if (content) content.insertAdjacentElement("afterbegin", bar);\n'
  + '        bar.innerHTML = html;\n'
  + '      } catch (e) {}\n'
  + '    }\n'
  + '    async function load(file) {\n'
  + '      try {\n'
  + '        var absUrl = new URL(file, window.location.href);\n'
  + '        setBaseFor(absUrl.href);\n'
  + '        var res = await fetch(absUrl.href);\n'
  + '        if (!res.ok) throw new Error(\'Failed to load \'+ file);\n'
  + '        var md = await res.text();\n'
  + '        var html = DOMPurify.sanitize(marked.parse(md));\n'
  + '        currentFile = file;\n'
  + '        document.getElementById(\'content\').innerHTML = html;\n'
  + '        injectVersionsBar(file);\n'
  + '        updateFooter();\n'
  + '      } catch (e) {\n'
  + '        document.getElementById(\'content\').textContent = e.message;\n'
  + '      }\n'
  + '    }\n'
  + '    async function init() {\n'
  + '      // Set absolute links not affected by <base>\n'
  + '      var back = document.getElementById("backLink");\n'
  + '      if (back) { back.href = new URL("index.html", window.location.href).href; }\n'
  + '      var viewerAbs = new URL("viewer.html", window.location.href).href;\n'
  + '      var file = getParam(\'file\');\n'
  + '      if (file) await load(file);\n'
  + '      try {\n'
  + '        var filesUrl = new URL(\'files.json\', window.location.href);\n'
  + '        var res = await fetch(filesUrl.href);\n'
  + '        var files = await res.json();\n'
  + '        allFiles = files;\n'
  + '        try {\n'
  + '          var vres = await fetch(new URL(\'versions.json\', window.location.href));\n'
  + '          versionsMap = await vres.json();\n'
  + '        } catch (e) { versionsMap = null; }\n'
  + '        var sidebar = document.getElementById(\'sidebar\');\n'
  + '        var input = document.createElement(\'input\');\n'
  + '        input.placeholder = \"Filter files…\";\n'
  + '        input.addEventListener(\'input\', function(){ filter(files, input.value); });\n'
  + '        sidebar.appendChild(input);\n'
  + '        var list = document.createElement(\'div\');\n'
  + '        sidebar.appendChild(list);\n'
  + '        function stripPrefix(seg){ return seg.replace(/^\\d{2}_/, ""); }\n'
  + '        function titleCaseName(seg){\n'
  + '          var minor = new Set(["a","an","and","as","at","but","by","for","from","in","into","nor","of","on","or","per","the","to","vs","via","with","your","outside"]);\n'
  + '          var base = stripPrefix(seg).replace(/_/g, " ");\n'
  + '          var parts = base.split(/\\s+/).filter(Boolean).map(function(w,i){ var lw = w.toLowerCase(); if (i>0 && minor.has(lw)) return lw; return lw.charAt(0).toUpperCase() + lw.slice(1); });\n'
  + '          var out = parts.join(" ");\n'
  + '          out = out.replace(/Comapeo/g, "CoMapeo");\n'
  + '          out = out.replace(/CoMapeo s/g, "CoMapeo\'s");\n'
  + '          out = out.replace(/ Gps /g, " GPS ");\n'
  + '          out = out.replace(/ Id /g, " ID ");\n'
  + '          out = out.replace(/ Qr /g, " QR ");\n'
  + '          out = out.replace(/Can t/g, "Can\'t");\n'
  + '          return out;\n'
  + '        }\n'
  + '        function displayName(p) {\n'
  + '          var parts = (p || \"\").split(\"/\");\n'
  + '          var fname = parts[parts.length - 1] || \"\";\n'
  + '          var base;\n'
  + '          if (fname.toLowerCase() === \"index.md\" && parts.length >= 2) {\n'
  + '            base = parts[parts.length - 2];\n'
  + '          } else {\n'
  + '            base = fname.replace(/\\.md$/i, \"\");\n'
  + '          }\n'
  + '          return titleCaseName(base);\n'
  + '        }\n'
  + '        function render(items) {\n'
  + '          list.innerHTML = \"\";\n'
  + '          items.forEach(function(p){\n'
  + '            var a = document.createElement(\'a\');\n'
  + '            a.className = \"file\";\n'
  + '            a.href = viewerAbs + \"?file=\" + encodeURIComponent(p);\n'
  + '            a.textContent = displayName(p);\n'
  + '            list.appendChild(a);\n'
  + '          });\n'
  + '        }\n'
  + '        function filter(items, q) {\n'
  + '          var s = (q || \"\").toLowerCase();\n'
  + '          render(items.filter(function(p){ return p.toLowerCase().includes(s); }));\n'
  + '        }\n'
  + '        render(files);\n'
  + '        updateFooter();\n'
  + '      } catch (e) {}\n'
  + '    }\n'
  + '    init();\n'
  + '  </script>\n'
  + '</body>\n'
  + '</html>';
}

function isSectionDirName(name) { return /^\d{2}_.+/.test(name); }
function isVersionDirName(name) { return /^v\d+$/.test(name); }

async function findLatestAndVersions(contentRoot) {
  // Discover sections and their versions. Return { latestFiles: [], versionsMap: { sectionPath: { latest, versions: [{label, path}] } } }
  const result = { latestFiles: [], versionsMap: {} };
  const topics = await fsp.readdir(contentRoot, { withFileTypes: true });
  for (const t of topics) {
    if (!t.isDirectory() || !isSectionDirName(t.name)) continue; // only numbered topics
    const topicDir = path.join(contentRoot, t.name);
    const sections = await fsp.readdir(topicDir, { withFileTypes: true });
    for (const s of sections) {
      if (!s.isDirectory() || !isSectionDirName(s.name)) continue; // only numbered sections
      const sectionDir = path.join(topicDir, s.name);
      const sectionRel = relToRoot(sectionDir);
      const entries = await fsp.readdir(sectionDir, { withFileTypes: true }).catch(()=>[]);
      // Collect version directories
      const versions = entries.filter(e => e.isDirectory() && isVersionDirName(e.name));
      let versionList = [];
      for (const v of versions) {
        const idxPath = path.join(sectionDir, v.name, 'index.md');
        if (await exists(idxPath)) {
          versionList.push({ label: v.name, path: relToRoot(idxPath) });
        }
      }
      // If no version folders, fall back to template/template.md as the latest
      if (versionList.length === 0) {
        const tpl = path.join(sectionDir, 'template', 'template.md');
        if (await exists(tpl)) {
          result.latestFiles.push(relToRoot(tpl));
          result.versionsMap[sectionRel] = { latest: relToRoot(tpl), versions: [] };
          continue;
        }
        // Also support plain index.md directly in section
        const idx = path.join(sectionDir, 'index.md');
        if (await exists(idx)) {
          result.latestFiles.push(relToRoot(idx));
          result.versionsMap[sectionRel] = { latest: relToRoot(idx), versions: [] };
          continue;
        }
        continue; // nothing to show
      }
      // Sort versions by numeric descending
      versionList.sort((a, b) => parseInt(b.label.slice(1)) - parseInt(a.label.slice(1)));
      const latest = versionList[0];
      result.latestFiles.push(latest.path);
      result.versionsMap[sectionRel] = { latest: latest.path, versions: versionList };
    }
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const allMode = args.includes('--all');

  const hasContext = await exists(CONTEXT_DIR);
  const hasContent = await exists(CONTENT_DIR);
  if (!hasContext && !hasContent) {
    console.error('No context/ or content/ directory found. Nothing to build.');
    process.exit(0);
  }

  await rmrf(DIST_DIR);
  await ensureDir(DIST_DIR);

  // Copy sources needed for viewing
  if (hasContext) {
    await copyRecursive(CONTEXT_DIR, path.join(DIST_DIR, 'context'));
  }
  if (hasContent) {
    await copyRecursive(CONTENT_DIR, path.join(DIST_DIR, 'content'));
  }

  // Collect md files according to mode
  let relFiles = [];
  let versionsPayload = {};
  if (allMode) {
    let files = [];
    if (hasContext) files = files.concat(await collectMarkdownFiles(CONTEXT_DIR));
    if (hasContent) files = files.concat(await collectMarkdownFiles(CONTENT_DIR));
    relFiles = files.map(relToRoot).sort();
  } else {
    // Default: pick latest version per section
    if (hasContent) {
      const { latestFiles, versionsMap } = await findLatestAndVersions(CONTENT_DIR);
      relFiles = latestFiles.sort();
      versionsPayload = versionsMap;
    }
  }

  // Write index, viewer, and files manifest
  await fsp.writeFile(path.join(DIST_DIR, 'index.html'), makeIndexHtml(relFiles));
  await fsp.writeFile(path.join(DIST_DIR, 'viewer.html'), makeViewerHtml());
  await fsp.writeFile(path.join(DIST_DIR, 'files.json'), JSON.stringify(relFiles, null, 2));
  if (!allMode) {
    await fsp.writeFile(path.join(DIST_DIR, 'versions.json'), JSON.stringify(versionsPayload, null, 2));
  }

  const modeLabel = allMode ? 'all markdown (context + content)' : 'content index.md only';
  console.log('Built docs: ' + relFiles.length + ' files (' + modeLabel + ') → dist/');
  console.log('Open dist/index.html or run: npm run docs:serve');
}

main().catch((e) => { console.error(e); process.exit(1); });
