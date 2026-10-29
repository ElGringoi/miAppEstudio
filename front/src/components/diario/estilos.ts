// Estilos del Diario ("La Gaceta"), con alcance en .gaceta. Paleta y tipografía
// tomadas de los mockups: papel crema, tinta casi negra y bordó.

export const NOMBRE_DIARIO = 'La Gaceta';

export const CSS_GACETA = `
.gaceta { --papel:#f4f1ea; --papel-2:#ebe5d9; --blanco:#faf8f3; --tinta:#141414; --gris:#4a453e; --gris-2:#6b655c;
  --linea:#d3c8b8; --bordo:#7a1f2b; --serif:'Newsreader', Georgia, 'Times New Roman', serif;
  --sans:'Plus Jakarta Sans', 'Work Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  background:var(--papel); color:var(--tinta); font-family:var(--sans); min-height:100vh; }
.gaceta *, .gaceta *::before, .gaceta *::after { box-sizing:border-box; }
.gaceta button { font-family:var(--sans); color:inherit; }
.gaceta :focus-visible { outline:2px solid var(--bordo); outline-offset:2px; border-radius:2px; }
.g-hoja { max-width:960px; margin:0 auto; padding:12px 16px 24px; }
@media (min-width:768px) { .g-hoja { padding:20px 40px 32px; } }

/* Cabecera */
.g-cabecera { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:6px 0 10px; border-bottom:3px solid var(--bordo); }
.g-marca { display:flex; align-items:center; gap:16px; min-width:0; }
.g-nombre { font-family:var(--serif); font-weight:800; font-size:clamp(32px, 8.5vw, 54px); letter-spacing:-0.02em; line-height:.95; margin:0; white-space:nowrap; text-transform:uppercase; }
.g-fecha { border-left:1px solid var(--bordo); padding-left:14px; font-size:12px; letter-spacing:.08em; text-transform:uppercase; line-height:1.55; color:#3a3631; white-space:nowrap; }
@media (max-width:520px) { .g-marca { flex-direction:column; align-items:flex-start; gap:4px; } .g-fecha { border-left:0; padding-left:0; } }
.g-indice-btn { display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:0 4px; background:none; border:0; font-size:18px; cursor:pointer; flex:none; }

/* Índice */
.g-indice { border:1px solid var(--linea); background:var(--blanco); border-radius:10px; padding:6px 14px; margin:12px 0 4px; }
.g-indice ol { list-style:none; margin:0; padding:0; }
.g-indice li + li { border-top:1px solid var(--linea); }
.g-indice button { width:100%; display:flex; align-items:center; gap:12px; min-height:44px; background:none; border:0; text-align:left; font-size:17px; cursor:pointer; padding:0 2px; }
.g-indice .g-num { font-family:var(--serif); font-weight:700; color:var(--bordo); min-width:22px; }
.g-indice button[aria-current="page"] { font-weight:700; }

/* Títulos de sección */
.g-seccion { font-family:var(--serif); font-weight:800; color:var(--bordo); text-transform:uppercase; font-size:clamp(36px, 9.5vw, 66px); line-height:.95; letter-spacing:-0.01em; margin:18px 0 6px; }
.g-seccion:focus { outline:none; }
.g-subtitulo { font-size:clamp(16px, 4vw, 20px); color:var(--gris); margin:0 0 16px; }
.g-seccion-regla { border:0; border-top:2px solid var(--bordo); margin:0 0 18px; }

/* Piezas */
.g-pieza { padding:0 0 14px; border-bottom:1px solid #c9b9a8; margin-bottom:18px; }
.g-pieza:last-child { border-bottom:0; }
.g-kicker { font-size:13px; font-weight:600; letter-spacing:.07em; text-transform:uppercase; color:var(--bordo); margin:0 0 6px; }
.g-titular { font-family:var(--serif); font-weight:800; line-height:1.03; letter-spacing:-0.015em; margin:0 0 8px; color:var(--tinta); }
.g-titular-principal { font-size:clamp(30px, 7.6vw, 50px); }
.g-titular-secundario { font-size:clamp(21px, 5.2vw, 31px); }
.g-titular-breve { font-size:clamp(19px, 4.6vw, 23px); line-height:1.15; }
.g-bajada { font-size:clamp(16px, 4vw, 19px); line-height:1.45; color:var(--gris); margin:0 0 8px; }
.g-bajada strong { color:var(--tinta); font-weight:600; }
.g-meta { font-size:13px; color:var(--gris-2); margin:0 0 6px; }
.g-idioma { display:inline-block; font-size:11px; font-weight:700; border:1px solid currentColor; border-radius:3px; padding:0 4px; margin-left:6px; vertical-align:2px; }
.g-figura { margin:0; }
.g-foto { display:block; width:100%; object-fit:cover; background:var(--papel-2); }
.g-foto-principal { aspect-ratio:16/9; margin-bottom:12px; }
.g-foto-ancha { aspect-ratio:21/9; margin-top:6px; }
.g-pie-foto { font-size:12px; font-style:italic; color:var(--gris-2); margin:6px 0 4px; }
.g-secundaria { display:grid; grid-template-columns:40% 1fr; gap:16px; align-items:start; }
.g-secundaria .g-foto { aspect-ratio:4/3; }
@media (max-width:359px) { .g-secundaria { grid-template-columns:1fr; } }
.g-link { color:var(--bordo); font-size:15px; text-decoration:underline; text-underline-offset:3px; display:inline-flex; align-items:center; gap:4px; min-height:36px; }
.g-porque-btn { color:var(--bordo); background:none; border:0; padding:0; font-size:16px; min-height:36px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
.g-porque { font-size:14px; color:var(--gris); margin:0 0 4px; }

/* Acciones: Me interesa | Menos | Guardar */
.g-acciones { display:flex; align-items:stretch; margin-top:6px; }
.g-accion { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; background:none; border:0; border-left:1px solid var(--linea); font-size:15px; cursor:pointer; padding:0 6px; white-space:nowrap; }
.g-accion:first-child { border-left:0; justify-content:flex-start; padding-left:0; }
.g-accion[aria-pressed="true"] { color:var(--bordo); font-weight:600; }
.g-acciones-compactas .g-accion { font-size:14px; gap:6px; }
@media (max-width:359px) { .g-acciones-compactas .g-accion { gap:4px; font-size:13px; } }

/* Rótulo con regla ("CONTRATAPA ———") */
.g-rotulo { display:flex; align-items:center; gap:14px; font-family:var(--serif); font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--bordo); font-size:clamp(17px, 4.2vw, 22px); margin:8px 0 12px; }
.g-rotulo::after { content:''; flex:1; height:1px; background:var(--bordo); }
.g-regla { border:0; border-top:2px solid var(--bordo); margin:22px 0; }
.g-subrotulo { font-family:var(--serif); font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--bordo); font-size:clamp(17px, 4.2vw, 21px); margin:22px 0 4px; padding-top:12px; border-top:2px solid var(--bordo); }

/* Filas: agenda, vencimientos, próximos encuentros */
.g-filas { list-style:none; margin:0; padding:0; }
.g-fila { display:flex; align-items:center; gap:12px; min-height:52px; border-bottom:1px solid var(--linea); padding:8px 4px; color:var(--tinta); text-decoration:none; font-size:17px; }
.g-fila-dia { font-weight:700; letter-spacing:.04em; min-width:44px; }
.g-fila-hora { font-weight:700; min-width:54px; font-variant-numeric:tabular-nums; }
.g-fila-texto { min-width:0; overflow:hidden; text-overflow:ellipsis; }
.g-fila-chev { margin-left:auto; color:var(--gris-2); flex:none; }
.g-fila-hecha .g-fila-texto { text-decoration:line-through; color:var(--gris-2); }

/* Resultados */
.g-tabla-scroll { overflow-x:auto; }
.g-resultados { width:100%; border-collapse:collapse; }
.g-resultados td { padding:10px 4px; border-bottom:1px solid var(--linea); font-size:16px; vertical-align:middle; }
.g-marcador { text-align:center; font-weight:700; font-size:20px; white-space:nowrap; font-variant-numeric:tabular-nums; width:84px; }
.g-equipo { display:flex; align-items:center; gap:8px; }
.g-equipo-local { justify-content:flex-end; text-align:right; }
.g-equipo-favorito { font-weight:700; }
.g-escudo { width:24px; height:24px; object-fit:contain; flex:none; }
.g-vacio { font-family:var(--serif); font-style:italic; color:var(--gris-2); font-size:17px; margin:8px 0 12px; }

/* Caja de preferencias y chips */
.g-caja { background:var(--papel-2); border-radius:10px; padding:16px; margin:22px 0; }
.g-caja-titulo { font-family:var(--serif); font-weight:700; font-size:clamp(19px, 4.6vw, 24px); margin:0 0 12px; }
.g-chips { display:flex; flex-wrap:wrap; gap:10px; }
.g-chip { min-height:44px; padding:0 16px; border:1px solid #8a8378; border-radius:999px; background:var(--blanco); font-size:15px; font-weight:500; display:inline-flex; align-items:center; gap:8px; cursor:pointer; }
.g-chip[aria-pressed="true"] { background:var(--bordo); border-color:var(--bordo); color:#fff; }
.g-select { min-height:44px; border:1px solid #8a8378; border-radius:999px; background:var(--blanco); padding:0 14px; font:inherit; font-size:15px; color:var(--tinta); margin-top:12px; max-width:100%; }

/* Por qué importa */
.g-contexto { border-left:4px solid var(--bordo); background:var(--blanco); padding:14px 16px; margin:4px 0 18px; }

/* Contratapa */
.g-columna p { font-size:clamp(17px, 4.2vw, 20px); line-height:1.55; margin:0 0 14px; }
.g-fin { text-align:center; margin:30px 0 6px; }
.g-ornamento { display:flex; align-items:center; justify-content:center; gap:10px; color:var(--bordo); font-size:18px; }
.g-ornamento::before, .g-ornamento::after { content:''; height:1px; background:var(--bordo); flex:0 1 240px; }
.g-fin-titulo { font-family:var(--serif); font-weight:800; color:var(--bordo); font-size:clamp(30px, 7.4vw, 46px); letter-spacing:.02em; margin:10px 0 2px; text-transform:uppercase; }
.g-fin-meta { color:var(--gris); font-size:15px; margin:0; }
.g-boton { width:100%; min-height:58px; background:var(--bordo); color:#fff !important; border:0; border-radius:10px; font-family:var(--serif) !important; font-weight:700; font-size:clamp(21px, 5.2vw, 27px); cursor:pointer; margin:16px 0 10px; }
.g-boton:disabled { opacity:.75; cursor:default; }
.g-nota-final { color:var(--gris); font-size:14px; text-align:center; margin:0; }

/* Portada */
.g-destacado { display:grid; grid-template-columns:34% 1fr; gap:14px; align-items:center; width:100%; background:none; border:0; border-bottom:1px solid var(--linea); padding:12px 0; text-align:left; cursor:pointer; }
.g-destacado .g-foto { aspect-ratio:4/3; }

/* Navegación */
.g-nav { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; border-top:1px solid var(--tinta); margin-top:28px; padding-top:4px; }
.g-nav button { min-height:48px; background:none; border:0; font-size:18px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; padding:0 4px; white-space:nowrap; }
@media (max-width:420px) { .g-nav button { font-size:16px; gap:4px; } .g-nav-num { font-size:18px; padding:0 4px; } }
.g-nav button:disabled { opacity:.3; cursor:default; }
.g-nav-num { font-family:var(--serif); font-weight:700; color:var(--bordo); font-size:20px; padding:0 8px; }
.g-nav-sig { justify-self:end; }

/* Avisos y carga */
.g-aviso { background:var(--bordo); color:#fff; padding:10px 14px; border-radius:8px; font-size:14px; margin:12px 0 0; }
.g-esqueleto { background:linear-gradient(90deg, var(--papel-2), var(--blanco), var(--papel-2)); background-size:200% 100%; animation:g-brillo 1.4s infinite linear; border-radius:4px; }
@keyframes g-brillo { from { background-position:200% 0; } to { background-position:-200% 0; } }
@media (prefers-reduced-motion: reduce) { .g-esqueleto { animation:none; } }

/* Columna de opinión (Mis círculos) */
.g-opinion { border-top:2px solid var(--bordo); padding:14px 0 26px; margin-top:6px; }
.g-firma { font-size:11px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--bordo); margin:0 0 4px; }
.g-dia-columna { font-family:var(--serif); font-style:italic; font-size:clamp(15px, 3.8vw, 17px); color:var(--gris); margin:0 0 6px; }
.g-cuerpo p { font-family:var(--serif); font-size:clamp(17px, 4.2vw, 19px); line-height:1.62; color:var(--tinta); margin:0 0 12px; }
`;
