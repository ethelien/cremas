// Revisión de una lista de ingredientes (INCI) con las reglas de Carlota.
// Es orientativa: no sustituye a la dermatóloga.

// Glosario coreano → INCI de los ingredientes más habituales en cosmética coreana.
// Lo que no esté aquí se marca para revisarlo a mano.
const GLOSARIO_KO = {
  '정제수': 'Water', '물': 'Water', '글리세린': 'Glycerin', '부틸렌글라이콜': 'Butylene Glycol',
  '프로판다이올': 'Propanediol', '1,2-헥산다이올': '1,2-Hexanediol', '다이프로필렌글라이콜': 'Dipropylene Glycol',
  '펜틸렌글라이콜': 'Pentylene Glycol', '나이아신아마이드': 'Niacinamide', '병풀추출물': 'Centella Asiatica Extract',
  '병풀잎수': 'Centella Asiatica Leaf Water', '병풀잎추출물': 'Centella Asiatica Leaf Extract', '마데카소사이드': 'Madecassoside',
  '아시아티코사이드': 'Asiaticoside', '아시아틱애씨드': 'Asiatic Acid', '마데카식애씨드': 'Madecassic Acid',
  '판테놀': 'Panthenol', '소듐하이알루로네이트': 'Sodium Hyaluronate', '하이알루로닉애씨드': 'Hyaluronic Acid',
  '하이드롤라이즈드하이알루로닉애씨드': 'Hydrolyzed Hyaluronic Acid', '세라마이드엔피': 'Ceramide NP', '세라마이드에이피': 'Ceramide AP',
  '세라마이드이오피': 'Ceramide EOP', '콜레스테롤': 'Cholesterol', '스쿠알란': 'Squalane', '다이메티콘': 'Dimethicone',
  '사이클로펜타실록세인': 'Cyclopentasiloxane', '사이클로헥사실록세인': 'Cyclohexasiloxane', '카보머': 'Carbomer',
  '잔탄검': 'Xanthan Gum', '알란토인': 'Allantoin', '베타인': 'Betaine', '트레할로스': 'Trehalose', '알부틴': 'Arbutin',
  '아데노신': 'Adenosine', '토코페롤': 'Tocopherol', '에틸헥실글리세린': 'Ethylhexylglycerin', '페녹시에탄올': 'Phenoxyethanol',
  '다이소듐이디티에이': 'Disodium EDTA', '소듐피티에이트': 'Sodium Phytate', '트로메타민': 'Tromethamine',
  '하이드로제네이티드레시틴': 'Hydrogenated Lecithin', '세틸알코올': 'Cetyl Alcohol', '세테아릴알코올': 'Cetearyl Alcohol',
  '스테아릭애씨드': 'Stearic Acid', '카프릴릭/카프릭트라이글리세라이드': 'Caprylic/Capric Triglyceride',
  '아이소프로필미리스테이트': 'Isopropyl Myristate', '향료': 'Fragrance (Parfum)', '변성알코올': 'Alcohol Denat.',
  '에탄올': 'Alcohol', '알코올': 'Alcohol', '티트리잎오일': 'Melaleuca Alternifolia (Tea Tree) Leaf Oil',
  '티트리잎추출물': 'Melaleuca Alternifolia (Tea Tree) Leaf Extract', '티트리잎수': 'Melaleuca Alternifolia (Tea Tree) Leaf Water',
  '시어버터': 'Butyrospermum Parkii (Shea) Butter', '올리브오일': 'Olea Europaea (Olive) Fruit Oil', '올리브열매오일': 'Olea Europaea (Olive) Fruit Oil',
  '호호바씨오일': 'Simmondsia Chinensis (Jojoba) Seed Oil', '해바라기씨오일': 'Helianthus Annuus (Sunflower) Seed Oil',
  '리모넨': 'Limonene', '리날룰': 'Linalool', '시트랄': 'Citral', '제라니올': 'Geraniol', '시트로넬올': 'Citronellol',
  '라벤더오일': 'Lavandula Angustifolia (Lavender) Oil', '베르가모트열매오일': 'Citrus Aurantium Bergamia (Bergamot) Fruit Oil',
  '페퍼민트오일': 'Mentha Piperita (Peppermint) Oil', '멘톨': 'Menthol', '살리실릭애씨드': 'Salicylic Acid',
  '글라이콜릭애씨드': 'Glycolic Acid', '락틱애씨드': 'Lactic Acid', '글루코노락톤': 'Gluconolactone', '레티놀': 'Retinol',
  '레티날': 'Retinal', '아스코빅애씨드': 'Ascorbic Acid', '3-O-에틸아스코빅애씨드': '3-O-Ethyl Ascorbic Acid',
  '아스코빌글루코사이드': 'Ascorbyl Glucoside', '트라넥사믹애씨드': 'Tranexamic Acid', '아젤라익애씨드': 'Azelaic Acid',
  '녹차추출물': 'Camellia Sinensis Leaf Extract', '프로폴리스추출물': 'Propolis Extract', '달팽이점액여과물': 'Snail Secretion Filtrate',
  '쌀추출물': 'Oryza Sativa (Rice) Extract', '어성초추출물': 'Houttuynia Cordata Extract', '카페인': 'Caffeine',
  '징크옥사이드': 'Zinc Oxide', '티타늄디옥사이드': 'Titanium Dioxide', '황색산화철': 'Iron Oxides (CI 77492)',
  '적색산화철': 'Iron Oxides (CI 77491)', '흑색산화철': 'Iron Oxides (CI 77499)', '소듐디엔에이': 'Sodium DNA',
};

