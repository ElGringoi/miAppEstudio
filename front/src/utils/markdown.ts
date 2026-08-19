// Renderer de Markdown mínimo, sin dependencias.
// Devuelve un string de HTML pensado para dangerouslySetInnerHTML.
// Lo usan las notas del Segundo Cerebro y los campos `notas` de personas y grupos.

export function inlineMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.12);border-radius:3px;padding:1px 5px;font-family:monospace;font-size:0.87em">$1</code>');
}

export function renderMarkdown(raw: string): string {
  const lines = raw.split('\n');
  let html = '';
  let inList = false;

  const flushList = () => { if (inList) { html += '</ul>'; inList = false; } };

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flushList();
      html += `<h3 style="font-size:1.05em;font-weight:700;margin:.9em 0 .2em">${inlineMd(line.slice(4))}</h3>`;
    } else if (line.startsWith('## ')) {
      flushList();
      html += `<h2 style="font-size:1.25em;font-weight:800;margin:1.1em 0 .25em">${inlineMd(line.slice(3))}</h2>`;
    } else if (line.startsWith('# ')) {
      flushList();
      html += `<h1 style="font-size:1.5em;font-weight:900;margin:1.3em 0 .3em">${inlineMd(line.slice(2))}</h1>`;
    } else if (line.startsWith('- ')) {
      if (!inList) { html += '<ul style="list-style:disc;padding-left:1.4em;margin:.4em 0">'; inList = true; }
      html += `<li style="margin:.15em 0">${inlineMd(line.slice(2))}</li>`;
    } else if (line.trim() === '') {
      flushList();
      html += '<br/>';
    } else {
      flushList();
      html += `<p style="margin:.4em 0;line-height:1.75">${inlineMd(line)}</p>`;
    }
  }
  flushList();
  return html;
}
