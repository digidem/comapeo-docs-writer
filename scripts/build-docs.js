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
  out = out.replace(/Comapeo/gi, 'CoMapeo');
  out = out.replace(/CoMapeo\s+[Ss]/g, "CoMapeo's");
  out = out.replace(/ Gps /gi, ' GPS ');
  out = out.replace(/ Id /gi, ' ID ');
  out = out.replace(/ Qr /gi, ' QR ');
  out = out.replace(/Can t/gi, "Can't");
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

function makeIndexHtml(items, sections = []) {
  const hasSections = Array.isArray(sections) && sections.length > 0;
  function escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  if (!hasSections) {
    const links = items
      .sort()
      .map((p) => {
        const label = toDisplayName(p);
        return '<li><a href="viewer.html?file=' + encodeURIComponent(p) + '">' + escape(label) + '</a></li>';
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

  const sectionsMarkup = sections.map((section) => {
    const topicsMarkup = (section.topics || []).map((topic) => {
      if (!topic || !topic.latest) return '';
      const label = escape(topic.label || 'Untitled Topic');
      const latestLabel = topic.latestLabel ? escape(topic.latestLabel) : '';
      const latestTag = latestLabel ? '<span class="latest">Latest: ' + latestLabel + '</span>' : '';
      const href = 'viewer.html?file=' + encodeURIComponent(topic.latest);
      return '<li><a href="' + href + '">' + label + '</a>' + latestTag + '</li>';
    }).join('');
    const sectionLabel = escape(section.label || 'Untitled Section');
    const count = (section.topics || []).length;
    const countLabel = count ? '<span class="meta">' + count + ' topic' + (count === 1 ? '' : 's') + '</span>' : '';
    return '<section class="section">\n'
      + '  <h2>' + sectionLabel + countLabel + '</h2>\n'
      + '  <ul>' + topicsMarkup + '</ul>\n'
      + '</section>';
  }).join('\n');

  return '<!doctype html>\n'
  + '<html lang="en">\n'
  + '<head>\n'
  + '  <meta charset="utf-8" />\n'
  + '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n'
  + '  <title>Docs Index</title>\n'
  + '  <style>\n'
  + '    :root { color-scheme: light; }\n'
  + '    html, body { min-height: 100%; }\n'
  + '    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; margin: 0; background: #f9fafb; color: #111827; }\n'
  + '    header { padding: 20px 24px; background: white; border-bottom: 1px solid #e5e7eb; }\n'
  + '    header h1 { margin: 0; font-size: 22px; }\n'
  + '    header p { margin: 6px 0 0; color: #6b7280; font-size: 14px; }\n'
  + '    main { padding: 24px; max-width: 1080px; margin: 0 auto; }\n'
  + '    .section { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }\n'
  + '    .section h2 { margin: 0 0 12px; font-size: 18px; display: flex; align-items: center; gap: 10px; }\n'
  + '    .section ul { margin: 0; padding-left: 18px; list-style: disc; }\n'
  + '    .section li { margin: 4px 0; }\n'
  + '    .section a { color: #2563eb; text-decoration: none; font-weight: 600; }\n'
  + '    .section a:hover { text-decoration: underline; }\n'
  + '    .meta { color: #6b7280; font-size: 13px; font-weight: 500; }\n'
  + '    .latest { display: inline-block; margin-left: 8px; color: #6b7280; font-size: 12px; font-weight: 500; }\n'
  + '    footer { margin: 32px 0 0; text-align: center; color: #9ca3af; font-size: 13px; }\n'
  + '    footer a { color: #6b7280; text-decoration: none; }\n'
  + '    footer a:hover { text-decoration: underline; }\n'
  + '    @media (max-width: 720px) { main { padding: 16px; } .section { padding: 16px; } .section h2 { font-size: 16px; } }\n'
  + '  </style>\n'
  + '</head>\n'
  + '<body>\n'
  + '  <header>\n'
  + '    <h1>CoMapeo Docs</h1>\n'
  + '    <p>Browse the latest guidance by section. Each topic opens in the viewer with version history links at the top.</p>\n'
  + '  </header>\n'
  + '  <main>' + sectionsMarkup + '</main>\n'
  + '  <footer>Built with scripts/build-docs.js</footer>\n'
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
  + '    a { color: #2563eb; text-decoration: none; }\n'
  + '    a:hover { text-decoration: underline; }\n'
  + '    nav h2 { margin: 16px 0 6px; font-size: 16px; line-height: 1.25; color: #111827; }\n'
  + '    nav h3 { margin: 10px 0 6px; font-size: 14px; font-weight: 600; color: #111827; }\n'
  + '    .nav-topic-link { color: #1f2937; font-weight: 600; display: inline-block; padding: 2px 0; }\n'
  + '    .nav-topic-link:hover { text-decoration: underline; }\n'
  + '    .nav-topic-link.active { color: #111827; font-weight: 700; }\n'
  + '    .sidebar-empty { color: #6b7280; font-size: 14px; margin: 12px 0; }\n'
  + '    @media (max-width: 900px) { body { grid-template-columns: 1fr; grid-template-rows: auto 1fr; } nav { border-right: none; border-bottom: 1px solid #e5e7eb; } }\n'
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
  + '    var viewerUrl = null;\n'
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
  + '    function fixImageSources(file) {\n'
  + '      try {\n'
  + '        var container = document.getElementById("content");\n'
  + '        if (!container) return;\n'
  + '        var imgs = container.querySelectorAll("img[src]");\n'
  + '        if (!imgs.length) return;\n'
  + '        var fileUrl = new URL(file, window.location.href);\n'
  + '        var rootUrl = new URL("./", viewerUrl || window.location.href);\n'
  + '        imgs.forEach(function(img){\n'
  + '          var src = img.getAttribute("src");\n'
  + '          if (!src || /^(?:[a-z]+:|data:|\#)/i.test(src)) return;\n'
  + '          var trimmed = src;\n'
  + '          var removed = 0;\n'
  + '          while (trimmed.indexOf("../") === 0) {\n'
  + '            trimmed = trimmed.slice(3);\n'
  + '            removed++;\n'
  + '          }\n'
  + '          if (removed > 0 && trimmed.indexOf("context/") === 0) {\n'
  + '            img.setAttribute("src", rootUrl.href + trimmed);\n'
  + '            return;\n'
  + '          }\n'
  + '          var resolved = new URL(src, fileUrl).href;\n'
  + '          img.setAttribute("src", resolved);\n'
  + '        });\n'
  + '      } catch (e) {}\n'
  + '    }\n'
  + '    function injectVersionsBar(file) {\n'
  + '      try {\n'
  + '        var base = sectionBaseFromPath(file);\n'
  + '        if (!base || !versionsMap || !versionsMap[base]) return;\n'
  + '        var info = versionsMap[base];\n'
  + '        if (!info || !info.versions || info.versions.length === 0) return;\n'
  + '        var content = document.getElementById("content");\n'
  + '        if (!content) return;\n'
  + '        var bar = document.createElement("div");\n'
  + '        bar.style.margin = "0 0 12px 0";\n'
  + '        bar.style.padding = "8px 10px";\n'
  + '        bar.style.background = "#f9fafb";\n'
  + '        bar.style.border = "1px solid #e5e7eb";\n'
  + '        bar.style.borderRadius = "8px";\n'
  + '        var label = document.createElement("strong");\n'
  + '        label.textContent = "Versions: ";\n'
  + '        bar.appendChild(label);\n'
  + '        info.versions.forEach(function(v){\n'
  + '          if (!v) return;\n'
  + '          var isCurrent = (v.path === file);\n'
  + '          if (isCurrent) {\n'
  + '            var span = document.createElement("span");\n'
  + '            span.style.marginRight = "8px";\n'
  + '            var em = document.createElement("em");\n'
  + '            em.textContent = v.label;\n'
  + '            span.appendChild(em);\n'
  + '            bar.appendChild(span);\n'
  + '          } else {\n'
  + '            var link = document.createElement("a");\n'
  + '            link.style.marginRight = "8px";\n'
  + '            link.textContent = v.label;\n'
  + '            var absViewer = viewerUrl || new URL("viewer.html", window.location.href).href;\n'
  + '            var baseUrl = absViewer.split("?")[0];\n'
  + '            link.href = baseUrl + "?file=" + encodeURIComponent(v.path);\n'
  + '            link.addEventListener("click", function(ev){\n'
  + '              ev.preventDefault();\n'
  + '              var target = v.path;\n'
  + '              var url = new URL(window.location.href);\n'
  + '              url.searchParams.set("file", target);\n'
  + '              window.history.pushState({}, "", url.toString());\n'
  + '              load(target);\n'
  + '            });\n'
  + '            bar.appendChild(link);\n'
  + '          }\n'
  + '        });\n'
  + '        content.insertAdjacentElement("afterbegin", bar);\n'
  + '      } catch (e) {}\n'
  + '    }\n'
  + '    function setActiveLink(file) {\n'
  + '      try {\n'
  + '        var links = document.querySelectorAll(".nav-topic-link");\n'
  + '        links.forEach(function(el){\n'
  + '          var topicPath = el.getAttribute("data-topic");\n'
  + '          var isMatch = false;\n'
  + '          if (file && topicPath) {\n'
  + '            var prefix = topicPath.endsWith("/") ? topicPath : topicPath + "/";\n'
  + '            isMatch = file === topicPath || file.indexOf(prefix) === 0;\n'
  + '          }\n'
  + '          el.classList.toggle("active", isMatch);\n'
  + '        });\n'
  + '      } catch (e) {}\n'
  + '    }\n'
  + '    function firstLatest(sections) {\n'
  + '      if (!sections) return null;\n'
  + '      for (var i = 0; i < sections.length; i++) {\n'
  + '        var topics = sections[i] && sections[i].topics;\n'
  + '        if (!topics || !topics.length) continue;\n'
  + '        var candidate = topics[0] && topics[0].latest;\n'
  + '        if (candidate) return candidate;\n'
  + '      }\n'
  + '      return null;\n'
  + '    }\n'
  + '    function renderSidebar(structure, viewerAbs) {\n'
  + '      var container = document.getElementById("sidebar");\n'
  + '      if (!container) return;\n'
  + '      container.innerHTML = "";\n'
  + '      if (!structure || !structure.length) {\n'
  + '        var empty = document.createElement("p");\n'
  + '        empty.className = "sidebar-empty";\n'
  + '        empty.textContent = "No content available.";\n'
  + '        container.appendChild(empty);\n'
  + '        return;\n'
  + '      }\n'
  + '      structure.forEach(function(section){\n'
  + '        var h2 = document.createElement("h2");\n'
  + '        h2.textContent = section.label || "Untitled Section";\n'
  + '        container.appendChild(h2);\n'
  + '        (section.topics || []).forEach(function(topic){\n'
  + '          var h3 = document.createElement("h3");\n'
  + '          var topicLink = document.createElement("a");\n'
  + '          topicLink.className = "nav-topic-link";\n'
  + '          topicLink.textContent = topic.label || "Untitled Topic";\n'
  + '          topicLink.dataset.topic = topic.path || "";\n'
  + '          if (topic.latest) {\n'
  + '            topicLink.href = viewerAbs + "?file=" + encodeURIComponent(topic.latest);\n'
  + '            topicLink.addEventListener("click", async function(ev){\n'
  + '              ev.preventDefault();\n'
  + '              var target = topic.latest;\n'
  + '              if (!target) return;\n'
  + '              var url = new URL(window.location.href);\n'
  + '              url.searchParams.set("file", target);\n'
  + '              window.history.pushState({}, "", url.toString());\n'
  + '              await load(target);\n'
  + '            });\n'
  + '          } else {\n'
  + '            topicLink.href = "#";\n'
  + '          }\n'
  + '          h3.appendChild(topicLink);\n'
  + '          container.appendChild(h3);\n'
  + '        });\n'
  + '      });\n'
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
  + '        fixImageSources(file);\n'
  + '        injectVersionsBar(file);\n'
  + '        updateFooter();\n'
  + '        setActiveLink(file);\n'
  + '      } catch (e) {\n'
  + '        document.getElementById(\'content\').textContent = e.message;\n'
  + '      }\n'
  + '    }\n'
  + '    async function init() {\n'
  + '      var back = document.getElementById("backLink");\n'
  + '      if (back) { back.href = new URL("index.html", window.location.href).href; }\n'
  + '      viewerUrl = new URL("viewer.html", window.location.href).href;\n'
  + '      var viewerAbs = viewerUrl;\n'
  + '      try {\n'
  + '        var filesRes = await fetch(new URL("files.json", window.location.href));\n'
  + '        if (filesRes.ok) { allFiles = await filesRes.json(); }\n'
  + '      } catch (e) { allFiles = null; }\n'
  + '      try {\n'
  + '        var vres = await fetch(new URL("versions.json", window.location.href));\n'
  + '        if (vres.ok) { versionsMap = await vres.json(); }\n'
  + '      } catch (e) { versionsMap = null; }\n'
  + '      var sidebarData = { sections: [] };\n'
  + '      try {\n'
  + '        var sres = await fetch(new URL("sidebar.json", window.location.href));\n'
  + '        if (sres.ok) { sidebarData = await sres.json(); }\n'
  + '      } catch (e) { sidebarData = { sections: [] }; }\n'
  + '      var sections = (sidebarData && sidebarData.sections) ? sidebarData.sections : [];\n'
  + '      renderSidebar(sections, viewerAbs);\n'
  + '      var file = getParam("file");\n'
  + '      if (!file) {\n'
  + '        var fallback = firstLatest(sections);\n'
  + '        if (fallback) {\n'
  + '          file = fallback;\n'
  + '          var url = new URL(window.location.href);\n'
  + '          url.searchParams.set("file", fallback);\n'
  + '          window.history.replaceState({}, "", url.toString());\n'
  + '        }\n'
  + '      }\n'
  + '      if (file) { await load(file); }\n'
  + '      window.addEventListener("popstate", async function(){\n'
  + '        var current = getParam("file");\n'
  + '        if (current) { await load(current); }\n'
  + '      });\n'
  + '    }\n'
  + '    init();\n'
  + '  </script>\n'
  + '</body>\n'
  + '</html>';
}

function isSectionDirName(name) { return /^\d{2}_.+/.test(name); }
function isVersionDirName(name) { return /^v\d+$/.test(name); }

async function buildContentTree(contentRoot) {
  /*
    Walk the content directory and prepare:
    - latestFiles: newest version file per topic for dist/files.json
    - versionsMap: lookup for versions bar in viewer (includes Template when present)
    - sections: hierarchy for sidebar rendering
  */
  const result = { latestFiles: [], versionsMap: {}, sections: [] };
  const mainSections = await fsp.readdir(contentRoot, { withFileTypes: true }).catch(() => []);
  for (const top of mainSections) {
    if (!top.isDirectory() || !isSectionDirName(top.name)) continue;
    const sectionDir = path.join(contentRoot, top.name);
    const sectionRel = relToRoot(sectionDir);
    const sectionEntry = { label: titleCaseName(top.name), path: sectionRel, topics: [] };

    const topicDirs = await fsp.readdir(sectionDir, { withFileTypes: true }).catch(() => []);
    for (const topic of topicDirs) {
      if (!topic.isDirectory() || !isSectionDirName(topic.name)) continue;
      const topicDir = path.join(sectionDir, topic.name);
      const topicRel = relToRoot(topicDir);
      const topicLabel = titleCaseName(topic.name);

      const entries = await fsp.readdir(topicDir, { withFileTypes: true }).catch(() => []);
      const numericVersions = [];
      for (const entry of entries) {
        if (!entry.isDirectory() || !isVersionDirName(entry.name)) continue;
        const idxPath = path.join(topicDir, entry.name, 'index.md');
        if (await exists(idxPath)) {
          numericVersions.push({ label: entry.name, path: relToRoot(idxPath) });
        }
      }

      numericVersions.sort((a, b) => parseInt(b.label.slice(1), 10) - parseInt(a.label.slice(1), 10));

      const extras = [];
      const templatePath = path.join(topicDir, 'template', 'template.md');
      if (await exists(templatePath)) {
        extras.push({ label: 'Template', path: relToRoot(templatePath) });
      }

      const versionList = numericVersions.concat(extras);

      let latestEntry = versionList[0] || null;
      if (!latestEntry) {
        const idxPath = path.join(topicDir, 'index.md');
        if (await exists(idxPath)) {
          latestEntry = { label: 'index.md', path: relToRoot(idxPath) };
          versionList.push(latestEntry);
        }
      }
      if (!latestEntry) continue; // nothing usable in this topic

      result.latestFiles.push(latestEntry.path);
      result.versionsMap[topicRel] = { latest: latestEntry.path, versions: versionList };
      sectionEntry.topics.push({
        label: topicLabel,
        path: topicRel,
        latest: latestEntry.path,
        latestLabel: latestEntry.label,
        versions: versionList,
      });
    }

    if (sectionEntry.topics.length > 0) {
      result.sections.push(sectionEntry);
    }
  }

  // Sort sections and topics by their directory names to keep sidebar stable
  result.sections.sort((a, b) => a.path.localeCompare(b.path));
  for (const section of result.sections) {
    section.topics.sort((a, b) => a.path.localeCompare(b.path));
  }
  result.latestFiles.sort();
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
  let sidebarPayload = { sections: [] };

  let contentTree = null;
  if (hasContent) {
    contentTree = await buildContentTree(CONTENT_DIR);
    versionsPayload = contentTree.versionsMap;
    sidebarPayload = { sections: contentTree.sections };
  }

  if (allMode) {
    let files = [];
    if (hasContext) files = files.concat(await collectMarkdownFiles(CONTEXT_DIR));
    if (hasContent) files = files.concat(await collectMarkdownFiles(CONTENT_DIR));
    relFiles = files.map(relToRoot).sort();
  } else if (contentTree) {
    // Default: pick latest version per topic
    relFiles = contentTree.latestFiles;
  }

  // Write index, viewer, and files manifest
  const sectionsForIndex = (!allMode && contentTree) ? contentTree.sections : [];
  await fsp.writeFile(path.join(DIST_DIR, 'index.html'), makeIndexHtml(relFiles, sectionsForIndex));
  await fsp.writeFile(path.join(DIST_DIR, 'viewer.html'), makeViewerHtml());
  await fsp.writeFile(path.join(DIST_DIR, 'files.json'), JSON.stringify(relFiles, null, 2));
  await fsp.writeFile(path.join(DIST_DIR, 'sidebar.json'), JSON.stringify(sidebarPayload, null, 2));
  if (!allMode) {
    await fsp.writeFile(path.join(DIST_DIR, 'versions.json'), JSON.stringify(versionsPayload, null, 2));
  }

  const modeLabel = allMode ? 'all markdown (context + content)' : 'content index.md only';
  console.log('Built docs: ' + relFiles.length + ' files (' + modeLabel + ') → dist/');
  console.log('Open dist/index.html or run: npm run docs:serve');
}

main().catch((e) => { console.error(e); process.exit(1); });
