// Datos iniciales de Carlota, sacados de su chat de rutina facial (hasta el 31 de octubre de 2026).
// La app los copia al móvil la primera vez; a partir de ahí, lo que cambie ella manda.

const PERFIL = {
  nombre: 'Carlota',
  piel: 'Mixta (zona T grasa, mejillas normales o secas), sensible y reactiva',
  diagnostico: 'Rosácea vascular con un poco de cuperosis (dermatóloga, finales de octubre de 2026)',
  objetivos: 'Estabilizar el melasma, reducir el poro, mejorar ojeras y rojeces, alisar la textura',
  reglas: [
    'Solar con óxidos de hierro los días de coche, por el melasma.',
    'Sin perfume, sin aceites esenciales y sin alcohol denat.',
    'Cremas ligeras: que no dejen la cara como un «huevo frito» ni tapen el poro.',
    'Vitamina C sin ácidos que irriten.',
    'Un producto nuevo cada 1-2 semanas, probándolo antes en la mandíbula.',
  ],
};

// Categorías en el orden en que se muestran.
const CATEGORIAS = [
  ['limpieza', 'Limpieza'],
  ['manana', 'Mañana'],
  ['noche', 'Noche'],
  ['contorno', 'Contorno de ojos'],
  ['crema', 'Cremas e hidratación'],
  ['solar', 'Solares'],
  ['otros', 'Mascarillas y otros'],
];

// Estados de un producto.
const ESTADOS = {
  uso: 'En uso',
  pausa: 'En pausa',
  nuevo: 'Sin estrenar',
  verificar: 'Por verificar',
  lista: 'En la lista',
  acabado: 'Acabado',
  descartado: 'Descartado',
};

