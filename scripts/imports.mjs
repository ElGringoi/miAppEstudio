// Grafo de imports a nivel archivo (solo imports relativos)
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
const dirs = ['front/src', 'api', 'server'];
const files = [];
const walk = d => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|mts)$/.test(e.name)) files.push(p);
  }
};
dirs.forEach(d => walk(path.join(root, d)));
const rel = p => path.relative(root, p).split(path.sep).join('/');
const resolve = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec.replace(/\.js$/, ''));
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return base + ext;
  }
  return null;
};
const edges = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(?:import|export)[^'"]*?from\s+['"](\.[^'"]+)['"]/g)) {
    const t = resolve(f, m[1]);
    if (t) edges.push([rel(f), rel(t)]);
  }
}
const lines = Object.fromEntries(files.map(f => [rel(f), fs.readFileSync(f, 'utf8').split('\n').length]));
const fanIn = {};
edges.forEach(([, t]) => { fanIn[t] = (fanIn[t] || 0) + 1; });
const fanOut = {};
edges.forEach(([s]) => { fanOut[s] = (fanOut[s] || 0) + 1; });

const grp = p => {
  if (p.startsWith('front/src/components/diario')) return 'components/diario';
  if (/components\/(Cerebro|SegundoCerebro)/.test(p)) return 'components/cerebro';
  if (/components\/(Gym|BodyMap|MuscleStats|EjercicioRow)/.test(p)) return 'components/gym';
  if (p.startsWith('front/src/components')) return 'components/otros';
  if (p.startsWith('front/src/')) {
    const r = p.replace('front/src/', '').split('/');
    return r.length > 1 ? r[0] : r[0];
  }
  return p.split('/').slice(0, 2).join('/');
};
const g = {};
edges.forEach(([s, t]) => {
  const a = grp(s), b = grp(t);
  if (a !== b) { const k = `${a} -> ${b}`; g[k] = (g[k] || 0) + 1; }
});
const grpLines = {};
Object.entries(lines).forEach(([f, n]) => { const k = grp(f); grpLines[k] = (grpLines[k] || 0) + n; });

console.log(JSON.stringify({
  files: files.length,
  edges: edges.length,
  top: Object.entries(lines).sort((a, b) => b[1] - a[1]).slice(0, 8),
  fanIn: Object.entries(fanIn).sort((a, b) => b[1] - a[1]).slice(0, 10),
  fanOutApp: fanOut['front/src/App.tsx'],
  grpLines,
  groupEdges: g,
  serverFromFront: edges.filter(([s, t]) => s.startsWith('front') && t.startsWith('server')),
}, null, 1));
