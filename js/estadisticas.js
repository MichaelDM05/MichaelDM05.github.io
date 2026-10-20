// RENAMU · Estadísticas (comparativos entre años, no dependen del selector)

const ANIOS_MODULOS = [2021, 2022, 2023, 2024, 2025];
const MUNICIPALIDADES = ['municipalidad', 'municipalidades'];

const sumar = (campo) => (datos) => datos.reduce((s, d) => s + (Number(d[campo]) || 0), 0);
const contar = (condicion) => (datos) => datos.filter(condicion).length;

// Indicadores de una sola serie. `desfase` = 1 cuando la pregunta es
// retrospectiva: la encuesta del año X pregunta por el año X-1, así que la
// barra se etiqueta con (año de la encuesta − 1) aunque el dato salga de
// municipios_{X}_lite.js.
const INDICADORES = {
    muni: {
        icono: 'account_balance',
        titulo: 'Municipalidades registradas por año',
        badge: 'Serie homologada',
        sujeto: 'El padrón',
        unidad: MUNICIPALIDADES,
        valor: contar((d) => d.ubigeo !== null && d.ubigeo !== undefined && d.ubigeo !== ''),
        pie: 'Conteo de municipalidades por año (columna ubigeo) · RENAMU',
    },
    personal: {
        icono: 'groups',
        titulo: 'Personal municipal por año (al 31 de marzo)',
        badge: 'Módulo III',
        sujeto: 'El personal municipal',
        unidad: ['trabajador', 'trabajadores'],
        valor: sumar('personal_total_mar'),
        pie: 'Suma de personal total al 31 de marzo (P19M_T) · Módulo III · RENAMU',
    },
    locacion: {
        icono: 'receipt_long',
        titulo: 'Personal de Locación de Servicios por año',
        badge: 'Módulo III',
        sujeto: 'El personal por locación',
        unidad: ['persona', 'personas'],
        valor: sumar('personal_locacion_mar'),
        pie: 'Suma de personal de locación / orden de servicios al 31 de marzo (P19A_2_T) · Módulo III · RENAMU',
    },
    // Pregunta filtro: si la municipalidad respondió "No tiene", el campo queda
    // vacío en vez de 0, pero sumar() lo trata igual (Number(null)||0 = 0).
    discapacidad: {
        icono: 'accessible',
        titulo: 'Personal con discapacidad por año',
        badge: 'Módulo III',
        sujeto: 'El personal con discapacidad',
        unidad: ['trabajador', 'trabajadores'],
        valor: sumar('personal_discapacidad_mar'),
        pie: 'Suma de personal con discapacidad al 31 de marzo (P20_2_T) · Módulo III · RENAMU',
    },
    computadoras: {
        icono: 'computer',
        titulo: 'Computadoras operativas de las municipalidades',
        badge: 'Módulo II',
        sujeto: 'El parque de computadoras',
        unidad: ['computadora', 'computadoras'],
        anios: ANIOS_MODULOS,
        valor: sumar('pc_total_operativas'),
        pie: 'Perú: computadoras operativas de las municipalidades · Módulo II (P13A_T) · RENAMU',
    },
    internet: {
        icono: 'wifi',
        titulo: 'Municipalidades que cuentan con servicio de internet',
        badge: 'Módulo II',
        sujeto: 'La conectividad municipal',
        unidad: MUNICIPALIDADES,
        anios: ANIOS_MODULOS,
        valor: contar((d) => Number(d.pc_con_acceso_internet) > 0),
        pie: 'Perú: municipalidades que cuentan con servicio de internet · Módulo II (P14A_1) · RENAMU',
    },
    // P18_Portal con dato = tienen URL de su portal registrada. No se usa la
    // autoevaluación de P18 porque no siempre coincide con si cargaron una URL.
    pte: {
        icono: 'public',
        titulo: 'Municipalidades que tienen Portal de Transparencia Estándar (PTE)',
        badge: 'Módulo II',
        sujeto: 'La adopción del PTE',
        unidad: MUNICIPALIDADES,
        anios: ANIOS_MODULOS,
        valor: contar((d) => d.tiene_pte === 'Si'),
        pie: 'Perú: municipalidades que tienen Portal de Transparencia Estándar (PTE) · Módulo II (P18_Portal) · RENAMU',
    },
    // Al menos uno de los 16 instrumentos (P23_1 a P23_16; cada uno 1="Sí"/2="No").
    instrumentos: {
        icono: 'location_city',
        titulo: 'Municipalidades con instrumentos de gestión urbana y/o rural',
        badge: 'Módulo IV',
        sujeto: 'El uso de instrumentos de gestión',
        unidad: MUNICIPALIDADES,
        anios: ANIOS_MODULOS,
        valor: contar((d) => d.tiene_instrumentos_gestion === 'Si'),
        pie: 'Perú: municipalidades que disponen de instrumentos de gestión y desarrollo urbano y/o rural · Módulo IV (P23_1 a P23_16) · RENAMU',
    },
    tupa: {
        icono: 'description',
        titulo: 'Municipalidades con TUPA según Metodología de Determinación de Costos',
        badge: 'Módulo IV',
        sujeto: 'La adopción del TUPA por costos',
        unidad: MUNICIPALIDADES,
        valor: contar((d) => d.tiene_tupa_metodologia_costos === 'Si'),
        pie: 'Perú: municipalidades que tienen TUPA según metodología de determinación de costos · Módulo IV (P26) · RENAMU',
    },
    adminTributaria: {
        icono: 'badge',
        titulo: 'Municipalidades con personal exclusivo en Administración Tributaria',
        badge: 'Módulo IV',
        sujeto: 'La presencia de personal tributario',
        unidad: MUNICIPALIDADES,
        anios: ANIOS_MODULOS,
        valor: contar((d) => Number(d.personal_administracion_tributaria_mar) > 0),
        pie: 'Perú: municipalidades con personal exclusivo en el área de administración tributaria, al 31 de marzo · Módulo IV (P32_2_T) · RENAMU',
    },
    // P33A = 1 "Sí y depende de Adm. Tributaria" ó 2 "Sí y no depende"; se excluye 3 "No tiene".
    ejecucionCoactiva: {
        icono: 'gavel',
        titulo: 'Municipalidades que tienen Área de Ejecución Coactiva',
        badge: 'Módulo IV',
        sujeto: 'La presencia de áreas coactivas',
        unidad: MUNICIPALIDADES,
        anios: ANIOS_MODULOS,
        valor: contar((d) => d.tiene_area_ejecucion_coactiva === 'Si'),
        pie: 'Perú: municipalidades que tienen área de ejecución coactiva · Módulo IV (P33A: 1 y 2) · RENAMU',
    },
    licencias: {
        icono: 'storefront',
        titulo: 'Licencias de funcionamiento otorgadas',
        badge: 'Módulo IV',
        sujeto: 'El otorgamiento de licencias',
        unidad: ['licencia', 'licencias'],
        anios: ANIOS_MODULOS,
        desfase: 1,
        valor: sumar('licencias_funcionamiento_total'),
        pie: 'Perú: licencias de funcionamiento otorgadas para establecimientos · Módulo IV (P34A_1 a P34A_31) · RENAMU',
    },
    demuna: {
        icono: 'child_care',
        titulo: 'Casos atendidos de la DEMUNA',
        badge: 'Módulo V',
        sujeto: 'La atención de casos',
        unidad: ['caso', 'casos'],
        anios: ANIOS_MODULOS,
        desfase: 1,
        valor: sumar('casos_demuna_total'),
        pie: 'Número de casos atendidos de la DEMUNA · Módulo V (P64_1_1 a P64_19_1) · RENAMU',
    },
    // Esta pregunta sí corresponde al año de la encuesta (sin desfase).
    salud: {
        icono: 'local_hospital',
        titulo: 'Municipalidades que administran establecimientos de salud',
        badge: 'Módulo V',
        sujeto: 'La gestión municipal de salud',
        unidad: MUNICIPALIDADES,
        valor: contar((d) => d.administra_establecimientos_salud === 'Si'),
        pie: 'Municipalidades que administran establecimientos de salud · Módulo V (P66_1_1 a P66_10_1) · RENAMU',
    },
};

