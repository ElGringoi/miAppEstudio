// Genera docs/site/index.html: todos los .md de docs/ en una sola página, con los
// diagramas Mermaid. No usa dependencias: el Markdown se convierte acá mismo.
//
//   node scripts/docs-site.mjs                    → docs/site/index.html (página completa)
//   node scripts/docs-site.mjs --fragment <ruta>  → solo el contenido, para publicar como Artifact
//
// Localmente (file:// o localhost) la página carga Mermaid desde jsDelivr; como
// Artifact, los bloques <pre class="mermaid"> los renderiza el visor.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DOCS = path.join(ROOT, 'docs');
const REPO = 'https://github.com/ElGringoi/miAppEstudio/blob/main/';

const args = process.argv.slice(2);
const fragIdx = args.indexOf('--fragment');
const fragmentOut = fragIdx >= 0 ? args[fragIdx + 1] : null;

// ── Orden de lectura ──────────────────────────────────────────────────────────
const CARPETAS = [
  ['', 'Inicio'],
  ['01-producto', 'Producto'],
  ['02-ux', 'UX'],
  ['03-design-system', 'Design system'],
  ['04-arquitectura', 'Arquitectura'],
  ['05-seguridad', 'Seguridad'],
  ['06-calidad', 'Calidad'],
  ['07-operaciones', 'Operaciones'],
  ['08-decisiones', 'Decisiones'],
];
const ORDEN = {
  '': ['README.md', 'CONTRATO-AGENTES.md', 'INBOX_AGENTE.md'],
  '01-producto': ['vision.md', 'casos-de-uso.md', 'mapa-producto.md', 'roadmap.md'],
  '02-ux': ['journeys.md', 'flujos.md', 'estados-y-excepciones.md', 'ux-writing.md'],
  '03-design-system': ['ui-ux-pro-max.md', 'estilo-e-identidad.md', 'fundamentos.md', 'componentes.md', 'movimiento.md', 'accesibilidad-responsive.md'],
  '04-arquitectura': ['arquitectura.md', 'archify.md', 'datos-er.md', 'clases.md', 'secuencias.md', 'estados.md', 'carpetas-objetivo.md'],
  '05-seguridad': ['modelo-amenazas.md', 'firestore-rules.md', 'privacidad.md'],
  '06-calidad': ['criterios-objetivos.md', 'estrategia-pruebas.md', 'criterios-aceptacion.md', 'rendimiento-confiabilidad.md'],
  '07-operaciones': ['entornos-y-deploy.md', 'segundo-cerebro.md', 'runbook.md'],
  '08-decisiones': ['README.md', 'plantilla.md'],
};

const docs = [];
for (const [carpeta, nombre] of CARPETAS) {
  const dir = path.join(DOCS, carpeta);
  if (!fs.existsSync(dir)) continue;
  const presentes = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const orden = ORDEN[carpeta] ?? [];
  const resto = presentes.filter(f => !orden.includes(f)).sort();
  for (const f of [...orden.filter(f => presentes.includes(f)), ...resto]) {
    const rel = carpeta ? `${carpeta}/${f}` : f;
    docs.push({ carpeta, carpetaNombre: nombre, archivo: f, rel, slug: slugDoc(rel), md: fs.readFileSync(path.join(dir, f), 'utf8') });
  }
}