// Veredicto para su piel (rosácea + melasma): ok, cuidado, no.
// pao = meses que dura una vez abierto (si consta).
const PRODUCTOS_INICIALES = [
  // Limpieza
  { id: 'cerave-foaming', corto: 'CeraVe Foaming', nombre: 'CeraVe Foaming Cleanser', cat: 'limpieza', estado: 'uso', veredicto: 'ok', tienda: 'Farmacia', uso: 'Noche, después del bifásico', nota: 'Casi acabado. Lleva niacinamida.' },
  { id: 'bifasico-mercadona', corto: 'Bifásico Mercadona', nombre: 'Bifásico rosa Deliplus (Mercadona)', cat: 'limpieza', estado: 'uso', veredicto: 'cuidado', tienda: 'Mercadona', uso: 'Noche, por toda la cara', nota: 'Mirar en la caja si lleva perfume o aceites esenciales. Aclarar bien con el CeraVe.' },
  { id: 'manyo', nombre: 'ma:nyo Pure Cleansing Oil Deep Clean', cat: 'limpieza', kr: true, estado: 'descartado', veredicto: 'no', tienda: 'YesStyle', uso: '', nota: 'Lleva bergamota, lavanda, linalool y limonene. Sospechoso de los brotes.' },

  // Mañana
  { id: 'sesderma-c', corto: 'Sesderma C-Vit', nombre: 'Sesderma C-Vit Liposomal Serum', cat: 'manana', estado: 'pausa', veredicto: 'cuidado', tienda: 'Farmacia', uso: 'Mañanas', nota: 'Vitamina C estable y suave (3-O-etil ascórbico). Lleva perfume, pero la tolera. Se acaba hacia finales de noviembre.' },
  { id: 'althea-c', corto: 'Dr. Althea Vitamin C', nombre: 'Dr. Althea Gentle Vitamin C Serum', cat: 'manana', kr: true, estado: 'nuevo', veredicto: 'ok', tienda: 'YesStyle', uso: 'Sustituye a la Sesderma cuando se acabe', nota: 'Bote verde, 30 ml. 3-O-etil ascórbico, niacinamida al 5 % y espino amarillo.' },
  { id: 'skin1004-azelaic', corto: 'SKIN1004 Azelaico', nombre: 'SKIN1004 Madagascar Centella Azelaic Acid 10 Ampoule', cat: 'manana', kr: true, estado: 'nuevo', veredicto: 'ok', tienda: 'YesStyle', uso: 'Mañanas, para las rojeces', nota: 'Azelaico encapsulado. Sin perfume ni alcohol. La dermatóloga propuso azelaico.' },
  { id: 'cosdebaha-az15', nombre: 'Cos De BAHA AZ15 Serum (mini)', cat: 'manana', kr: true, estado: 'nuevo', veredicto: 'ok', tienda: 'YesStyle', uso: 'Más adelante, en lugar del SKIN1004', nota: 'Azelaico 15 %. Nunca a la vez que el SKIN1004.' },
  { id: 'to-niacinamida', corto: 'Niacinamida The Ordinary', nombre: 'The Ordinary Niacinamide 10% + Zinc 1%', cat: 'manana', estado: 'pausa', veredicto: 'cuidado', tienda: '', uso: 'Una gota en la zona T', nota: 'No subir la dosis.' },
  { id: 'nida-propolis', nombre: 'NIDA Peptide Propolis Renewal Serum', cat: 'manana', kr: true, estado: 'pausa', veredicto: 'cuidado', tienda: 'YesStyle', uso: '', nota: 'El propóleo sensibiliza. En pausa por la rosácea.' },
  { id: 'nida-pdrn', nombre: 'NIDA Salmon PDRN Peptide Serum', cat: 'manana', kr: true, estado: 'nuevo', veredicto: 'ok', tienda: 'YesStyle', uso: 'Sustituirá al de propóleo, no los dos', nota: 'Sin perfume.' },
  { id: 'skin1004-toner', nombre: 'SKIN1004 Madagascar Centella Toning Toner', cat: 'manana', kr: true, estado: 'nuevo', veredicto: 'cuidado', tienda: 'YesStyle', uso: 'El último en entrar', nota: 'Lleva PHA (gluconolactona), que exfolia. En pausa con la rosácea.' },

  // Noche
  { id: 'cantabria-retinol', corto: 'Retinol Cantabria', nombre: 'Cantabria Labs Endocare Renewal Retinol Serum', cat: 'noche', estado: 'pausa', veredicto: 'cuidado', tienda: 'Farmacia', uso: 'Martes, jueves y sábado · frente y barbilla', nota: 'Potencia baja. Queda poco; después, Celimax Retinol.' },
  { id: 'celimax-retinol', corto: 'Celimax Retinol', nombre: 'Celimax The Vita-A Retinol Shot Tightening Serum', cat: 'noche', kr: true, estado: 'nuevo', veredicto: 'cuidado', pao: 6, tienda: 'YesStyle', uso: 'Cuando se acabe el Cantabria', nota: 'Retinol 0,1 % y péptidos. Fue un regalo.' },
  { id: 'celimax-retinal', corto: 'Celimax Retinal', nombre: 'Celimax The Vita-A Retinal Shot Tightening Booster', cat: 'noche', kr: true, estado: 'pausa', veredicto: 'cuidado', pao: 6, tienda: 'YesStyle', uso: 'Martes, jueves y sábado · solo contorno de ojos', nota: 'Retinal 0,1 %. Sobre el hueso de la órbita, a un dedo de las pestañas.' },
  { id: 'eucerin-dual', corto: 'Eucerin Dual Serum', nombre: 'Eucerin Anti-Pigment Dual Serum', cat: 'noche', estado: 'pausa', veredicto: 'cuidado', tienda: 'Farmacia', uso: 'Lunes y viernes · pómulos y labio superior', nota: 'Tiamidol. Lleva alcohol denat. (2.º ingrediente) y perfume: si da calor, rojez o escozor, es el primero que se quita.' },
  { id: 'txa-beautydrops', corto: 'TXA Beauty Drops', nombre: 'Beauty Drops TXA 3% + Azeloglicina', cat: 'noche', estado: 'pausa', veredicto: 'ok', pao: 12, tienda: '', uso: 'Lunes y viernes, después del Eucerin', nota: 'Sin perfume. Lleva algo de ácido salicílico (menos del 1 %).' },
  { id: 'to-salicilico', nombre: 'The Ordinary Salicylic Acid 2%', cat: 'noche', estado: 'pausa', veredicto: 'cuidado', tienda: '', uso: 'Miércoles en la zona T', nota: 'Exfolia. En pausa con la rosácea.' },

  // Contorno
  { id: 'sesderma-kvit', corto: 'Sesderma K-Vit', nombre: 'Sesderma K-Vit', cat: 'contorno', estado: 'uso', veredicto: 'ok', tienda: 'Farmacia', uso: 'Todas las noches', nota: 'Vitamina K: va bien con capilares visibles.' },
  { id: 'to-cafeina', nombre: 'The Ordinary Caffeine Solution 5% + EGCG', cat: 'contorno', estado: 'pausa', veredicto: 'ok', tienda: '', uso: 'Mañanas', nota: '' },
  { id: 'alma-secret', nombre: 'Alma Secret Eye Cream', cat: 'contorno', estado: 'verificar', veredicto: 'cuidado', tienda: '', uso: 'Solo noches con tirantez', nota: 'Lleva aguacate y mantecas: evitar si salen milia. Repite cafeína.' },

  // Cremas
  { id: 'purito-bamboo', corto: 'Purito Mighty Bamboo', nombre: 'Purito Seoul Mighty Bamboo Panthenol Cream', cat: 'crema', kr: true, estado: 'uso', veredicto: 'ok', tienda: 'YesStyle', uso: 'Mañana y noche, lejos de la ojera', nota: 'Pantenol 10 %, escualano y centella. Sin perfume.' },
  { id: 'pyunkang', nombre: 'Pyunkang Yul Calming Moisture Barrier Cream', cat: 'crema', kr: true, estado: 'verificar', veredicto: 'cuidado', tienda: 'YesStyle', uso: 'Solo mejillas', nota: 'Lleva karité y aceite de oliva. Lejos de la zona T y la ojera.' },
  { id: 'crema-24k', nombre: 'Crema de 24k', cat: 'crema', estado: 'verificar', veredicto: 'cuidado', tienda: '', uso: '', nota: 'Iba a sustituirla la Pyunkang. Falta la marca.' },
  { id: 'hialuronico-mercadona', nombre: 'Ácido hialurónico Hidrata (Mercadona)', cat: 'crema', estado: 'pausa', veredicto: 'ok', tienda: 'Mercadona', uso: '1 vez por semana', nota: 'Sobre piel húmeda.' },
  { id: 'cerave-oilcontrol', nombre: 'CeraVe crema Oil Control', cat: 'crema', estado: 'descartado', veredicto: 'no', tienda: 'Farmacia', uso: '', nota: 'Le taponó los poros.' },

  // Solares
  { id: 'eucerin-solar', corto: 'Eucerin solar tintado', nombre: 'Eucerin Sun Hydro Protect tintado claro FPS50+', cat: 'solar', estado: 'uso', veredicto: 'cuidado', tienda: 'Farmacia', uso: 'Días de coche', nota: 'Lleva óxidos de hierro (necesarios por el melasma). También alcohol denat.' },
  { id: 'skin1004-sun', corto: 'SKIN1004 Sun Serum', nombre: 'SKIN1004 Hyalu-Cica Water-Fit Sun Serum', cat: 'solar', kr: true, estado: 'uso', veredicto: 'ok', pao: 12, tienda: 'YesStyle', uso: 'Fines de semana y días sin coche', nota: 'Sin color: no protege el melasma de la luz visible.' },
  { id: 'avene-compact', corto: 'Avène Mineral Compact', nombre: 'Avène Mineral Compact SPF50', cat: 'solar', estado: 'uso', veredicto: 'ok', tienda: 'Farmacia', uso: 'Retoque a mediodía', nota: 'Filtros minerales y óxidos de hierro.' },
  { id: 'isdin-color', nombre: 'ISDIN Fusion Water Magic Repair Color', cat: 'solar', estado: 'descartado', veredicto: 'cuidado', tienda: 'Farmacia', uso: '', nota: 'Le queda demasiado oscuro.' },

  // Otros
  { id: 'lakerain-collagen', nombre: 'Lakerain Collagen Night Wrapping Mask', cat: 'otros', estado: 'pausa', veredicto: 'cuidado', tienda: '', uso: 'Domingos', nota: 'Oclusiva: retiene calor. En pausa con la rosácea.' },
  { id: 'lakerain-vitc', nombre: 'Lakerain mascarilla de vitamina C', cat: 'otros', estado: 'pausa', veredicto: 'cuidado', tienda: '', uso: 'Domingos', nota: 'Sin ver los ingredientes.' },
  { id: 'abib-patches', nombre: 'Abib Collagen Eye Patch Jericho Rose Jelly', cat: 'otros', kr: true, estado: 'nuevo', veredicto: 'ok', tienda: 'YesStyle', uso: 'Para la boda', nota: 'Probarlos antes. Fríos, 15-20 minutos.' },
];

