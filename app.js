// Piel · rutina facial de Carlota. Todo se guarda en este móvil (localStorage).
'use strict';

const STORE_KEY = 'piel-v1';
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---------- Estado ----------
function freshState() {
  return {
    v: 1,
    productos: clone(PRODUCTOS_INICIALES),
    plan: clone(PLAN_INICIAL),
    checks: {},
    diario: clone(DIARIO_INICIAL),
    pendientes: clone(PENDIENTES_INICIALES),
    compra: clone(COMPRA_INICIAL),
    ajustes: { horaManana: '08:00', horaRetoque: '14:00', horaNoche: '22:30', textoGrande: false, reglas: { perfume: true, alcohol: true, arbolTe: true, aceites: true, pesadas: true, exfoliantes: true } },
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const f = freshState();
      for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k];
      s.ajustes = Object.assign(f.ajustes, s.ajustes);
      s.ajustes.reglas = Object.assign(f.ajustes.reglas, s.ajustes.reglas);
      return s;
    }
  } catch (e) { /* datos dañados: empezamos de cero */ }
  return freshState();
}
let state = loadState();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('No se ha podido guardar: el móvil no deja más espacio'); }
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- Fechas ----------
function hoyStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function parseDia(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function sumaDias(s, n) { const d = parseDia(s); d.setDate(d.getDate() + n); return hoyStr(d); }
function difDias(a, b) { return Math.round((parseDia(b) - parseDia(a)) / 86400000); }
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fechaLarga(s) { const d = parseDia(s); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; }
function fechaCorta(s) { const d = parseDia(s); return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`; }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Productos ----------
const prod = (id) => state.productos.find((p) => p.id === id);
function primeroDisponible(ids) { return ids.map(prod).find((p) => p && p.estado !== 'acabado' && p.estado !== 'descartado') || prod(ids[0]); }
const PASO_PRODUCTOS = {
  vitc: ['sesderma-c', 'althea-c'], azelaico: ['skin1004-azelaic'], niacinamida: ['to-niacinamida'],
  retinol: ['cantabria-retinol', 'celimax-retinol'], retinal: ['celimax-retinal'], txa: ['txa-beautydrops'], eucerin: ['eucerin-dual'],
};
function pasoActivo(id, fecha) {
  const p = state.plan.pasos.find((x) => x.id === id);
  return !!(p && p.fecha && p.fecha <= fecha);
}
// Al empezar un paso del plan, su producto pasa a «En uso».
function sincronizarEstados() {
  const hoy = hoyStr();
  let cambio = false;
  for (const p of state.plan.pasos) {
    if (!pasoActivo(p.id, hoy)) continue;
    const pr = primeroDisponible(PASO_PRODUCTOS[p.id] || []);
    if (pr && ['pausa', 'nuevo', 'verificar'].includes(pr.estado)) { pr.estado = 'uso'; cambio = true; }
  }
  if (cambio) save();
}

// ---------- La rutina de un día ----------
function paso(id, pid, titulo, detalle) {
  const p = pid ? prod(pid) : null;
  return { id, pid: p ? pid : null, titulo: titulo || (p ? (p.corto || p.nombre) : detalle), detalle: detalle || '' };
}
function rutinaDel(fecha) {
  const d = parseDia(fecha).getDay();
  const enPrueba = fecha >= state.plan.minimaDesde && fecha <= state.plan.minimaHasta;
  const manana = [paso('agua', null, 'Lavar solo con agua', 'Sin limpiador por la mañana')];
  if (pasoActivo('vitc', fecha)) {
    const p = primeroDisponible(PASO_PRODUCTOS.vitc) || {};
    const inicio = state.plan.pasos.find((x) => x.id === 'vitc').fecha;
    manana.push(paso('vitc', p.id, null, difDias(inicio, fecha) < 7 ? 'Vitamina C · solo en media cara esta semana' : 'Vitamina C'));
  }
  const diaAzelaico = pasoActivo('azelaico', fecha) && [1, 3, 0].includes(d);
  if (diaAzelaico) manana.push(paso('azelaico', 'skin1004-azelaic', null, 'Azelaico · lunes, miércoles y domingo'));
  if (pasoActivo('niacinamida', fecha) && !diaAzelaico) manana.push(paso('niacinamida', 'to-niacinamida', null, 'Una gota en la zona T'));
  manana.push(paso('crema-m', 'purito-bamboo', null, 'Poca, en mejillas · lejos de la ojera'));
  const finde = d === 0 || d === 6;
  if (finde) manana.push(paso('solar', 'skin1004-sun', null, 'Solar · sin color: si vas en coche, usa el Eucerin tintado'));
  else manana.push(paso('solar', 'eucerin-solar', null, 'Solar con color · por el melasma'));

  const mediodia = finde ? [] : [paso('retoque', 'avene-compact', null, 'Retoque del solar a toques')];

  const noche = [paso('bifasico', 'bifasico-mercadona', null, 'Desmaquillar'), paso('limpiador', 'cerave-foaming', null, 'Limpieza')];
  let nota = '';
  if ([1, 5].includes(d)) {
    if (pasoActivo('eucerin', fecha)) noche.push(paso('eucerin', 'eucerin-dual', null, 'Pómulos y labio superior'));
    if (pasoActivo('txa', fecha)) noche.push(paso('txa', 'txa-beautydrops', null, 'Toda la cara · después del Eucerin'));
  } else if ([2, 4, 6].includes(d)) {
    if (pasoActivo('retinol', fecha)) { const p = primeroDisponible(PASO_PRODUCTOS.retinol) || {}; noche.push(paso('retinol', p.id, null, 'Frente y barbilla · no en mejillas')); }
    if (pasoActivo('retinal', fecha)) noche.push(paso('retinal', 'celimax-retinal', null, 'Contorno · a un dedo de las pestañas · espera 10 min'));
  } else if (d === 0) nota = 'Noche de recuperación: sin activos.';
  noche.push(paso('crema-n', 'purito-bamboo', null, 'Crema'));
  noche.push(paso('kvit', 'sesderma-kvit', null, 'Contorno de ojos'));
  return { manana, mediodia, noche, enPrueba, nota };
}
const marcado = (fecha, id) => !!state.checks[fecha + ':' + id];
function estadoDia(fecha) {
  const r = rutinaDel(fecha);
  const pasos = [...r.manana, ...r.noche];
  const n = pasos.filter((p) => marcado(fecha, p.id)).length;
  return n === 0 ? 'nada' : n === pasos.length ? 'completo' : 'medias';
}
function racha() {
  let f = hoyStr();
  if (estadoDia(f) !== 'completo') f = sumaDias(f, -1);
  let n = 0;
  while (estadoDia(f) === 'completo' && n < 400) { n++; f = sumaDias(f, -1); }
  return n;
}

// ---------- Interfaz común ----------
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}
function download(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
const ICON = {
  hoy: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
  productos: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="5" rx="1"/><path d="M7 8h10v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/></svg>',
  control: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  plan: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  scan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  sol: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  luna: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  coche: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h14M6 16l1.5-5h9L18 16M7 19v-3M17 19v-3"/></svg>',
  ajustes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  mas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  aviso: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>',
  ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  fuera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
};
const TABS = [['hoy', 'Hoy'], ['productos', 'Productos'], ['escanear', ''], ['control', 'Control'], ['plan', 'Plan']];
function renderTabs(actual) {
  $('#tabs').innerHTML = TABS.map(([id, txt]) => id === 'escanear'
    ? `<a class="scanbtn" href="#/escanear" aria-label="Escanear producto">${ICON.scan}</a>`
    : `<a class="tab${actual === id ? ' on' : ''}" href="#/${id}"${actual === id ? ' aria-current="page"' : ''}>${ICON[id]}<span>${txt}</span></a>`).join('');
}
const BADGE = { uso: 'uso', pausa: 'pau', nuevo: 'new', verificar: 'ver', lista: 'lis', acabado: 'des', descartado: 'des' };
const VEREDICTO = { ok: ['Encaja', 'v-ok'], cuidado: ['Con cuidado', 'v-cui'], no: ['No cumple tus reglas', 'v-no'] };
const backLink = (href, txt) => `<a class="back" href="${href}">${ICON.back}${esc(txt)}</a>`;

// ---------- Vistas ----------
let ui = { filtro: 'todos', busca: '', planVista: 'reintro', escaneo: null, ocr: '' };

function viewHoy() {
  const hoy = hoyStr();
  const r = rutinaDel(hoy);
  const p = state.plan;
  let banner = '';
  if (r.enPrueba) {
    const total = difDias(p.minimaDesde, p.minimaHasta) + 1;
    const dia = difDias(p.minimaDesde, hoy) + 1;
    banner = `<section class="hero"><div class="row-b"><p class="eyebrow">Prueba de rutina mínima</p><p>Día ${dia} de ${total}</p></div>
      <div class="bar"><i style="width:${Math.round(dia / total * 100)}%"></i></div>
      <p>Solo lo básico hasta el ${fechaLarga(p.minimaHasta)}. Si sale un grano, apúntalo en el diario.</p></section>`;
  }
  const prox = p.pasos.filter((x) => x.fecha && x.fecha > hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
    || p.pasos.find((x) => !x.fecha);
  const franja = (clave, titulo, icono, pasos, extra) => {
    if (!pasos.length) return '';
    const hechos = pasos.filter((s) => marcado(hoy, s.id)).length;
    return `<section class="franja"><div class="franja-h"><span class="fi fi-${clave}">${icono}</span><h2>${titulo}</h2>
      <span class="cnt">${hechos}/${pasos.length}</span>
      <button class="link" data-act="todo" data-franja="${clave}">${hechos === pasos.length ? 'Desmarcar' : 'Marcar todo'}</button></div>
      ${pasos.map((s) => `<label class="step${marcado(hoy, s.id) ? ' done' : ''}"><input type="checkbox" data-act="check" data-id="${s.id}"${marcado(hoy, s.id) ? ' checked' : ''}>
        <span><b>${esc(s.titulo)}</b><small>${esc(s.detalle)}</small></span>${s.pid ? `<a class="mini" href="#/producto/${s.pid}" aria-label="Ver ficha">${ICON.next}</a>` : ''}</label>`).join('')}
      ${extra || ''}</section>`;
  };
  return `<header class="top"><div><p class="sub">${cap(fechaLarga(hoy))}</p><h1>Hola, ${esc(PERFIL.nombre)}</h1></div>
    <a class="iconbtn" href="#/ajustes" aria-label="Ajustes">${ICON.ajustes}</a></header>
    ${banner}
    ${franja('m', 'Mañana', ICON.sol, r.manana)}
    ${franja('d', 'Mediodía', ICON.coche, r.mediodia)}
    ${franja('n', 'Noche', ICON.luna, r.noche, r.nota ? `<p class="note">${esc(r.nota)}</p>` : '')}
    <div class="grid2">
      <a class="card link-card" href="#/diario?nuevo=1"><small>Diario</small><b>Apuntar grano o regla</b></a>
      ${prox ? `<a class="card link-card" href="#/plan"><small>${prox.fecha ? 'Siguiente · ' + fechaCorta(prox.fecha) : 'Siguiente paso'}</small><b>${esc(prox.titulo)}</b></a>` : ''}
    </div>`;
}

function chip(id, txt, n) { return `<button class="chip${ui.filtro === id ? ' on' : ''}" data-act="filtro" data-f="${id}">${esc(txt)}${n !== undefined ? ' · ' + n : ''}</button>`; }
function pasaFiltro(p) {
  const f = ui.filtro;
  if (f === 'coreanos' && !p.kr) return false;
  if (!['todos', 'coreanos'].includes(f) && p.estado !== f) return false;
  if (ui.busca) {
    const q = ui.busca.toLowerCase();
    if (!(p.nombre + ' ' + (p.inci || '') + ' ' + (p.nota || '')).toLowerCase().includes(q)) return false;
  }
  return true;
}
function viewProductos() {
  const cuenta = (e) => state.productos.filter((p) => p.estado === e).length;
  const grupos = CATEGORIAS.map(([cat, nombre]) => {
    const ps = state.productos.filter((p) => p.cat === cat && pasaFiltro(p));
    if (!ps.length) return '';
    return `<h3 class="h3">${nombre}</h3><div class="grp">${ps.map((p) => `<a class="row" href="#/producto/${p.id}">
      <span class="nm"><b>${esc(p.nombre)}${p.kr ? ' <i class="kr">KR</i>' : ''}</b><small>${esc(p.uso || p.nota || '')}</small></span>
      <span class="bd ${BADGE[p.estado]}">${ESTADOS[p.estado]}</span></a>`).join('')}</div>`;
  }).join('');
  const pendientesCompra = state.compra.filter((c) => !c.hecho).length;
  return `<header class="top"><h1>Productos</h1><a class="iconbtn solid" href="#/escanear" aria-label="Añadir producto">${ICON.mas}</a></header>
    <label class="search">${ICON.scan.replace('<svg', '<svg class="sicon"')}<input type="search" id="busca" placeholder="Buscar producto o ingrediente" value="${esc(ui.busca)}" aria-label="Buscar producto o ingrediente"></label>
    <div class="chips">${chip('todos', 'Todos', state.productos.length)}${chip('uso', 'En uso', cuenta('uso'))}${chip('nuevo', 'Sin estrenar')}${chip('pausa', 'En pausa')}${chip('verificar', 'Por verificar')}${chip('coreanos', 'Coreanos')}${chip('lista', 'En la lista')}</div>
    <a class="card link-card row-b" href="#/compra"><span><b>Lista de la compra</b><small>${pendientesCompra ? pendientesCompra + ' pendiente' + (pendientesCompra > 1 ? 's' : '') : 'Nada pendiente'}</small></span>${ICON.next}</a>
    <p class="muted">Revisados para rosácea vascular con cuperosis. Orientativo: manda la dermatóloga.</p>
    ${grupos || '<p class="empty">No hay productos con ese filtro.</p>'}`;
}

function buscaUrl(tienda, nombre) {
  const q = encodeURIComponent(nombre);
  const sitio = { YesStyle: 'yesstyle.com', Primor: 'primor.eu', Druni: 'druni.es', Mercadona: 'tienda.mercadona.es' }[tienda];
  if (tienda === 'Amazon') return 'https://www.amazon.es/s?k=' + q;
  if (/^https?:\/\//.test(tienda || '')) return tienda;
  if (sitio) return `https://www.google.com/search?q=site%3A${sitio}+${q}`;
  return `https://www.google.com/search?q=${q}+${encodeURIComponent(tienda || 'comprar')}`;
}
function fichaVeredicto(v, hallazgos) {
  const [txt, cls] = VEREDICTO[v] || VEREDICTO.ok;
  return `<section class="verdict ${cls}"><p class="eyebrow">Para tu piel</p><p class="vt">${txt}</p>
    ${hallazgos && hallazgos.length ? `<ul class="hall">${hallazgos.map((h) => `<li class="h-${h.nivel}">${esc(h.texto)}</li>`).join('')}</ul>` : ''}</section>`;
}
function filtrarHallazgos(an) {
  const r = state.ajustes.reglas;
  const omit = [];
  if (!r.perfume) omit.push('perfume'); if (!r.alcohol) omit.push('alcohol'); if (!r.arbolTe) omit.push('árbol de té');
  if (!r.aceites) omit.push('aceites esenciales'); if (!r.pesadas) omit.push('grasas pesadas'); if (!r.exfoliantes) omit.push('Exfolia');
  const h = an.hallazgos.filter((x) => !omit.some((o) => x.texto.includes(o)));
  let v = 'ok';
  if (h.some((x) => x.nivel === 'no')) v = 'no'; else if (h.some((x) => x.nivel === 'cuidado')) v = 'cuidado';
  return { veredicto: v, hallazgos: h };
}
function caducidad(p) {
  if (!p.abierto || !p.pao) return null;
  const d = parseDia(p.abierto); d.setMonth(d.getMonth() + p.pao); return hoyStr(d);
}
function viewProducto(id) {
  const p = prod(id);
  if (!p) return `${backLink('#/productos', 'Productos')}<p class="empty">Este producto ya no está.</p>`;
  const an = p.inci ? filtrarHallazgos(analizarInci(p.inci)) : null;
  const cad = caducidad(p);
  return `${backLink('#/productos', 'Productos')}
    <div class="ficha-h"><span class="bd ${BADGE[p.estado]}">${ESTADOS[p.estado]}</span>${p.kr ? '<i class="kr">KR</i>' : ''}
    <h1 class="h1s">${esc(p.nombre)}</h1>${p.uso ? `<p class="muted">${esc(p.uso)}</p>` : ''}</div>
    ${fichaVeredicto(an ? an.veredicto : p.veredicto, an ? an.hallazgos : (p.nota ? [{ nivel: 'info', texto: p.nota }] : []))}
    <section class="grp form">
      <label class="kv"><span>Estado</span><select data-act="campo" data-campo="estado">${Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}"${p.estado === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="kv"><span>Dónde lo compro</span><input list="tiendas" data-act="campo" data-campo="tienda" value="${esc(p.tienda || '')}" placeholder="Tienda o enlace"></label>
      <div class="kv"><span>Abierto el</span>${p.abierto ? `<span>${fechaCorta(p.abierto)}${cad ? ` · caduca ${fechaCorta(cad)}` : ''}</span>` : `<button class="link" data-act="abierto">Lo he abierto hoy</button>`}</div>
      <label class="kv"><span>Dura abierto (meses)</span><input type="number" min="1" max="36" inputmode="numeric" data-act="campo" data-campo="pao" value="${esc(p.pao || '')}" placeholder="Mira el tarrito de la caja"></label>
      <label class="kv"><span>Código de barras</span><input inputmode="numeric" data-act="campo" data-campo="codigo" value="${esc(p.codigo || '')}" placeholder="Opcional"></label>
    </section>
    <datalist id="tiendas">${TIENDAS.map((t) => `<option value="${t}">`).join('')}</datalist>
    <div class="grid2">
      <button class="btn ghost" data-act="queda-poco">${state.compra.some((c) => c.pid === p.id && !c.hecho) ? 'En la lista de la compra' : 'Me queda poco'}</button>
      <button class="btn ghost" data-act="acabado">Se ha acabado</button>
    </div>
    <a class="btn dark" href="${esc(buscaUrl(p.tienda, p.nombre))}" target="_blank" rel="noopener">Abrir ${esc(p.tienda && !/^https?:/.test(p.tienda) ? 'en ' + p.tienda : 'tienda')} ${ICON.fuera}</a>
    <label class="field"><span>Notas</span><textarea rows="3" data-act="campo" data-campo="nota">${esc(p.nota || '')}</textarea></label>
    <label class="field"><span>Ingredientes (INCI)</span><textarea rows="5" data-act="campo" data-campo="inci" placeholder="Pega aquí la lista de ingredientes y la app la revisa con tus reglas">${esc(p.inci || '')}</textarea></label>
    <div class="grid2"><a class="btn ghost" href="https://incidecoder.com/search?query=${encodeURIComponent(p.nombre)}" target="_blank" rel="noopener">Ver en INCIDecoder</a>
    <button class="btn ghost" data-act="ocr-ficha">Leer foto de ingredientes</button></div>
    <input type="file" accept="image/*" capture="environment" id="ocr-input" hidden>
    <p id="ocr-progress" class="muted"></p>
    <button class="btn danger-link" data-act="borrar">Borrar este producto</button>`;
}

function viewCompra() {
  return `${backLink('#/productos', 'Productos')}<h1 class="h1s">Lista de la compra</h1>
    <div class="grp">${state.compra.map((c) => `<label class="row"><input type="checkbox" class="cb" data-act="compra-check" data-id="${c.id}"${c.hecho ? ' checked' : ''}>
      <span class="nm"><b class="${c.hecho ? 'tachado' : ''}">${esc(c.texto)}</b><small>${esc(c.tienda || '')}</small></span>
      <a class="mini" href="${esc(buscaUrl(c.tienda && c.tienda.split(/[ ,]/)[0], c.texto))}" target="_blank" rel="noopener" aria-label="Buscar en la tienda">${ICON.fuera}</a></label>`).join('') || '<p class="empty">Vacía.</p>'}</div>
    <form class="grp form" data-act="compra-add">
      <label class="kv"><span>Añadir</span><input name="texto" placeholder="Producto" required></label>
      <label class="kv"><span>Tienda</span><input name="tienda" list="tiendas" placeholder="YesStyle, farmacia…"></label>
      <button class="btn dark" type="submit">Añadir a la lista</button>
    </form>
    <datalist id="tiendas">${TIENDAS.map((t) => `<option value="${t}">`).join('')}</datalist>
    ${state.compra.some((c) => c.hecho) ? '<button class="btn ghost" data-act="compra-limpiar">Quitar lo comprado</button>' : ''}`;
}

function viewEscanear() {
  return `<div class="scan">
    <div class="scan-top"><a class="iconbtn dark" href="#/hoy" aria-label="Cerrar">${ICON.back}</a><p>Escanear producto</p><span style="width:44px"></span></div>
    <div class="viewfinder"><video id="video" playsinline muted></video><div class="frame"><i></i><i></i><i></i><i></i><b class="laser"></b></div></div>
    <p class="scan-msg" id="scan-msg">Apunta al código de barras del envase</p>
    <p class="scan-sub">Busca en tus productos, en Open Beauty Facts y, si es coreano, te ayuda a leer sus ingredientes.</p>
    <form class="scan-code" data-act="codigo"><input name="codigo" inputmode="numeric" placeholder="O escribe el número" aria-label="Número del código de barras"><button class="btn dark" type="submit">Buscar</button></form>
    <div class="scan-acts"><button class="btn ghost light" data-act="sin-codigo">Sin código: foto o lista de ingredientes</button></div>
  </div>`;
}

function viewResultado() {
  const e = ui.escaneo;
  if (!e) { location.hash = '#/escanear'; return ''; }
  const existente = e.codigo && state.productos.find((p) => p.codigo === e.codigo);
  if (existente) { location.hash = '#/producto/' + existente.id; return ''; }
  const coreano = (e.codigo || '').startsWith('880') || /[가-힣]/.test(e.inci || '');
  const trad = /[가-힣]/.test(e.inci || '') ? traducirCoreano(e.inci) : null;
  const inciFinal = trad ? trad.map((x) => x.inci).join(', ') : (e.inci || '');
  const an = inciFinal ? filtrarHallazgos(analizarInci(inciFinal)) : null;
  const fuente = e.fuente === 'obf' ? 'Encontrado en Open Beauty Facts' : e.codigo ? 'Sin ficha pública' : 'Producto nuevo';
  return `${backLink('#/escanear', 'Escanear otro')}
    <div class="ficha-h">${e.codigo ? `<span class="pill">${esc(e.codigo)}${coreano ? ' · Hecho en Corea' : ''}</span>` : ''}
    ${e.imagen ? `<img class="foto" src="${esc(e.imagen)}" alt="">` : ''}
    <p class="muted">${fuente}</p></div>
    <section class="grp form">
      <label class="kv"><span>Nombre</span><input id="r-nombre" value="${esc(e.nombre || '')}" placeholder="Nombre del producto"></label>
      <label class="kv"><span>Marca</span><input id="r-marca" value="${esc(e.marca || '')}" placeholder="Marca"></label>
    </section>
    ${!e.inci ? `<section class="grp opts">
      <button class="opt" data-act="ocr-res"><b>Foto de los ingredientes</b><small>${coreano ? 'Lee la etiqueta en inglés o en coreano' : 'Lee la lista de la caja'}</small></button>
      <a class="opt" href="https://incidecoder.com/search?query=${encodeURIComponent((e.marca || '') + ' ' + (e.nombre || ''))}" target="_blank" rel="noopener"><b>Buscarlo en INCIDecoder</b><small>Copia allí la lista y pégala abajo</small></a>
    </section>` : ''}
    <input type="file" accept="image/*" capture="environment" id="ocr-input" hidden>
    <p id="ocr-progress" class="muted"></p>
    <label class="field"><span>Ingredientes</span><textarea id="r-inci" rows="5" placeholder="Pega aquí la lista (de YesStyle, INCIDecoder o la web de la marca)">${esc(e.inci || '')}</textarea></label>
    ${trad ? `<h3 class="h3">Traducción del coreano</h3><div class="grp">${trad.slice(0, 40).map((x) => `<div class="tr${x.conocido ? '' : ' unk'}"><span lang="ko">${esc(x.original)}</span><span aria-hidden="true">→</span><span>${esc(x.conocido ? x.inci : 'Sin traducir: revísalo')}</span></div>`).join('')}</div>
      <p class="muted">Traducción con un glosario de los ingredientes más comunes. Los que salen en gris, revísalos.</p>` : ''}
    ${an ? fichaVeredicto(an.veredicto, an.hallazgos) : '<p class="muted">Añade los ingredientes y te digo si encaja con tus reglas.</p>'}
    <section class="grp form">
      <label class="kv"><span>Lo tengo o lo quiero</span><select id="r-estado"><option value="nuevo">Lo tengo, sin estrenar</option><option value="uso">Lo tengo y lo uso</option><option value="lista">Lo quiero comprar</option><option value="descartado">Descartado</option></select></label>
      <label class="kv"><span>Categoría</span><select id="r-cat">${CATEGORIAS.map(([k, v]) => `<option value="${k}"${k === 'manana' ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="kv"><span>Dónde lo compro</span><input id="r-tienda" list="tiendas" value="${coreano ? 'YesStyle' : ''}" placeholder="Tienda o enlace"></label>
    </section>
    <datalist id="tiendas">${TIENDAS.map((t) => `<option value="${t}">`).join('')}</datalist>
    <button class="btn dark" data-act="guardar-res">Guardar en mis productos</button>
    ${e.codigo ? `<a class="btn ghost" href="https://world.openbeautyfacts.org/cgi/product.pl?type=search_or_add&code=${encodeURIComponent(e.codigo)}" target="_blank" rel="noopener">Compartirlo en Open Beauty Facts ${ICON.fuera}</a>` : ''}`;
}

function viewDiario(nuevo) {
  const items = [...state.diario].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const TIPO = { grano: 'Grano', regla: 'Regla', rojez: 'Rojez', nota: 'Nota' };
  return `${backLink('#/control', 'Control')}<h1 class="h1s">Diario</h1><p class="muted">Granos, regla y rojeces, para ver si hay patrón en 2-3 ciclos.</p>
    <form class="grp form pad" data-act="diario-add"${nuevo ? ' id="nuevo"' : ''}>
      <h2 class="h2b">Nueva entrada</h2>
      <div class="chips">${Object.entries(TIPO).map(([k, v], i) => `<label class="chip"><input type="radio" name="tipo" value="${k}"${i === 0 ? ' checked' : ''}>${v}</label>`).join('')}</div>
      <fieldset><legend>Dónde · toca la zona</legend><div class="chips">${ZONAS.map((z) => `<label class="chip sm"><input type="checkbox" name="zona" value="${esc(z)}">${esc(z)}</label>`).join('')}</div></fieldset>
      <label class="kv"><span>Fecha</span><input type="date" name="fecha" value="${hoyStr()}" max="${hoyStr()}"></label>
      <label class="field"><span>Nota (opcional)</span><input name="nota" placeholder="Profundo, con punta, duele…"></label>
      <button class="btn dark" type="submit">Guardar</button>
    </form>
    <h3 class="h3">Registro</h3>
    <div class="grp">${items.map((d) => { const f = parseDia(d.fecha); return `<div class="ent"><div class="dt">${DIAS[f.getDay()].slice(0, 3)}<b>${f.getDate()}</b>${MESES[f.getMonth()].slice(0, 3)}</div>
      <div class="nm"><b>${TIPO[d.tipo] || d.tipo}${d.zonas && d.zonas.length ? ' · ' + esc(d.zonas.join(', ')) : ''}</b>${d.nota ? `<small>${esc(d.nota)}</small>` : ''}</div>
      <button class="mini x" data-act="diario-del" data-id="${d.id}" aria-label="Borrar entrada">×</button></div>`; }).join('') || '<p class="empty">Sin entradas.</p>'}</div>`;
}

function viewControl() {
  const hoy = hoyStr();
  const p = state.plan;
  const ult7 = Array.from({ length: 7 }, (_, i) => sumaDias(hoy, -i));
  const completos = ult7.filter((f) => estadoDia(f) === 'completo').length;
  const granosPrueba = state.diario.filter((d) => d.tipo === 'grano' && d.fecha >= p.minimaDesde && d.fecha <= p.minimaHasta).length;
  const quedan = difDias(hoy, p.minimaHasta);
  // Calendario: 5 semanas acabando en la actual (lunes a domingo).
  const dow = (parseDia(hoy).getDay() + 6) % 7;
  const inicio = sumaDias(hoy, -dow - 28);
  const granos = new Set(state.diario.filter((d) => d.tipo === 'grano').map((d) => d.fecha));
  const reglas = new Set(state.diario.filter((d) => d.tipo === 'regla').map((d) => d.fecha));
  let cal = '<span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>';
  for (let i = 0; i < 35; i++) {
    const f = sumaDias(inicio, i);
    const st = f > hoy ? 'fut' : estadoDia(f);
    cal += `<div class="d ${st}${f === hoy ? ' today' : ''}" title="${fechaLarga(f)}">${parseDia(f).getDate()}${granos.has(f) ? '<i class="pin" aria-label="grano"></i>' : ''}${reglas.has(f) ? '<i class="pin r" aria-label="regla"></i>' : ''}</div>`;
  }
  const pocos = state.productos.filter((x) => state.compra.some((c) => c.pid === x.id && !c.hecho));
  const cads = state.productos.filter((x) => caducidad(x)).sort((a, b) => caducidad(a).localeCompare(caducidad(b)));
  const sinFecha = state.productos.filter((x) => x.pao && !x.abierto && ['uso', 'pausa'].includes(x.estado));
  return `<header class="top"><h1>Control</h1></header>
    <div class="grid3"><div class="stat"><b>${racha()}</b><small>días seguidos</small></div><div class="stat"><b>${completos}/7</b><small>días completos</small></div>
    <div class="stat"><b>${quedan >= 0 ? quedan : granosPrueba}</b><small>${quedan >= 0 ? 'días de prueba' : 'granos en la prueba'}</small></div></div>
    <section class="card"><div class="row-b"><h2 class="h2b">Últimas semanas</h2><div class="leg"><span><i class="lg-c"></i>Completa</span><span><i class="lg-m"></i>A medias</span><span><i class="lg-g"></i>Grano</span></div></div>
      <div class="cal">${cal}</div></section>
    <a class="card link-card row-b" href="#/diario"><span><b>Diario de granos y regla</b><small>${granosPrueba} grano${granosPrueba === 1 ? '' : 's'} en la prueba</small></span>${ICON.next}</a>
    <h3 class="h3">Se acaban</h3>
    <div class="grp">${pocos.map((x) => `<a class="row" href="#/producto/${x.id}"><span class="nm"><b>${esc(x.nombre)}</b><small>En la lista de la compra · ${esc(x.tienda || 'sin tienda')}</small></span>${ICON.next}</a>`).join('') || '<p class="empty">Marca «Me queda poco» en la ficha de un producto.</p>'}</div>
    <h3 class="h3">Caducan una vez abiertos</h3>
    <div class="grp">${cads.map((x) => `<a class="row" href="#/producto/${x.id}"><span class="nm"><b>${esc(x.nombre)}</b><small>Abierto el ${fechaCorta(x.abierto)} · ${x.pao} meses</small></span><span class="bd ${caducidad(x) < hoy ? 'des' : 'ver'}">${fechaCorta(caducidad(x))}</span></a>`).join('')}
      ${sinFecha.map((x) => `<a class="row" href="#/producto/${x.id}"><span class="nm"><b>${esc(x.nombre)}</b><small>Dura ${x.pao} meses abierto</small></span><span class="link">¿Cuándo lo abriste?</span></a>`).join('') || (cads.length ? '' : '<p class="empty">Nada por ahora.</p>')}</div>
    <h3 class="h3">Pendiente</h3>
    <div class="grp">${state.pendientes.map((x) => `<label class="row"><input type="checkbox" class="cb" data-act="pend" data-id="${x.id}"${x.hecho ? ' checked' : ''}><span class="nm"><b class="${x.hecho ? 'tachado' : ''}">${esc(x.texto)}</b>${x.fecha ? `<small>${fechaCorta(x.fecha)}</small>` : ''}</span></label>`).join('')}</div>
    <button class="btn dark" data-act="informe">Informe para la dermatóloga</button>`;
}

function viewPlan() {
  const p = state.plan;
  const hoy = hoyStr();
  const reintro = `<section class="card tl">
    <div class="st"><div class="rail"><i class="dot${hoy >= p.minimaDesde ? ' done' : ''}"></i><i class="ln"></i></div><div class="bx"><small>${fechaCorta(p.minimaDesde)}</small><b>Empieza la rutina mínima</b><span>CeraVe, Purito, K-Vit y solar.</span></div></div>
    <div class="st"><div class="rail"><i class="dot${hoy > p.minimaHasta ? ' done' : ''}"></i><i class="ln"></i></div><div class="bx"><small>${fechaCorta(p.minimaHasta)}</small><b>Fin de la prueba</b><span>Compara los granos con las fechas de la regla.</span>
      <label class="inline">Acabar el <input type="date" data-act="fin-prueba" value="${p.minimaHasta}"></label></div></div>
    ${p.pasos.map((x, i) => `<div class="st"><div class="rail"><i class="dot${x.fecha && x.fecha <= hoy ? ' done' : ''}"></i>${i < p.pasos.length - 1 ? '<i class="ln"></i>' : ''}</div>
      <div class="bx"><small>${x.fecha ? fechaCorta(x.fecha) : 'De uno en uno, cuando toque'}</small><b>${esc(x.titulo)}</b><span>${esc(x.detalle)}</span>
      ${x.fecha ? `<label class="inline">Mover al <input type="date" data-act="paso-fecha" data-id="${x.id}" value="${x.fecha}"></label>` : `<button class="link" data-act="paso-hoy" data-id="${x.id}">Empezar hoy</button>`}</div></div>`).join('')}
  </section>
  <section class="alert"><b>Si sale un grano</b><span>Apúntalo y no añadas nada nuevo. Si sale fuera de la semana de la regla, se puede retomar el azelaico sin esperar.</span></section>`;
  const semana = () => {
    const base = sumaDias(hoy, -((parseDia(hoy).getDay() + 6) % 7));
    // Muestra cómo queda la semana con todo el plan activo.
    const guard = clone(state.plan);
    state.plan.pasos.forEach((x) => { if (!x.fecha || x.fecha > base) x.fecha = '2000-01-01'; });
    const filas = Array.from({ length: 7 }, (_, i) => {
      const f = sumaDias(base, i); const r = rutinaDel(f);
      const act = r.noche.filter((s) => !['bifasico', 'limpiador', 'crema-n', 'kvit'].includes(s.id)).map((s) => s.titulo.split(' ').slice(0, 3).join(' '));
      const man = r.manana.filter((s) => ['vitc', 'azelaico', 'niacinamida'].includes(s.id)).map((s) => s.id === 'vitc' ? 'Vit. C' : s.id === 'azelaico' ? 'Azelaico' : 'Niacinamida');
      return `<div class="dy"><b>${cap(DIAS[parseDia(f).getDay()]).slice(0, 3)}</b><span>Mañana: ${man.join(' · ') || '—'}<br>Noche: ${act.join(' · ') || (r.nota ? 'recuperación' : '—')}</span></div>`;
    }).join('');
    state.plan = guard;
    return `<p class="muted">Así queda cada semana cuando esté todo el plan en marcha. Salicílico y mascarillas Lakerain siguen en pausa.</p><div class="grp">${filas}</div>`;
  };
  return `<header class="top"><h1>Plan</h1></header>
    <div class="seg" role="group" aria-label="Vista"><button class="${ui.planVista === 'reintro' ? 'on' : ''}" data-act="plan-vista" data-v="reintro" aria-pressed="${ui.planVista === 'reintro'}">Reintroducción</button><button class="${ui.planVista === 'semana' ? 'on' : ''}" data-act="plan-vista" data-v="semana" aria-pressed="${ui.planVista === 'semana'}">Semana normal</button></div>
    ${ui.planVista === 'reintro' ? reintro : semana()}
    <h3 class="h3">Reglas fijas</h3><div class="grp list">${[PERFIL.reglas[0], ...REGLAS_COMBINACION].map((t) => `<p>${esc(t)}</p>`).join('')}</div>`;
}

function viewAjustes() {
  const a = state.ajustes;
  const sw = (k, txt, sub) => `<label class="row"><span class="nm"><b>${txt}</b>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" class="cb" data-act="regla" data-k="${k}"${a.reglas[k] ? ' checked' : ''}></label>`;
  return `${backLink('#/hoy', 'Hoy')}<h1 class="h1s">Ajustes</h1>
    <h3 class="h3">Avisos</h3>
    <section class="grp form">
      <label class="kv"><span>Mañana</span><input type="time" data-act="hora" data-k="horaManana" value="${a.horaManana}"></label>
      <label class="kv"><span>Retoque de solar (L-V)</span><input type="time" data-act="hora" data-k="horaRetoque" value="${a.horaRetoque}"></label>
      <label class="kv"><span>Noche</span><input type="time" data-act="hora" data-k="horaNoche" value="${a.horaNoche}"></label>
      <button class="btn dark" data-act="ics">Añadir avisos al calendario</button>
    </section>
    <p class="muted">Una web app no puede avisar sola a una hora sin un servidor, y esta no usa ninguno. Por eso los avisos van al Calendario del iPhone: incluye la rutina diaria y los días en que entra cada producto del plan.</p>
    <h3 class="h3">Tus reglas al revisar ingredientes</h3>
    <div class="grp">${sw('perfume', 'Avisar si lleva perfume')}${sw('alcohol', 'Avisar si lleva alcohol denat.')}${sw('arbolTe', 'Avisar si lleva aceite de árbol de té')}${sw('aceites', 'Avisar si lleva aceites esenciales')}${sw('pesadas', 'Avisar si es una crema rica', 'Karité, aceites pesados: el «huevo frito»')}${sw('exfoliantes', 'Avisar si exfolia', 'Salicílico, glicólico, PHA')}</div>
    <h3 class="h3">Lectura</h3>
    <div class="grp"><label class="row"><span class="nm"><b>Texto grande</b></span><input type="checkbox" class="cb" data-act="texto-grande"${a.textoGrande ? ' checked' : ''}></label></div>
    <h3 class="h3">Tus datos</h3>
    <div class="grp list"><p><b>Se guardan solo en este iPhone.</b> Sin cuentas, sin servidores y sin enviar nada a nadie. Solo sale a internet para buscar un código en Open Beauty Facts.</p></div>
    <div class="grid2"><button class="btn ghost" data-act="backup">Hacer copia</button><button class="btn ghost" data-act="restore">Recuperar copia</button></div>
    <button class="btn ghost" data-act="csv">Exportar el diario (CSV)</button>
    <input type="file" accept="application/json,.json" id="restore-input" hidden>
    <h3 class="h3">Instalar en el iPhone</h3>
    <div class="grp list"><p>1. Abre esta página en <b>Safari</b>.</p><p>2. Toca <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.</p><p>3. Ábrela una vez con internet para que descargue el escáner y el lector de fotos.</p></div>
    <button class="btn danger-link" data-act="borrar-todo">Borrar todos los datos</button>`;
}

// ---------- Informe ----------
function informe() {
  const hoy = hoyStr();
  const uso = state.productos.filter((p) => p.estado === 'uso');
  const pausa = state.productos.filter((p) => p.estado === 'pausa');
  const diario = [...state.diario].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const w = window.open('', '_blank');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe de piel · ${hoy}</title>
  <style>body{font:14px/1.5 system-ui,sans-serif;margin:32px;color:#1F1D1A}h1{font-size:22px}h2{font-size:16px;margin-top:24px}li{margin:2px 0}small{color:#555}</style></head><body>
  <h1>Informe de piel · ${esc(PERFIL.nombre)} · ${fechaLarga(hoy)}</h1>
  <p>${esc(PERFIL.piel)}.<br>${esc(PERFIL.diagnostico)}.</p>
  <h2>Usa ahora</h2><ul>${uso.map((p) => `<li>${esc(p.nombre)} <small>${esc(p.uso || '')}</small></li>`).join('')}</ul>
  <h2>En pausa</h2><ul>${pausa.map((p) => `<li>${esc(p.nombre)} <small>${esc(p.nota || '')}</small></li>`).join('')}</ul>
  <h2>Plan de reintroducción</h2><ul><li>Rutina mínima del ${fechaCorta(state.plan.minimaDesde)} al ${fechaCorta(state.plan.minimaHasta)}</li>${state.plan.pasos.map((x) => `<li>${esc(x.titulo)}: ${x.fecha ? fechaCorta(x.fecha) : 'sin fecha'}</li>`).join('')}</ul>
  <h2>Diario</h2><ul>${diario.map((d) => `<li>${fechaCorta(d.fecha)} · ${esc(d.tipo)}${d.zonas && d.zonas.length ? ' · ' + esc(d.zonas.join(', ')) : ''}${d.nota ? ' · ' + esc(d.nota) : ''}</li>`).join('')}</ul>
  </body></html>`;
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => { try { w.print(); } catch (e) { /* nada */ } }, 400); }
  else download(`informe-piel-${hoy}.html`, html, 'text/html');
}

// ---------- Avisos al calendario (.ics) ----------
function ics() {
  const a = state.ajustes;
  const hoy = hoyStr().replace(/-/g, '');
  const t = (h) => h.replace(':', '') + '00';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ev = (uidp, titulo, inicio, regla, desc) => ['BEGIN:VEVENT', `UID:${uidp}@piel`, `DTSTAMP:${stamp}`, `DTSTART:${inicio}`, regla ? `RRULE:${regla}` : '', `SUMMARY:${titulo}`, `DESCRIPTION:${desc}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${titulo}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].filter(Boolean).join('\r\n');
  const evs = [
    ev('manana', 'Piel: rutina de mañana', `${hoy}T${t(a.horaManana)}`, 'FREQ=DAILY', 'Abre la app Piel para ver los pasos de hoy.'),
    ev('retoque', 'Piel: retoque de solar', `${hoy}T${t(a.horaRetoque)}`, 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'Avène Mineral Compact a toques.'),
    ev('noche', 'Piel: rutina de noche', `${hoy}T${t(a.horaNoche)}`, 'FREQ=DAILY', 'Abre la app Piel para ver los pasos de hoy.'),
    ...state.plan.pasos.filter((x) => x.fecha && x.fecha >= hoyStr()).map((x) => ev('plan-' + x.id + '-' + x.fecha, 'Piel: empieza ' + x.titulo, `${x.fecha.replace(/-/g, '')}T${t(a.horaManana)}`, '', x.detalle)),
  ];
  download('avisos-piel.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Piel//ES', 'CALSCALE:GREGORIAN', ...evs, 'END:VCALENDAR'].join('\r\n'), 'text/calendar');
  toast('Abre el archivo para añadir los avisos al Calendario');
}

// ---------- Escáner ----------
let scan = { stream: null, timer: null, detector: null };
function cargarScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}
async function crearDetector() {
  const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
  if ('BarcodeDetector' in window) {
    try { const f = await window.BarcodeDetector.getSupportedFormats(); if (f.includes('ean_13')) return new window.BarcodeDetector({ formats }); } catch (e) { /* usamos el lector propio */ }
  }
  await cargarScript('vendor/barcode/ponyfill.js');
  const api = window.BarcodeDetectionAPI;
  api.prepareZXingModule({ overrides: { locateFile: (path, prefix) => path.endsWith('.wasm') ? new URL('vendor/barcode/' + path, location.href).href : prefix + path } });
  return new api.BarcodeDetector({ formats });
}
async function empezarEscaner() {
  const video = $('#video'); const msg = $('#scan-msg');
  if (!video) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = 'Este navegador no deja usar la cámara. Escribe el número del código.'; return; }
  try {
    scan.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
    video.srcObject = scan.stream; await video.play();
    scan.detector = scan.detector || await crearDetector();
    const tick = async () => {
      if (!scan.stream) return;
      try {
        const r = await scan.detector.detect(video);
        if (r && r.length) { const code = r[0].rawValue; pararEscaner(); if (navigator.vibrate) navigator.vibrate(60); return buscarCodigo(code); }
      } catch (e) { /* frame sin código */ }
      scan.timer = setTimeout(tick, 250);
    };
    tick();
  } catch (e) {
    msg.textContent = e && e.name === 'NotAllowedError' ? 'Sin permiso para la cámara. Actívalo en Ajustes › Safari › Cámara, o escribe el número.' : 'No se ha podido abrir la cámara. Escribe el número del código.';
  }
}
function pararEscaner() {
  clearTimeout(scan.timer); scan.timer = null;
  if (scan.stream) { scan.stream.getTracks().forEach((t) => t.stop()); scan.stream = null; }
}
async function buscarCodigo(codigo) {
  codigo = String(codigo).replace(/\D/g, '');
  if (!codigo) return;
  const local = state.productos.find((p) => p.codigo === codigo);
  if (local) { location.hash = '#/producto/' + local.id; return; }
  const msg = $('#scan-msg'); if (msg) msg.textContent = 'Buscando ' + codigo + '…';
  let e = { codigo, fuente: 'ninguna', nombre: '', marca: '', inci: '', imagen: '' };
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${codigo}.json?fields=product_name,product_name_es,brands,ingredients_text,ingredients_text_en,ingredients_text_es,image_front_small_url`, { signal: ctrl.signal });
    clearTimeout(to);
    const j = await r.json();
    if (j && j.status === 1 && j.product) {
      const p = j.product;
      e = { codigo, fuente: 'obf', nombre: p.product_name_es || p.product_name || '', marca: (p.brands || '').split(',')[0], inci: p.ingredients_text_en || p.ingredients_text || p.ingredients_text_es || '', imagen: p.image_front_small_url || '' };
    }
  } catch (err) { toast('Sin conexión: completa la ficha a mano'); }
  ui.escaneo = e;
  location.hash = '#/resultado';
}

// ---------- Lector de fotos (Tesseract, como en la app Rutina) ----------
async function leerFoto(file, idiomas) {
  const prog = $('#ocr-progress');
  const set = (t) => { if (prog) prog.textContent = t; };
  let canvas = null, worker = null;
  try {
    set('Preparando la foto…');
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d'); ctx.filter = 'grayscale(1) contrast(1.35)'; ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height); bmp.close();
    set('Cargando el lector…');
    await cargarScript('vendor/tesseract/tesseract.min.js');
    const base = new URL('vendor/tesseract/', location.href).href;
    worker = await Tesseract.createWorker(idiomas, 1, {
      workerPath: base + 'worker.min.js', corePath: base + 'core', langPath: base + 'lang', workerBlobURL: false, cacheMethod: 'none', gzip: true,
      logger: (m) => { if (m.status === 'recognizing text') set(`Leyendo la foto… ${Math.round((m.progress || 0) * 100)} %`); },
    });
    const { data } = await worker.recognize(canvas);
    let txt = (data.text || '').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const m = txt.match(/(ingredients?|ingredientes|전성분)\s*[:：]?\s*(.*)$/i);
    if (m) txt = m[2];
    set(txt ? 'Leído. Revisa el texto por si hay alguna letra mal.' : 'No se ha leído texto. Prueba con más luz o más cerca.');
    return txt;
  } catch (err) {
    set('No se pudo leer la foto. Si es la primera vez, abre la app con internet para descargar el lector.');
    return '';
  } finally {
    if (worker) { try { await worker.terminate(); } catch (e) { /* nada */ } }
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}

// ---------- Router ----------
function ruta() {
  const h = location.hash.replace(/^#\/?/, '') || 'hoy';
  const [path, qs] = h.split('?');
  const [vista, arg] = path.split('/');
  return { vista, arg, q: new URLSearchParams(qs || '') };
}
function render() {
  const { vista, arg, q } = ruta();
  if (vista !== 'escanear') pararEscaner();
  document.documentElement.classList.toggle('big', !!state.ajustes.textoGrande);
  const tabDe = { hoy: 'hoy', productos: 'productos', producto: 'productos', compra: 'productos', control: 'control', diario: 'control', plan: 'plan', ajustes: 'hoy' };
  const vistas = { hoy: viewHoy, productos: viewProductos, producto: () => viewProducto(arg), compra: viewCompra, escanear: viewEscanear, resultado: viewResultado, diario: () => viewDiario(q.get('nuevo')), control: viewControl, plan: viewPlan, ajustes: viewAjustes };
  const fn = vistas[vista] || viewHoy;
  const app = $('#app');
  app.className = vista === 'escanear' ? 'dark' : '';
  app.innerHTML = fn();
  renderTabs(tabDe[vista] || '');
  $('#tabs').hidden = ['escanear', 'resultado'].includes(vista);
  if (vista === 'escanear') empezarEscaner();
  if (vista === 'diario' && q.get('nuevo')) { const f = $('#nuevo'); if (f) f.scrollIntoView({ block: 'start' }); }
}
let ultimaVista = '';
window.addEventListener('hashchange', () => {
  const v = location.hash;
  render();
  if (v !== ultimaVista) window.scrollTo(0, 0);
  ultimaVista = v;
});

// ---------- Acciones ----------
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.tagName === 'FORM') return;
  const act = el.dataset.act;
  const { arg } = ruta();
  const hoy = hoyStr();
  if (act === 'check') return; // lo gestiona «change»
  if (act === 'todo') {
    const r = rutinaDel(hoy);
    const pasos = { m: r.manana, d: r.mediodia, n: r.noche }[el.dataset.franja];
    const todos = pasos.every((s) => marcado(hoy, s.id));
    pasos.forEach((s) => { if (todos) delete state.checks[hoy + ':' + s.id]; else state.checks[hoy + ':' + s.id] = 1; });
    save(); render(); if (!todos) toast('Hecho. Bien.');
  } else if (act === 'filtro') { ui.filtro = el.dataset.f; render(); }
  else if (act === 'abierto') { const p = prod(arg); p.abierto = hoy; save(); render(); toast('Apuntado: abierto hoy'); }
  else if (act === 'queda-poco') {
    const p = prod(arg);
    if (!state.compra.some((c) => c.pid === p.id && !c.hecho)) { state.compra.push({ id: uid(), pid: p.id, texto: p.nombre, tienda: p.tienda || '', hecho: false }); save(); toast('Añadido a la lista de la compra'); }
    render();
  } else if (act === 'acabado') {
    const p = prod(arg); p.estado = 'acabado';
    if (!state.compra.some((c) => c.pid === p.id && !c.hecho)) state.compra.push({ id: uid(), pid: p.id, texto: p.nombre, tienda: p.tienda || '', hecho: false });
    save(); render(); toast('Marcado como acabado y añadido a la compra');
  } else if (act === 'borrar') {
    if (confirm('¿Borrar este producto? No se puede deshacer.')) { state.productos = state.productos.filter((p) => p.id !== arg); save(); location.hash = '#/productos'; }
  } else if (act === 'ocr-ficha' || act === 'ocr-res') { $('#ocr-input').click(); }
  else if (act === 'sin-codigo') { ui.escaneo = { codigo: '', fuente: 'manual', nombre: '', marca: '', inci: '' }; location.hash = '#/resultado'; }
  else if (act === 'guardar-res') {
    const e = ui.escaneo; const nombre = $('#r-nombre').value.trim();
    if (!nombre) { toast('Ponle un nombre'); $('#r-nombre').focus(); return; }
    const marca = $('#r-marca').value.trim();
    const inci = $('#r-inci').value.trim();
    const trad = /[가-힣]/.test(inci) ? traducirCoreano(inci).map((x) => x.inci).join(', ') : inci;
    const an = trad ? filtrarHallazgos(analizarInci(trad)) : { veredicto: 'cuidado' };
    const p = { id: uid(), nombre: marca && !nombre.toLowerCase().includes(marca.toLowerCase()) ? marca + ' ' + nombre : nombre, cat: $('#r-cat').value, kr: (e.codigo || '').startsWith('880') || /[가-힣]/.test(inci), estado: $('#r-estado').value, veredicto: an.veredicto, tienda: $('#r-tienda').value.trim(), uso: '', nota: '', inci: trad, codigo: e.codigo || '' };
    state.productos.push(p);
    if (p.estado === 'lista') state.compra.push({ id: uid(), pid: p.id, texto: p.nombre, tienda: p.tienda, hecho: false });
    save(); ui.escaneo = null; location.hash = '#/producto/' + p.id; toast('Guardado');
  } else if (act === 'diario-del') {
    if (confirm('¿Borrar esta entrada?')) { state.diario = state.diario.filter((d) => d.id !== el.dataset.id); save(); render(); }
  } else if (act === 'plan-vista') { ui.planVista = el.dataset.v; render(); }
  else if (act === 'paso-hoy') {
    const x = state.plan.pasos.find((p) => p.id === el.dataset.id);
    const activos = state.plan.pasos.filter((p) => p.fecha && p.fecha > sumaDias(hoy, -7) && p.id !== x.id);
    if (activos.length && !confirm('Hace menos de una semana que empezó otro producto. Lo recomendado es uno cada 1-2 semanas. ¿Empezar igualmente?')) return;
    x.fecha = hoy; sincronizarEstados(); save(); render(); toast(x.titulo + ' entra hoy en tu rutina');
  } else if (act === 'informe') informe();
  else if (act === 'ics') ics();
  else if (act === 'backup') { download(`piel-copia-${hoy}.json`, JSON.stringify(state, null, 1), 'application/json'); toast('Copia descargada: guárdala en Archivos'); }
  else if (act === 'restore') $('#restore-input').click();
  else if (act === 'csv') {
    const cel = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = [['fecha', 'tipo', 'zonas', 'nota'], ...[...state.diario].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((d) => [d.fecha, d.tipo, (d.zonas || []).join(' / '), d.nota])];
    download(`diario-piel-${hoy}.csv`, '﻿' + rows.map((r) => r.map(cel).join(';')).join('\n'), 'text/csv');
  } else if (act === 'compra-limpiar') { state.compra = state.compra.filter((c) => !c.hecho); save(); render(); }
  else if (act === 'borrar-todo') {
    if (confirm('¿Borrar todos los datos y volver a empezar? Haz antes una copia.') && confirm('Seguro: se borra todo.')) { localStorage.removeItem(STORE_KEY); state = freshState(); save(); location.hash = '#/hoy'; render(); }
  }
});

document.addEventListener('change', async (ev) => {
  const el = ev.target;
  const act = el.dataset.act;
  const { arg } = ruta();
  const hoy = hoyStr();
  if (act === 'check') {
    const k = hoy + ':' + el.dataset.id;
    if (el.checked) state.checks[k] = 1; else delete state.checks[k];
    save(); render();
  } else if (act === 'campo') {
    const p = prod(arg); const c = el.dataset.campo;
    p[c] = c === 'pao' ? (parseInt(el.value, 10) || null) : el.value.trim();
    if (c === 'inci' && p.inci) p.veredicto = filtrarHallazgos(analizarInci(p.inci)).veredicto;
    save(); if (['estado', 'inci', 'pao'].includes(c)) render();
  } else if (act === 'compra-check') { const c = state.compra.find((x) => x.id === el.dataset.id); c.hecho = el.checked; save(); render(); }
  else if (act === 'pend') { const x = state.pendientes.find((p) => p.id === el.dataset.id); x.hecho = el.checked; save(); render(); }
  else if (act === 'paso-fecha' && el.value) { state.plan.pasos.find((p) => p.id === el.dataset.id).fecha = el.value; sincronizarEstados(); save(); render(); toast('Fecha cambiada'); }
  else if (act === 'fin-prueba' && el.value) { state.plan.minimaHasta = el.value; save(); render(); toast('Fin de la prueba cambiado'); }
  else if (act === 'regla') { state.ajustes.reglas[el.dataset.k] = el.checked; save(); }
  else if (act === 'hora') { state.ajustes[el.dataset.k] = el.value; save(); }
  else if (act === 'texto-grande') { state.ajustes.textoGrande = el.checked; save(); render(); }
  else if (el.id === 'ocr-input' && el.files && el.files[0]) {
    const file = el.files[0]; el.value = '';
    const enRes = ruta().vista === 'resultado';
    const coreano = enRes && ui.escaneo && (ui.escaneo.codigo || '').startsWith('880');
    const txt = await leerFoto(file, coreano ? ['kor', 'eng'] : ['eng', 'spa']);
    if (!txt) return;
    if (enRes) { ui.escaneo.nombre = $('#r-nombre').value; ui.escaneo.marca = $('#r-marca').value; ui.escaneo.inci = txt; render(); }
    else { const p = prod(arg); p.inci = txt; p.veredicto = filtrarHallazgos(analizarInci(txt)).veredicto; save(); render(); }
  } else if (el.id === 'restore-input' && el.files && el.files[0]) {
    try {
      const s = JSON.parse(await el.files[0].text());
      if (!s || !Array.isArray(s.productos)) throw new Error('formato');
      if (!confirm('¿Sustituir los datos actuales por los de la copia?')) return;
      localStorage.setItem(STORE_KEY, JSON.stringify(s)); state = loadState(); render(); toast('Copia recuperada');
    } catch (e) { toast('Ese archivo no es una copia de Piel'); }
    el.value = '';
  }
});

document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.id === 'busca') {
    ui.busca = el.value; const pos = el.selectionStart; render();
    const n = $('#busca'); n.focus(); n.setSelectionRange(pos, pos);
  } else if (el.id === 'r-inci' && ui.escaneo) {
    ui.escaneo.inci = el.value;
    clearTimeout(el._t); el._t = setTimeout(() => { ui.escaneo.nombre = $('#r-nombre').value; ui.escaneo.marca = $('#r-marca').value; const sel = el.selectionStart; render(); const n = $('#r-inci'); n.focus(); n.setSelectionRange(sel, sel); }, 700);
  }
});

document.addEventListener('submit', (ev) => {
  const f = ev.target; const act = f.dataset.act;
  if (!act) return;
  ev.preventDefault();
  const fd = new FormData(f);
  if (act === 'codigo') buscarCodigo(fd.get('codigo'));
  else if (act === 'compra-add') { state.compra.push({ id: uid(), texto: fd.get('texto').trim(), tienda: (fd.get('tienda') || '').trim(), hecho: false }); save(); render(); }
  else if (act === 'diario-add') {
    state.diario.push({ id: uid(), fecha: fd.get('fecha') || hoyStr(), tipo: fd.get('tipo'), zonas: fd.getAll('zona'), nota: (fd.get('nota') || '').trim() });
    save(); location.hash = '#/diario'; render(); toast('Apuntado');
  }
});

// ---------- Arranque ----------
sincronizarEstados();
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