// ── Slugs (solo caracteres que admite un #ancla de Artifact) ──────────────────
function sinAcentos(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function slug(s) {
  return sinAcentos(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/[`*_~[\]()]/g, '')
    .replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}
function slugDoc(rel) { return slug(rel.replace(/\.md$/, '').replace(/\//g, '-').replace(/^README$/, 'inicio')); }

const porRel = new Map(docs.map(d => [d.rel, d]));
const carpetaPrimerDoc = new Map();
for (const d of docs) if (!carpetaPrimerDoc.has(d.carpeta)) carpetaPrimerDoc.set(d.carpeta, d);

// ── Links: .md → ancla interna; código → GitHub ──────────────────────────────
function resolverLink(href, doc) {
  if (/^(https?:|mailto:|#)/.test(href)) {
    return href.startsWith('#') ? `#${doc.slug}--${slug(decodeURIComponent(href.slice(1)))}` : href;
  }
  const [ruta, ancla] = href.split('#');
  const base = path.posix.normalize(path.posix.join('docs', doc.carpeta, ruta));
  if (base.startsWith('docs/')) {
    const relDoc = base.slice(5);
    const destino = porRel.get(relDoc) ?? porRel.get(relDoc.replace(/\/$/, '') + '/README.md');
    if (destino) return ancla ? `#${destino.slug}--${slug(decodeURIComponent(ancla))}` : `#${destino.slug}`;
    const carpeta = relDoc.replace(/\/$/, '');
    if (carpetaPrimerDoc.has(carpeta)) return `#grupo-${carpeta}`;
  }
  return REPO + base.replace(/\/$/, '');
}

// ── Markdown → HTML (el subconjunto que usan estos docs) ─────────────────────
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(text, doc) {
  const codigos = [];
  let t = text.replace(/`([^`]+)`/g, (_, c) => { codigos.push(c); return `\u0000${codigos.length - 1}\u0000`; });
  t = esc(t);
  t = t.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const url = resolverLink(href.replace(/&amp;/g, '&'), doc);
    const externo = /^https?:/.test(url);
    return `<a href="${esc(url)}"${externo ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>');
  t = t.replace(/(^|[\s(])_([^_\s][^_]*)_(?=[\s).,;:]|$)/g, '$1<em>$2</em>');
  t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codigos[+i])}</code>`);
}

function celdas(linea) {
  return linea.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
}

let mermaidCount = 0;

function bloques(lines, doc, ids) {
  let html = '';
  let i = 0;
  const esLista = l => /^(\s*)([-*]|\d+\.)\s+/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }

    const fence = l.match(/^(\s*)```(\w*)/);
    if (fence) {
      const ind = fence[1].length;
      const lang = fence[2];
      const cuerpo = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { cuerpo.push(lines[i].slice(ind)); i++; }
      i++;
      const codigo = cuerpo.join('\n');
      if (lang === 'mermaid') {
        mermaidCount++;
        html += `<div class="diagrama"><pre class="mermaid">${esc(codigo)}</pre></div>\n`;
      } else {
        html += `<div class="codigo"><pre><code${lang ? ` data-lang="${lang}"` : ''}>${esc(codigo)}</code></pre></div>\n`;
      }
      continue;
    }

    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const nivel = Math.min(h[1].length + 1, 5);
      let id = `${doc.slug}--${slug(h[2])}`;
      while (ids.has(id)) id += '-1';
      ids.add(id);
      html += `<h${nivel} id="${id}">${inline(h[2], doc)}</h${nivel}>\n`;
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(l)) { html += '<hr>\n'; i++; continue; }

    if (/^\s*>/.test(l)) {
      const q = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      html += `<blockquote>${bloques(q, doc, ids)}</blockquote>\n`;
      continue;
    }

    if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const cab = celdas(l);
      i += 2;
      const filas = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { filas.push(celdas(lines[i])); i++; }
      html += '<div class="tabla"><table><thead><tr>' + cab.map(c => `<th>${inline(c, doc)}</th>`).join('') + '</tr></thead><tbody>'
        + filas.map(f => '<tr>' + f.map(c => `<td>${inline(c, doc)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>\n';
      continue;
    }

    if (esLista(l)) {
      html += lista(lines, i, doc, ids, r => { i = r; });
      continue;
    }

    const p = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*```|\s*>|\s*\||-{3,}\s*$)/.test(lines[i]) && !esLista(lines[i])) {
      p.push(lines[i].trim()); i++;
    }
    html += `<p>${inline(p.join(' '), doc)}</p>\n`;
  }
  return html;
}

function lista(lines, inicio, doc, ids, setI) {
  const primera = lines[inicio].match(/^(\s*)([-*]|\d+\.)\s+/);
  const ind = primera[1].length;
  const ordenada = /\d/.test(primera[2]);
  const items = [];
  let i = inicio;
  while (i < lines.length) {
    const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (m && m[1].length === ind) {
      items.push([m[3]]);
      i++;
      continue;
    }
    const indent = lines[i].match(/^(\s*)/)[1].length;
    if (lines[i].trim() && indent > ind) { items[items.length - 1].push(lines[i]); i++; continue; }
    if (!lines[i].trim() && i + 1 < lines.length && lines[i + 1].match(/^(\s*)/)[1].length > ind && lines[i + 1].trim()) {
      items[items.length - 1].push(''); i++; continue;
    }
    break;
  }
  setI(i);
  const tag = ordenada ? 'ol' : 'ul';
  const lis = items.map(([cab, ...resto]) => {
    let check = '';
    const c = cab.match(/^\[( |x)\]\s+(.*)$/);
    if (c) { check = `<span class="check${c[1] === 'x' ? ' hecho' : ''}" aria-hidden="true"></span>`; cab = c[2]; }
    const sub = resto.length ? bloques(dedent(resto), doc, ids) : '';
    return `<li${c ? ' class="tarea"' : ''}>${check}${inline(cab, doc)}${sub}</li>`;
  }).join('');
  return `<${tag}>${lis}</${tag}>\n`;
}

