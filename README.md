# Piel · rutina facial

Web app instalable (PWA) para que Carlota siga su rutina facial y lleve el control: pasos de cada día, productos, escáner de códigos de barras, diario de granos y regla, plan de reintroducción y lista de la compra.

- Funciona sin conexión una vez instalada.
- Los datos se guardan solo en el móvil (localStorage). Sin cuentas ni servidores.
- Solo sale a internet para buscar un código en [Open Beauty Facts](https://world.openbeautyfacts.org).
- Las fotos se leen en el propio móvil con [Tesseract.js](https://github.com/naptha/tesseract.js) y no se guardan.
- El escáner usa [barcode-detector](https://github.com/Sec-ant/barcode-detector) (ZXing en WebAssembly), porque Safari en iPhone no trae lector propio.

## Instalar en iPhone

1. Abre la dirección de GitHub Pages en **Safari**.
2. Toca **Compartir** → **Añadir a pantalla de inicio**.
3. Ábrela una vez con internet para que descargue el escáner y el lector de fotos.

Los avisos van al Calendario del iPhone (Ajustes → «Añadir avisos al calendario»): una web app no puede avisar a una hora sin un servidor.

## Productos coreanos

No hay una base de datos abierta con los ingredientes de cada producto coreano. La app combina:

1. Sus productos ya cargados (los del chat de rutina).
2. Open Beauty Facts para lo que esté allí.
3. Foto de la lista de ingredientes (inglés, español o coreano) o pegarla desde YesStyle o INCIDecoder.
4. Un glosario coreano → INCI de los ingredientes más comunes (`inci.js`).

## Cambiar datos

- Productos, plan y reglas iniciales: `data.js` (solo se cargan la primera vez; después manda lo que haya en el móvil).
- Reglas de revisión de ingredientes y glosario coreano: `inci.js`.
- Al publicar cambios, sube el número de `CACHE` en `sw.js`.

## Licencias

Tesseract.js, tesseract.js-core y datos de idioma: Apache 2.0. barcode-detector y zxing-wasm: MIT (ver `vendor/`).