// Reglas: patrón sobre la lista en minúsculas, nivel y explicación.
const REGLAS_INCI = [
  { re: /\b(parfum|fragrance|aroma)\b/, nivel: 'no', texto: 'Lleva perfume' },
  { re: /alcohol denat|\bsd alcohol\b|(^|[,;]\s*)(alcohol|ethanol)\s*(,|;|$)/, nivel: 'no', texto: 'Lleva alcohol denat., que reseca y enrojece' },
  { re: /(melaleuca alternifolia|tea tree)[^,]*oil/, nivel: 'no', texto: 'Lleva aceite de árbol de té' },
  { re: /\b(limonene|linalool|citral|geraniol|citronellol|eugenol)\b|lavandula[^,]*oil|bergamia|mentha[^,]*oil|\bmenthol\b|rosmarinus[^,]*oil|eucalyptus[^,]*oil|aniba ros/, nivel: 'no', texto: 'Lleva aceites esenciales o sus alérgenos' },
  { re: /(melaleuca alternifolia|tea tree)[^,]*(extract|water)/, nivel: 'cuidado', texto: 'Lleva extracto o agua de árbol de té (no el aceite)' },
  { re: /butyrospermum|shea butter|olea europaea[^,]*oil|theobroma cacao|cocos nucifera[^,]*oil|isopropyl (myristate|palmitate)/, nivel: 'cuidado', texto: 'Lleva grasas pesadas: puede dejar brillo o tapar el poro' },
  { re: /salicylic acid|glycolic acid|lactic acid|mandelic acid|gluconolactone|lactobionic/, nivel: 'cuidado', texto: 'Exfolia: con la rosácea, mejor en pausa y nunca con retinoides' },
  { re: /propolis/, nivel: 'cuidado', texto: 'Lleva propóleo, que puede sensibilizar' },
  { re: /\bretinol\b|\bretinal\b|retinyl|retinoate/, nivel: 'info', texto: 'Es un retinoide: solo las noches de retinoide' },
  { re: /azelaic|azeloyl/, nivel: 'bien', texto: 'Azelaico: ayuda con rojeces, granitos y manchas' },
  { re: /tranexamic/, nivel: 'bien', texto: 'Tranexámico: ayuda con el melasma' },
  { re: /niacinamide/, nivel: 'bien', texto: 'Niacinamida' },
  { re: /ceramide/, nivel: 'bien', texto: 'Ceramidas: refuerzan la barrera' },
  { re: /panthenol|centella|madecassoside|allantoin/, nivel: 'bien', texto: 'Calmantes (pantenol, centella o alantoína)' },
  { re: /ci 7749[129]|iron oxide/, nivel: 'bien', texto: 'Óxidos de hierro: protegen el melasma de la luz visible' },
];

function traducirCoreano(texto) {
  // Devuelve [{original, inci, conocido}] para cada ingrediente separado por comas.
  return texto.split(/[,،、\n]+/).map((t) => t.trim()).filter(Boolean).map((orig) => {
    const limpio = orig.replace(/\s+/g, '');
    if (!/[가-힣]/.test(orig)) return { original: orig, inci: orig, conocido: true };
    const inci = GLOSARIO_KO[limpio] || GLOSARIO_KO[orig];
    return { original: orig, inci: inci || orig, conocido: !!inci };
  });
}

function analizarInci(texto) {
  const t = (texto || '').toLowerCase().replace(/\s+/g, ' ');
  const hallazgos = [];
  for (const r of REGLAS_INCI) if (r.re.test(t)) hallazgos.push({ nivel: r.nivel, texto: r.texto });
  let veredicto = 'ok';
  if (hallazgos.some((h) => h.nivel === 'no')) veredicto = 'no';
  else if (hallazgos.some((h) => h.nivel === 'cuidado')) veredicto = 'cuidado';
  return { veredicto, hallazgos, vacio: !t.trim() };
}