// Paleta categórica de tonos bien separados en matiz (azul, verde-azulado,
// ámbar) para que se distingan entre sí incluso con daltonismo.
const SERIES_REGIMEN = [
    { campo: 'personal_276_mar', etiqueta: 'Decreto Legislativo N° 276', corto: 'D. Leg. 276', color: '#5B9BF0' },
    { campo: 'personal_728_mar', etiqueta: 'Decreto Legislativo N° 728', corto: 'D. Leg. 728', color: '#3CC4B0' },
    { campo: 'personal_cas_mar', etiqueta: 'Contrato Administrativo de Servicios (CAS)', corto: 'CAS', color: '#F2B04E' },
];

const SERIES_MAQUINARIA = [
    { etiqueta: 'Total', corto: 'Total', color: '#A9BCD0' },
    { etiqueta: 'Operativo', corto: 'Operativo', color: '#4FC3E8' },
    { etiqueta: 'No operativo', corto: 'No operativo', color: '#F27C7C' },
];

const INDICADORES_MULTIPLES = {
    regimen: {
        icono: 'work',
        titulo: 'Personal municipal por régimen laboral y año',
        badge: 'Módulo III',
        pie: 'Personal al 31 de marzo por régimen laboral (Módulo III, P19M) · RENAMU',
        calcular: (listas) => SERIES_REGIMEN.map((s) => ({ ...s, valores: listas.map(sumar(s.campo)) })),
        resumen: resumenRegimen,
    },
    maquinaria: {
        icono: 'agriculture',
        titulo: 'Municipalidades que tienen maquinaria pesada',
        badge: 'Módulo II',
        anios: ANIOS_MODULOS,
        pie: 'Perú: municipalidades que tienen maquinaria pesada · Módulo II (P11B) · RENAMU',
        porcentaje: true,
        // "No operativo" no viene precalculado: es la diferencia Total - Operativo
        calcular: (listas) => {
            const totales = listas.map(sumar('maquinaria_total'));
            const operativas = listas.map(sumar('maquinaria_operativa'));
            return [totales, operativas, totales.map((t, i) => t - operativas[i])]
                .map((valores, i) => ({ ...SERIES_MAQUINARIA[i], valores }));
        },
        resumen: resumenMaquinaria,
    },
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-indicador]').forEach((art) => {
        const clave = art.dataset.indicador;
        if (INDICADORES[clave]) crearIndicador(art, clave, INDICADORES[clave]);
        else if (INDICADORES_MULTIPLES[clave]) crearIndicadorMultiple(art, clave, INDICADORES_MULTIPLES[clave]);
    });
    resaltarTemaActivo();
});

