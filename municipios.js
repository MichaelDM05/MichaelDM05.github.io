// RENAMU · Cargador de datos multi-año (carga diferida)
//
// Cada archivo municipios_YYYY.js pesa ~6.9 MB y define una constante global
// (municipios2021 ... municipios2025) con el detalle de las municipalidades
// encuestadas ese año (Módulo I: datos generales, Módulo II: equipamiento y TIC).
//
// Las páginas muestran un año a la vez, así que aquí el año se descarga bajo
// demanda inyectando su <script> sólo la primera vez que se pide. Se usa
// inyección de <script> y no fetch() para que el sitio siga funcionando al
// abrirlo directamente con file:// (fetch se bloquea por CORS en ese caso).

(function () {
    const ANIOS = [2021, 2022, 2023, 2024, 2025];
    const ANIO_POR_DEFECTO = 2025;

    const cache = {};    // anio -> array de municipalidades ya cargado
    const enVuelo = {};  // anio -> Promise en curso, para no pedir el mismo archivo dos veces

    // Los archivos de datos declaran `const municipios2025 = [...]`. Un const de
    // nivel superior vive en el ámbito léxico global y NO queda colgado de window,
    // así que hay que resolver el identificador; new Function() se evalúa en el
    // ámbito global y sí lo alcanza.
    function globalDelAnio(anio) {
        const nombre = 'municipios' + anio;
        try {
            return new Function('return typeof ' + nombre + ' !== "undefined" ? ' + nombre + ' : undefined;')();
        } catch (e) {
            return undefined;
        }
    }

    function cargar(anio) {
        anio = Number(anio);

        if (cache[anio]) return Promise.resolve(cache[anio]);
        if (enVuelo[anio]) return enVuelo[anio];

        // El archivo podría haberse incluido con un <script> en la página
        if (Array.isArray(globalDelAnio(anio))) {
            cache[anio] = globalDelAnio(anio);
            return Promise.resolve(cache[anio]);
        }

        enVuelo[anio] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'data/municipios_' + anio + '.js';
            script.async = true;
            script.onload = () => {
                const datos = globalDelAnio(anio);
                if (!Array.isArray(datos)) {
                    delete enVuelo[anio];
                    reject(new Error('El archivo del año ' + anio + ' no definió municipios' + anio));
                    return;
                }
                cache[anio] = datos;
                delete enVuelo[anio];
                resolve(datos);
            };
            script.onerror = () => {
                delete enVuelo[anio];
                reject(new Error('No se pudo descargar data/municipios_' + anio + '.js'));
            };
            document.head.appendChild(script);
        });

        return enVuelo[anio];
    }

    window.RENAMU = {
        anios: ANIOS.slice(),
        anioActual: ANIO_POR_DEFECTO,

        // Datos del año activo ya cargados (array vacío si todavía no llegaron)
        datos: function () {
            return cache[window.RENAMU.anioActual] || [];
        },

        // Cambia de año y resuelve con los datos de ese año
        setAnio: function (anio) {
            window.RENAMU.anioActual = Number(anio);
            return cargar(window.RENAMU.anioActual);
        },

        cargar: cargar,

        estaCargado: function (anio) {
            return Boolean(cache[Number(anio)]);
        }
    };
})();