// Fechas del plan de reintroducción (propuesta del chat). Se pueden mover desde la app.
const PLAN_INICIAL = {
  minimaDesde: '2026-10-27',
  minimaHasta: '2026-11-15',
  pasos: [
    { id: 'vitc', titulo: 'Vitamina C', detalle: 'Mañanas. La primera semana, solo en media cara.', fecha: '2026-11-16' },
    { id: 'azelaico', titulo: 'Azelaico SKIN1004', detalle: 'Mañanas de lunes, miércoles y domingo.', fecha: '2026-11-23' },
    { id: 'niacinamida', titulo: 'Niacinamida', detalle: 'Una gota en la zona T, las mañanas sin azelaico.', fecha: '2026-11-30' },
    { id: 'retinol', titulo: 'Retinol', detalle: 'Martes, jueves y sábado, en frente y barbilla.', fecha: null },
    { id: 'retinal', titulo: 'Retinal en el contorno', detalle: 'Las mismas noches que el retinol, sin solaparse.', fecha: null },
    { id: 'txa', titulo: 'TXA Beauty Drops', detalle: 'Lunes y viernes por la noche.', fecha: null },
    { id: 'eucerin', titulo: 'Eucerin Dual Serum', detalle: 'Lunes y viernes, antes del TXA. El último.', fecha: null },
  ],
};