function resaltarTemaActivo() {
    const enlaces = [...document.querySelectorAll('.stats-nav a')];
    if (!enlaces.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entradas) => {
        entradas.filter((e) => e.isIntersecting).forEach((e) => {
            enlaces.forEach((a) => {
                const activo = a.getAttribute('href') === '#' + e.target.id;
                a.classList.toggle('active', activo);
                if (activo) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.stats-tema').forEach((t) => observer.observe(t));
}

/* ---------- Formato ---------- */

function conSigno(n, formato) {
    formato = formato || numeroPE;
    if (n > 0) return '+' + formato(n);
    if (n < 0) return '−' + formato(Math.abs(n));
    return formato(0);
}

function porcentaje(n) {
    return decimalPE(Math.round(n * 10) / 10, 1) + '%';
}

function ejeCorto(v) {
    if (v >= 1e6) return decimalPE(v / 1e6, v % 1e6 ? 1 : 0) + ' M';
    if (v >= 1e4) return numeroPE(Math.round(v / 1e3)) + ' mil';
    return numeroPE(v);
}

function pasoRedondo(x) {
    const base = Math.pow(10, Math.floor(Math.log10(x)));
    return [1, 2, 5, 10].map((m) => m * base).find((p) => p >= x);
}

function claseSigno(n) {
    return n > 0 ? 'is-up' : n < 0 ? 'is-down' : '';
}

/* ---------- Estructura común de la tarjeta ---------- */

function armarTarjeta(art, clave, cfg, etiquetas, accionExtra) {
    const idTitulo = 'serie-' + clave + '-titulo';
    art.setAttribute('aria-labelledby', idTitulo);
    const rango = `${etiquetas[0]}&#8288;–&#8288;${etiquetas[etiquetas.length - 1]}`;
    art.innerHTML = `
        <header class="serie-head">
            <div class="serie-icon" aria-hidden="true"><span class="material-icons">${cfg.icono}</span></div>
            <div class="serie-titles">
                <p class="serie-eyebrow">Serie histórica · ${rango}</p>
                <h3 id="${idTitulo}">${escaparHtml(cfg.titulo)}</h3>
            </div>
            <div class="serie-head-actions">
                ${accionExtra || ''}
                <button class="serie-download" type="button" data-rol="csv" disabled title="Descargar los datos en CSV">
                    <span class="material-icons" aria-hidden="true">download</span>CSV
                </button>
                <span class="serie-badge"><span class="serie-badge-dot" aria-hidden="true"></span>${escaparHtml(cfg.badge)}</span>
            </div>
        </header>
        <dl class="serie-kpis" data-rol="kpis">
            ${'<div class="serie-kpi"><dt>&nbsp;</dt><dd>—</dd></div>'.repeat(3)}
        </dl>
        <div class="serie-body">
            <div class="serie-chart-wrap">
                <ul class="serie-legend" data-rol="leyenda"></ul>
                <div class="serie-chart" data-rol="grafico">
                    <p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>
                </div>
                <p class="serie-foot">${escaparHtml(cfg.pie)} ${rango}</p>
            </div>
            <aside class="serie-insight" aria-live="polite">
                <p class="serie-insight-eyebrow">Lectura rápida</p>
                <h4 data-rol="lectura-titulo">Calculando…</h4>
                <p class="serie-insight-text" data-rol="lectura-texto"></p>
                <div class="serie-insight-metric">
                    <span data-rol="metrica-etiqueta">Variación acumulada</span>
                    <strong data-rol="metrica">—</strong>
                </div>
                <ol class="serie-timeline" data-rol="timeline"></ol>
                <p class="serie-source">Fuente: Registro Nacional de Municipalidades, INEI.</p>
            </aside>
        </div>`;
    return (rol) => art.querySelector(`[data-rol="${rol}"]`);
}

function mostrarError(q, err) {
    q('grafico').innerHTML = `<p class="chart-state"><span class="material-icons" aria-hidden="true">error_outline</span>
        No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
    q('lectura-titulo').textContent = 'Datos no disponibles';
}

// CSV con punto y coma y BOM para que Excel en español lo abra con tildes y columnas correctas.
function habilitarCsv(q, clave, filas) {
    const btn = q('csv');
    const campo = (v) => /[";\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    btn.disabled = false;
    btn.addEventListener('click', () => {
        const csv = '\uFEFF' + filas.map((f) => f.map(campo).join(';')).join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `renamu_${clave}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function pintarResumen(clave, serie) {
    const tile = document.querySelector(`[data-resumen="${clave}"]`);
    if (!tile) return;
    const inicio = serie[0], fin = serie[serie.length - 1];
    const pct = inicio.valor ? ((fin.valor - inicio.valor) / inicio.valor) * 100 : 0;
    tile.querySelector('.resumen-valor').textContent = numeroPE(fin.valor);
    const cambio = tile.querySelector('.resumen-cambio');
    cambio.textContent = `${conSigno(pct, porcentaje)} entre ${inicio.anio} y ${fin.anio}`;
    cambio.className = 'resumen-cambio ' + claseSigno(pct);
}

function pintarKpis(q, kpis) {
    q('kpis').innerHTML = kpis.map((k) => `
        <div class="serie-kpi">
            <dt>${k.etiqueta}</dt>
            <dd class="${k.clase || ''}">${escaparHtml(k.valor)}${k.detalle ? `<small>${escaparHtml(k.detalle)}</small>` : ''}</dd>
        </div>`).join('');
}

function pintarLectura(q, { titulo, texto, metricaEtiqueta, metrica, metricaClase }) {
    q('lectura-titulo').textContent = titulo;
    q('lectura-texto').textContent = texto;
    if (metricaEtiqueta) q('metrica-etiqueta').textContent = metricaEtiqueta;
    const m = q('metrica');
    m.textContent = metrica;
    m.className = metricaClase || '';
}

// Eje Y: se recorta cuando la variación es pequeña frente al valor (si no, las
// diferencias serían invisibles); en los demás casos parte de cero.
function escalaY(valores, recortable) {
    const min = Math.min(...valores), max = Math.max(...valores, 1);
    if (recortable && (max - min) / max < 0.15) {
        const paso = pasoRedondo(Math.max(max - min, 10) / 3);
        const lo = Math.max(0, Math.floor(min / paso) * paso - paso);
        let hi = Math.ceil(max / paso) * paso;
        if (hi - max < paso * 0.3) hi += paso;
        return { lo, hi, paso, recortado: lo > 0 };
    }
    const paso = pasoRedondo(max / 4);
    let hi = Math.ceil(max / paso) * paso;
    if (hi - max < paso * 0.3) hi += paso;
    return { lo: 0, hi, paso, recortado: false };
}

function plotHTML(escala, columnasHTML, xEtiquetas, extraArea, formatoEje) {
    const { lo, hi, paso } = escala;
    const pct = (v) => ((v - lo) / (hi - lo)) * 100;
    const ticks = [];
    for (let t = lo; t <= hi + paso / 2; t += paso) ticks.push(t);
    return `
        <div class="serie-plot">
            <div class="serie-yaxis" aria-hidden="true">
                ${ticks.map((t) => `<span style="bottom:${pct(t)}%">${(formatoEje || ejeCorto)(t)}</span>`).join('')}
            </div>
            <div class="serie-area">
                ${ticks.map((t) => `<span class="serie-grid" style="bottom:${pct(t)}%" aria-hidden="true"></span>`).join('')}
                ${extraArea || ''}
                <div class="serie-cols">${columnasHTML}</div>
                <div class="serie-tooltip" role="tooltip" hidden></div>
            </div>
        </div>
        <div class="serie-xaxis" aria-hidden="true">${xEtiquetas.map((e) => `<span>${escaparHtml(e)}</span>`).join('')}</div>`;
}

function conectarTooltip(cont, contenido) {
    const area = cont.querySelector('.serie-area');
    const tooltip = cont.querySelector('.serie-tooltip');
    const cols = cont.querySelectorAll('.serie-col');

    const mostrar = (col) => {
        tooltip.innerHTML = contenido(Number(col.dataset.i));
        tooltip.hidden = false;
        cols.forEach((c) => c.classList.toggle('is-active', c === col));

        const marca = col.querySelector('.serie-mark');
        const alto = Math.max(...[...col.querySelectorAll('.serie-bar')].map((b) => b.offsetHeight));
        const izq = col.offsetLeft + (col.offsetWidth - marca.offsetWidth) / 2;
        let left = izq + marca.offsetWidth + 10;
        if (left + tooltip.offsetWidth > area.clientWidth) left = izq - tooltip.offsetWidth - 10;
        tooltip.style.left = Math.max(0, left) + 'px';
        tooltip.style.top = Math.max(0, Math.min(area.clientHeight - alto - 10, area.clientHeight - tooltip.offsetHeight)) + 'px';
    };
    const ocultar = () => {
        tooltip.hidden = true;
        cols.forEach((c) => c.classList.remove('is-active'));
    };
    cols.forEach((col) => {
        col.addEventListener('mouseenter', () => mostrar(col));
        col.addEventListener('focus', () => mostrar(col));
        col.addEventListener('mouseleave', ocultar);
        col.addEventListener('blur', ocultar);
    });
}

/* ---------- Indicadores de una sola serie ---------- */

function crearIndicador(art, clave, cfg) {
    const anios = cfg.anios || window.RENAMU.anios;
    const etiquetas = anios.map((a) => String(a - (cfg.desfase || 0)));
    const q = armarTarjeta(art, clave, cfg, etiquetas);

    Promise.all(anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listas) => {
            const serie = listas.map((datos, i) => ({ anio: etiquetas[i], valor: cfg.valor(datos) }));
            renderSerie(q, cfg, serie);
            pintarResumen(clave, serie);
            habilitarCsv(q, clave, [['Año', cfg.titulo], ...serie.map((p) => [p.anio, p.valor])]);
        })
        .catch((err) => mostrarError(q, err));
}

function renderSerie(q, cfg, serie) {
    const unidad = (n) => cfg.unidad[Math.abs(n) === 1 ? 0 : 1];
    const cantidad = (n) => `${numeroPE(Math.abs(n))} ${unidad(n)}`;

    serie.forEach((p, i) => { p.delta = i > 0 ? p.valor - serie[i - 1].valor : 0; });
    const cambios = serie.filter((p) => p.delta !== 0);
    const primerCambio = cambios.length ? serie.indexOf(cambios[0]) : serie.length;
    const destacado = cambios.reduce((a, p) => (Math.abs(p.delta) > Math.abs(a.delta) ? p : a), cambios[0]);
    serie.forEach((p, i) => {
        p.tipo = p === destacado ? 'cambio' : (i < primerCambio && cambios.length ? 'base' : 'consolidado');
    });

    const inicio = serie[0], fin = serie[serie.length - 1];
    const variacion = fin.valor - inicio.valor;
    const pctVar = inicio.valor ? (variacion / inicio.valor) * 100 : null;
    const ultimo = cambios[cambios.length - 1];
    const unico = cambios.length === 1;

    pintarKpis(q, [
        { etiqueta: 'Valor actual', valor: numeroPE(fin.valor) },
        {
            etiqueta: `Variación ${inicio.anio}&#8288;–&#8288;${fin.anio}`,
            valor: conSigno(variacion),
            clase: claseSigno(variacion),
            detalle: pctVar !== null && !unico ? conSigno(pctVar, porcentaje) : '',
        },
        unico || !cambios.length
            ? { etiqueta: 'Último cambio', valor: ultimo ? ultimo.anio : 'Sin cambios' }
            : { etiqueta: 'Mayor variación', valor: destacado.anio, detalle: `${conSigno(destacado.delta)} vs. año anterior` },
    ]);

    // Leyenda
    const ultimoBase = serie[Math.max(primerCambio - 1, 0)].anio;
    const etiquetaDestacado = unico
        ? `${destacado.delta > 0 ? 'Incremento' : 'Disminución'} en ${destacado.anio}`
        : `Mayor variación (${destacado ? destacado.anio : ''})`;
    const soloTrasCambio = serie.every((p) => p.tipo !== 'consolidado' || p.delta === 0);
    const leyenda = [
        ['base', ultimoBase === inicio.anio ? `Base ${inicio.anio}` : `Base ${inicio.anio}–${ultimoBase}`],
        ['cambio', etiquetaDestacado],
        ['consolidado', !cambios.length ? 'Nivel estable' : soloTrasCambio ? 'Nivel consolidado' : 'Otros años'],
    ].filter(([tipo]) => serie.some((p) => p.tipo === tipo));
    q('leyenda').innerHTML = leyenda.map(([tipo, texto]) =>
        `<li><span class="serie-swatch is-${tipo}" aria-hidden="true"></span>${escaparHtml(texto)}</li>`
    ).join('');

    // Gráfico
    const escala = escalaY(serie.map((p) => p.valor), true);
    const etiquetaBarra = compactoBarra(Math.max(...serie.map((p) => p.valor)));
    const pct = (v) => ((v - escala.lo) / (escala.hi - escala.lo)) * 100;
    const columnas = serie.map((p, i) => `
        <div class="serie-col is-${p.tipo}" tabindex="0" data-i="${i}"
             aria-label="${p.anio}: ${cantidad(p.valor)}${p.delta ? `, ${conSigno(p.delta)} respecto al año anterior` : ''}">
            <div class="serie-bar serie-mark" style="height:${Math.max(pct(p.valor), 0.5)}%">
                <span class="serie-bar-label">
                    <span class="serie-bar-value">${etiquetaBarra(p.valor)}</span>
                    ${p.tipo === 'cambio' ? `<span class="serie-pill ${claseSigno(p.delta)}">${conSigno(p.delta, etiquetaBarra)}</span>` : ''}
                </span>
            </div>
        </div>`).join('');
    const baseline = escala.recortado
        ? `<span class="serie-baseline" style="bottom:${pct(inicio.valor)}%" aria-hidden="true"></span>` : '';
    const cont = q('grafico');
    cont.innerHTML = plotHTML(escala, columnas, serie.map((p) => p.anio), baseline);

    conectarTooltip(cont, (i) => {
        const p = serie[i];
        const comparacion = p.delta
            ? `<p class="serie-tooltip-delta ${claseSigno(p.delta)}">${conSigno(p.delta)} respecto al año anterior</p>`
            : `<p class="serie-tooltip-delta">${i === 0 ? 'Año base de la serie' : 'Sin cambio respecto al año anterior'}</p>`;
        return `
            <p class="serie-tooltip-year">${p.anio}</p>
            <p class="serie-tooltip-value is-${p.tipo}">${numeroPE(p.valor)}</p>
            <p class="serie-tooltip-unit">${unidad(p.valor)}</p>
            ${comparacion}`;
    });

    // Lectura rápida
    const S = cfg.sujeto;
    let titulo, texto;
    if (!cambios.length) {
        titulo = `${S} se mantuvo estable`;
        texto = `Entre ${inicio.anio} y ${fin.anio} el registro se mantuvo en ${cantidad(fin.valor)}.`;
    } else if (unico && ultimo !== fin) {
        const d = ultimo.delta;
        titulo = d > 0 ? `${S} creció y luego se estabilizó` : `${S} se redujo y luego se estabilizó`;
        texto = `En ${ultimo.anio} ${d > 0 ? 'se sumaron' : 'hubo'} ${cantidad(d)}${d > 0 ? '' : ' menos'}. ` +
            `Desde entonces, el registro se mantiene estable en ${cantidad(fin.valor)}.`;
    } else if (unico) {
        titulo = `${S} cambió en ${ultimo.anio}`;
        texto = `En ${ultimo.anio} el registro pasó de ${numeroPE(ultimo.valor - ultimo.delta)} a ${cantidad(ultimo.valor)}.`;
    } else {
        const deltas = serie.slice(1).map((p) => p.delta);
        if (deltas.every((d) => d >= 0)) titulo = `${S} creció de forma sostenida`;
        else if (deltas.every((d) => d <= 0)) titulo = `${S} cayó de forma sostenida`;
        else if (variacion > 0) titulo = `${S} creció con altibajos`;
        else if (variacion < 0) titulo = `${S} retrocedió con altibajos`;
        else titulo = `${S} volvió a su nivel inicial`;
        const previo = serie[serie.indexOf(destacado) - 1];
        texto = `Entre ${inicio.anio} y ${fin.anio} pasó de ${numeroPE(inicio.valor)} a ${cantidad(fin.valor)}. ` +
            `El mayor cambio fue en ${destacado.anio}: ${conSigno(destacado.delta)} respecto a ${previo.anio}.`;
    }
    pintarLectura(q, {
        titulo,
        texto,
        metrica: pctVar === null ? '—' : conSigno(pctVar, porcentaje),
        metricaClase: claseSigno(pctVar),
    });

    const hitos = serie.filter((p, i) => i === 0 || i === serie.length - 1 || p === destacado);
    q('timeline').innerHTML = hitos.map((p) =>
        `<li class="is-${p.tipo}"><span class="serie-timeline-dot" aria-hidden="true"></span>${p.anio}</li>`
    ).join('');
}

// Formato corto de las etiquetas sobre las barras según el mayor valor de la
// serie (p. ej. "188,1 mil"), igual para todas las barras de una tarjeta.
function compactoBarra(max) {
    if (max >= 1e6) return (v) => decimalPE(v / 1e6, 2) + ' M';
    if (max >= 1e5) return (v) => decimalPE(v / 1e3, 1) + ' mil';
    return numeroPE;
}

/* ---------- Indicadores de varias series (barras agrupadas) ---------- */

function crearIndicadorMultiple(art, clave, cfg) {
    const anios = cfg.anios || window.RENAMU.anios;
    const etiquetas = anios.map(String);
    const boton = cfg.porcentaje
        ? '<button class="chart-toggle-btn" type="button" title="Ver en porcentaje" aria-pressed="false">%</button>' : '';
    const q = armarTarjeta(art, clave, cfg, etiquetas, boton);
    q('timeline').remove();

    Promise.all(anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listas) => {
            const series = cfg.calcular(listas);
            habilitarCsv(q, clave, [['Año', ...series.map((s) => s.etiqueta)],
                ...etiquetas.map((anio, i) => [anio, ...series.map((s) => s.valores[i])])]);
            q('leyenda').innerHTML = series.map((s) =>
                `<li><span class="serie-swatch" style="background:${s.color}" aria-hidden="true"></span>${escaparHtml(s.etiqueta)}</li>`
            ).join('');
            const resumen = cfg.resumen(series, etiquetas);
            pintarKpis(q, resumen.kpis);
            pintarLectura(q, resumen.lectura);

            let enPorcentaje = false;
            const dibujar = () => renderAgrupado(q('grafico'), etiquetas, series, enPorcentaje);
            dibujar();

            const btn = art.querySelector('.chart-toggle-btn');
            if (btn) btn.addEventListener('click', () => {
                enPorcentaje = !enPorcentaje;
                btn.classList.toggle('active', enPorcentaje);
                btn.setAttribute('aria-pressed', String(enPorcentaje));
                dibujar();
            });
        })
        .catch((err) => mostrarError(q, err));
}

// En porcentaje, cada serie se expresa sobre la primera (el total) de su año.
function renderAgrupado(cont, etiquetas, series, enPorcentaje) {
    const totales = series[0].valores;
    const valor = (s, i) => (enPorcentaje ? (totales[i] ? (s.valores[i] / totales[i]) * 100 : 0) : s.valores[i]);
    const formato = enPorcentaje ? porcentaje : numeroPE;

    const escala = enPorcentaje
        ? { lo: 0, hi: 100, paso: 25 }
        : escalaY(series.flatMap((s) => s.valores), false);
    const pct = (v) => ((v - escala.lo) / (escala.hi - escala.lo)) * 100;

    const columnas = etiquetas.map((anio, i) => `
        <div class="serie-col" tabindex="0" data-i="${i}"
             aria-label="${anio}: ${series.map((s) => `${s.etiqueta} ${formato(valor(s, i))}`).join(', ')}">
            <div class="serie-group serie-mark">
                ${series.map((s) => `<div class="serie-bar" style="height:${Math.max(pct(valor(s, i)), 0.5)}%;background:${s.color}"></div>`).join('')}
            </div>
        </div>`).join('');
    cont.innerHTML = plotHTML(escala, columnas, etiquetas, '', enPorcentaje ? (t) => t + '%' : ejeCorto);

    conectarTooltip(cont, (i) => `
        <p class="serie-tooltip-year">${etiquetas[i]}</p>
        ${series.map((s) => `
            <p class="serie-tooltip-row">
                <span><span class="serie-swatch" style="background:${s.color}" aria-hidden="true"></span>${escaparHtml(s.corto)}</span>
                <strong>${formato(valor(s, i))}</strong>
            </p>`).join('')}`);
}

function resumenRegimen(series, etiquetas) {
    const n = etiquetas.length - 1;
    const a = etiquetas[0], b = etiquetas[n];
    const cambio = (s) => (s.valores[0] ? ((s.valores[n] - s.valores[0]) / s.valores[0]) * 100 : 0);
    const totalFin = series.reduce((acc, s) => acc + s.valores[n], 0);
    const mayor = series.reduce((x, s) => (s.valores[n] > x.valores[n] ? s : x));
    const crece = series.reduce((x, s) => (Math.abs(cambio(s)) > Math.abs(cambio(x)) ? s : x));
    const participacion = totalFin ? (mayor.valores[n] / totalFin) * 100 : 0;

    return {
        kpis: series.map((s) => ({
            etiqueta: `${escaparHtml(s.corto)} · ${b}`,
            valor: numeroPE(s.valores[n]),
            detalle: `${conSigno(cambio(s), porcentaje)} desde ${a}`,
        })),
        lectura: {
            titulo: `${mayor.corto} concentra la mayor parte del personal`,
            texto: `En ${b}, ${mayor.corto} reúne ${numeroPE(mayor.valores[n])} trabajadores. ` +
                `Entre ${a} y ${b}, ${crece.corto} es el régimen que más varió: ${conSigno(cambio(crece), porcentaje)}.`,
            metricaEtiqueta: `Participación de ${mayor.corto} en ${b}`,
            metrica: porcentaje(participacion),
        },
    };
}

function resumenMaquinaria(series, etiquetas) {
    const n = etiquetas.length - 1;
    const a = etiquetas[0], b = etiquetas[n];
    const [total, operativo, noOperativo] = series;
    const operatividad = (i) => (total.valores[i] ? (operativo.valores[i] / total.valores[i]) * 100 : 0);
    const diferencia = operatividad(n) - operatividad(0);

    return {
        kpis: [
            { etiqueta: `Total · ${b}`, valor: numeroPE(total.valores[n]), detalle: `${conSigno(total.valores[n] - total.valores[0])} desde ${a}` },
            { etiqueta: `Operativo · ${b}`, valor: numeroPE(operativo.valores[n]), detalle: `${porcentaje(operatividad(n))} del total` },
            { etiqueta: `No operativo · ${b}`, valor: numeroPE(noOperativo.valores[n]), detalle: `${porcentaje(100 - operatividad(n))} del total` },
        ],
        lectura: {
            titulo: `El ${porcentaje(operatividad(n))} de la maquinaria está operativa`,
            texto: `En ${b} estaban operativas ${numeroPE(operativo.valores[n])} de un total de ${numeroPE(total.valores[n])}. ` +
                `En ${a} la proporción era ${porcentaje(operatividad(0))}.`,
            metricaEtiqueta: `Cambio en operatividad ${a}–${b}`,
            metrica: conSigno(diferencia, (v) => decimalPE(Math.round(v * 10) / 10, 1) + ' pp'),
            metricaClase: claseSigno(diferencia),
        },
    };
}
