// RENAMU · Cargador de datos multi-año (carga diferida)
//
// Cada archivo municipios_YYYY.js pesa ~6.9 MB y define una constante global
// (municipios2021 ... municipios2025) con las 121 columnas de Módulo I y II de
// las municipalidades encuestadas ese año. Ese registro completo solo hace
// falta para las descargas de Datos (CSV/JSON), así que sigue cargándose bajo
// demanda tal como antes.
//
// Dashboard y Estadísticas, en cambio, solo usan 13 de esos 121 campos. Para
// evitar bajar ~6.9 MB apenas se abre la página, existe además una versión
// "ligera" por año (municipios_YYYY_lite.js, ~730 KB, variable municipiosYYYYLite)
// con solo esos 13 campos: eso es lo que consumen esas dos páginas.
//
// Ambas variantes se descargan inyectando un <script> (no fetch) para que el
// sitio siga funcionando al abrirse directamente con file:// (fetch se bloquea
// por CORS en ese caso).

(function () {
    const ANIOS = [2021, 2022, 2023, 2024, 2025];
    const ANIO_POR_DEFECTO = 2025;

    const cache = {};    // anio -> registro completo (121 campos) ya cargado
    const enVuelo = {};  // anio -> Promise en curso, para no pedir el mismo archivo dos veces

    const cacheLigero = {};
    const enVueloLigero = {};

    // Los archivos de datos declaran `const municipios2025 = [...]` (o
    // `...2025Lite` en la versión ligera). Un const de nivel superior vive en
    // el ámbito léxico global y NO queda colgado de window, así que hay que
    // resolver el identificador; new Function() se evalúa en el ámbito global
    // y sí lo alcanza.
    function resolverGlobal(nombre) {
        try {
            return new Function('return typeof ' + nombre + ' !== "undefined" ? ' + nombre + ' : undefined;')();
        } catch (e) {
            return undefined;
        }
    }

    function cargarArchivo(src, nombreVariable, cacheDestino, enVueloDestino, anio) {
        if (cacheDestino[anio]) return Promise.resolve(cacheDestino[anio]);
        if (enVueloDestino[anio]) return enVueloDestino[anio];

        // El archivo podría haberse incluido con un <script> en la página
        if (Array.isArray(resolverGlobal(nombreVariable))) {
            cacheDestino[anio] = resolverGlobal(nombreVariable);
            return Promise.resolve(cacheDestino[anio]);
        }

        enVueloDestino[anio] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                const datos = resolverGlobal(nombreVariable);
                if (!Array.isArray(datos)) {
                    delete enVueloDestino[anio];
                    reject(new Error(src + ' no definió ' + nombreVariable));
                    return;
                }
                cacheDestino[anio] = datos;
                delete enVueloDestino[anio];
                resolve(datos);
            };
            script.onerror = () => {
                delete enVueloDestino[anio];
                reject(new Error('No se pudo descargar ' + src));
            };
            document.head.appendChild(script);
        });

        return enVueloDestino[anio];
    }

    function cargar(anio) {
        anio = Number(anio);
        return cargarArchivo('data/municipios_' + anio + '.js', 'municipios' + anio, cache, enVuelo, anio);
    }

    function cargarLigero(anio) {
        anio = Number(anio);
        return cargarArchivo('data/municipios_' + anio + '_lite.js', 'municipios' + anio + 'Lite', cacheLigero, enVueloLigero, anio);
    }

    window.RENAMU = {
        anios: ANIOS.slice(),
        anioActual: ANIO_POR_DEFECTO,

        // Registro completo (121 campos) del año activo, ya cargado (Datos > Descargas)
        datos: function () {
            return cache[window.RENAMU.anioActual] || [];
        },

        // Versión ligera (13 campos) del año activo, ya cargada (Dashboard, Estadísticas)
        datosLigeros: function () {
            return cacheLigero[window.RENAMU.anioActual] || [];
        },

        // Cambia de año y resuelve con el registro completo de ese año
        setAnio: function (anio) {
            window.RENAMU.anioActual = Number(anio);
            return cargar(window.RENAMU.anioActual);
        },

        // Cambia de año y resuelve con la versión ligera de ese año
        setAnioLigero: function (anio) {
            window.RENAMU.anioActual = Number(anio);
            return cargarLigero(window.RENAMU.anioActual);
        },

        cargar: cargar,
        cargarLigero: cargarLigero,

        estaCargado: function (anio) {
            return Boolean(cache[Number(anio)]);
        }
    };
})();