const REGLAS_COMBINACION = [
  'Retinoides nunca la misma noche que salicílico, TXA o Eucerin.',
  'Nunca dos retinoides en la misma zona ni dos noches seguidas.',
  'Retinoides, TXA y Eucerin a un dedo de las pestañas.',
  'Las mañanas de azelaico, sin niacinamida.',
  'Nada de ácidos cerca del ojo.',
];

const DIARIO_INICIAL = [
  { id: 'd1', fecha: '2026-10-26', tipo: 'regla', zonas: [], nota: 'Terminó la regla.' },
  { id: 'd2', fecha: '2026-10-27', tipo: 'nota', zonas: [], nota: 'Empieza la rutina mínima. Último activo: Eucerin Dual el lunes 26 por la noche.' },
  { id: 'd3', fecha: '2026-10-30', tipo: 'grano', zonas: ['Pómulo der.'], nota: 'Grano profundo, sin punta, junto a la nariz.' },
];

const PENDIENTES_INICIALES = [
  { id: 'p1', texto: 'Fotos de las ojeras con la misma luz que el 20 de agosto', fecha: '2026-11-15', hecho: false },
  { id: 'p2', texto: 'Mover los recordatorios del móvil (3, 10 y 17 nov) al 16, 23 y 30', fecha: '2026-11-07', hecho: false },
  { id: 'p3', texto: 'Presupuesto de la clínica (luz pulsada y lunar): válido hasta el 26/01/2027', fecha: '2027-01-26', hecho: false },
  { id: 'p4', texto: 'Preguntar a la dermatóloga: luz pulsada con melasma y qué parar antes', fecha: null, hecho: false },
];

const COMPRA_INICIAL = [
  { id: 'c1', texto: 'CeraVe Foaming Cleanser', tienda: 'Farmacia', hecho: false },
  { id: 'c2', texto: 'Aceite limpiador suave (Bioderma Sensibio o Klairs Gentle Black Fresh)', tienda: 'Druni, Primor o YesStyle', hecho: false },
  { id: 'c3', texto: 'Regalo para su madre: Haruharu Wonder Centella Phyto & 5 Peptide', tienda: 'YesStyle', hecho: false },
];

const TIENDAS = ['YesStyle', 'Farmacia', 'Primor', 'Druni', 'Mercadona', 'Amazon'];

const ZONAS = ['Frente', 'Entrecejo', 'Nariz', 'Pómulo izq.', 'Pómulo der.', 'Mejilla izq.', 'Mejilla der.', 'Labio superior', 'Barbilla', 'Mandíbula', 'Ojera'];