function dedent(ls) {
  const min = Math.min(...ls.filter(l => l.trim()).map(l => l.match(/^(\s*)/)[1].length));
  return ls.map(l => l.slice(min));
}

// ── Armado ────────────────────────────────────────────────────────────────────
function tituloDe(md) { return (md.match(/^#\s+(.+)$/m)?.[1] ?? '').replace(/`/g, ''); }

let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { commit = ''; }
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

const ids = new Set();
let cuerpo = '';
let nav = '';
let grupoActual = null;
for (const d of docs) {
  if (d.carpeta !== grupoActual) {
    if (grupoActual !== null) nav += '</ul></li>';
    grupoActual = d.carpeta;
    const num = d.carpeta ? d.carpeta.slice(0, 2) : '00';
    nav += `<li class="grupo"><span class="grupo-num">${num}</span><span class="grupo-nombre">${d.carpetaNombre}</span><ul>`;
    cuerpo += `<div class="grupo-sep" id="grupo-${d.carpeta || 'inicio'}"><span>${num}</span> ${d.carpetaNombre}</div>\n`;
  }
  const lines = d.md.replace(/\r\n/g, '\n').split('\n');
  const t = tituloDe(d.md) || d.archivo;
  nav += `<li><a href="#${d.slug}">${esc(t)}</a></li>`;
  const sinTitulo = lines.slice(lines.findIndex(l => /^#\s/.test(l)) + 1);
  cuerpo += `<article class="doc" id="${d.slug}">
  <header class="doc-cab">
    <span class="ruta">docs/${d.rel}</span>
    <h1>${inline(t, d)}</h1>
  </header>
  ${bloques(sinTitulo, d, ids)}
  <footer class="doc-pie"><a href="${REPO}docs/${d.rel}" target="_blank" rel="noopener">Ver o editar en GitHub</a> · <a href="#arriba">Volver arriba</a></footer>
</article>\n`;
}
nav += '</ul></li>';

const ESTILO = fs.readFileSync(path.join(ROOT, 'scripts', 'docs-site.css'), 'utf8');

const contenido = `<title>Planos de miAppEstudio</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=DM+Mono:wght@400;500&display=swap">
<style>
${ESTILO}
</style>
<a class="saltar" href="#contenido">Saltar al contenido</a>
<div class="marco" id="arriba">
  <aside class="lateral" aria-label="Índice de la documentación">
    <div class="marca">
      <span class="marca-sello" aria-hidden="true">Q</span>
      <span><strong>Planos de miAppEstudio</strong><small>Relevado ${hoy}${commit ? ` · ${commit}` : ''}</small></span>
    </div>
    <details class="indice" open>
      <summary>Índice · ${docs.length} documentos · ${mermaidCount} diagramas</summary>
      <nav><ul class="nav">${nav}</ul></nav>
    </details>
  </aside>
  <main id="contenido" class="contenido">
${cuerpo}
  </main>
</div>
<script>
(function () {
  var local = location.protocol === 'file:' || /^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname);
  if (local && !window.mermaid) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js';
    s.onload = function () {
      var claro = matchMedia('(prefers-color-scheme: light)').matches && document.documentElement.dataset.theme !== 'dark';
      window.mermaid.initialize({ startOnLoad: false, theme: claro ? 'default' : 'dark', securityLevel: 'strict' });
      window.mermaid.run({ querySelector: 'pre.mermaid' });
    };
    document.head.appendChild(s);
  }
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var porId = {};
  links.forEach(function (a) { porId[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting && porId[e.target.id]) {
          links.forEach(function (a) { a.removeAttribute('aria-current'); });
          porId[e.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-10% 0px -80% 0px' });
    document.querySelectorAll('article.doc').forEach(function (el) { obs.observe(el); });
  }
  var indice = document.querySelector('.indice');
  if (indice && matchMedia('(max-width: 900px)').matches) indice.removeAttribute('open');
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      if (matchMedia('(max-width: 900px)').matches && indice) indice.removeAttribute('open');
    });
  });
})();
</script>
`;

if (fragmentOut) {
  fs.mkdirSync(path.dirname(path.resolve(fragmentOut)), { recursive: true });
  fs.writeFileSync(fragmentOut, contenido);
  console.log(`Fragmento: ${fragmentOut} · ${docs.length} docs · ${mermaidCount} diagramas`);
} else {
  const salida = path.join(DOCS, 'site', 'index.html');
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${contenido}
</body>
</html>
`);
  console.log(`docs/site/index.html · ${docs.length} docs · ${mermaidCount} diagramas`);
}
