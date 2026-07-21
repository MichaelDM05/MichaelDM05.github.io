// RENAMU · Cargador de datos multi-año
// Cada archivo municipios_YYYY.js define una constante global
// (municipios2021 ... municipios2025) con el detalle de las
// municipalidades encuestadas ese año (Módulo I y II de RENAMU:
// datos generales y equipamiento/TIC). Este archivo los indexa
// y expone el año activo al resto de páginas.

(function () {
    const porAnio = {
        2021: typeof municipios2021 !== 'undefined' ? municipios2021 : [],
        2022: typeof municipios2022 !== 'undefined' ? municipios2022 : [],
        2023: typeof municipios2023 !== 'undefined' ? municipios2023 : [],
        2024: typeof municipios2024 !== 'undefined' ? municipios2024 : [],
        2025: typeof municipios2025 !== 'undefined' ? municipios2025 : []
    };

    const anioPorDefecto = 2025;

    window.RENAMU = {
        porAnio: porAnio,
        anios: Object.keys(porAnio).map(Number).sort(),
        anioActual: anioPorDefecto,
        datos: function () {
            return porAnio[window.RENAMU.anioActual] || [];
        },
        setAnio: function (anio) {
            window.RENAMU.anioActual = Number(anio);
        }
    };

    // Compatibilidad con código que use datosRENAMU directamente (año por defecto)
    window.datosRENAMU = porAnio[anioPorDefecto];
})();