// RENAMU · Estadísticas (agregados del año activo)

document.addEventListener('DOMContentLoaded', () => {
    poblarSelectorAnio();
    cambiarAnio(window.RENAMU.anioActual);
    crearGraficoMuniPorAnio();
    crearGraficoPersonalPorAnio();
    crearGraficoRegimenPorAnio();
    crearGraficoLocacionPorAnio();
    crearGraficoDiscapacidadPorAnio();
    crearGraficoMaquinariaPorAnio();
    crearGraficoComputadorasPorAnio();
    crearGraficoInternetPorAnio();
    crearGraficoPtePorAnio();
    crearGraficoInstrumentosPorAnio();
    crearGraficoTupaPorAnio();
    crearGraficoAdminTributariaPorAnio();
    crearGraficoEjecucionCoactivaPorAnio();
    crearGraficoLicenciasPorAnio();
    crearGraficoDemunaPorAnio();
    crearGraficoSaludPorAnio();

    document.getElementById('filtroAnio').addEventListener('change', (e) => cambiarAnio(e.target.value));
});

function poblarSelectorAnio() {
    const select = document.getElementById('filtroAnio');
    select.innerHTML = window.RENAMU.anios.map((a) =>
        `<option value="${a}" ${a === window.RENAMU.anioActual ? 'selected' : ''}>${a}</option>`
    ).join('');
}

const CONTENEDORES = [
    'chartDeptos', 'chartPCs', 'resumenTipos', 'topPCs', 'tiposConexion', 'resumenSexo',
    'chartPersonal', 'resumenInstrumentos', 'frecuenciaResiduos', 'coberturaResiduos'
];

function cambiarAnio(anio) {
    document.getElementById('anioLabel').textContent = anio;
    marcarCargando();

    window.RENAMU.setAnioLigero(anio)
        .then(renderTodo)
        .catch((err) => {
            CONTENEDORES.forEach((id) => {
                document.getElementById(id).innerHTML =
                    `<p class="chart-state"><span class="material-icons">error_outline</span>
                     No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
            });
            document.querySelectorAll('.stat-item-number').forEach((el) => {
                el.classList.remove('is-loading');
                el.textContent = '—';
            });
        });
}

function marcarCargando() {
    document.querySelectorAll('.stat-item-number').forEach((el) => el.classList.add('is-loading'));
    CONTENEDORES.forEach((id) => {
        document.getElementById(id).innerHTML =
            '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';
    });
}

function renderTodo() {
    actualizarEstadisticas();
    crearGraficoDepartamentos();
    crearGraficoPCs();
    crearResumenTipos();
    crearTopPCs();
    crearTiposConexion();
    crearResumenSexo();
    crearGraficoPersonal();
    crearResumenInstrumentos();
    crearFrecuenciaResiduos();
    crearCoberturaResiduos();
}

function actualizarEstadisticas() {
    const datos = window.RENAMU.datosLigeros();
    const total = datos.length;

    const set = (id, valor) => {
        const el = document.getElementById(id);
        el.classList.remove('is-loading');
        el.textContent = valor;
    };

    if (!total) {
        ['totalMuni', 'totalPCs', 'pctInternet', 'pctPortal'].forEach((id) => set(id, '—'));
        return;
    }

    set('totalMuni', numeroPE(total));
    set('totalPCs', numeroPE(datos.reduce((s, d) => s + (Number(d.pc_total_operativas) || 0), 0)));

    const conInternet = datos.filter((d) => Number(d.pc_con_acceso_internet) > 0).length;
    set('pctInternet', Math.round((conInternet / total) * 100) + '%');

    const conPortal = datos.filter((d) => d.tiene_portal_transparencia === 'Si').length;
    set('pctPortal', Math.round((conPortal / total) * 100) + '%');
}

// Barras horizontales: el nombre completo del departamento cabe y se lee en móvil,
// a diferencia de las barras verticales con la abreviatura de 3 letras.
function renderBarras(contenedorId, filas, sufijo) {
    const cont = document.getElementById(contenedorId);

    if (!filas.length) {
        cont.innerHTML = '<p class="chart-state">Sin datos para este año.</p>';
        return;
    }

    const max = filas[0][1] || 1;
    cont.innerHTML = filas.map(([nombre, valor]) => `
        <div class="hbar-row">
            <div class="hbar-name" title="${escaparHtml(tituloCaso(nombre))}">${escaparHtml(tituloCaso(nombre))}</div>
            <div class="hbar-track">
                <div class="hbar-fill" style="width:${Math.max((valor / max) * 100, 1.5)}%"></div>
            </div>
            <div class="hbar-value">${numeroPE(valor)}${sufijo || ''}</div>
        </div>
    `).join('');
}

// Comparativo entre todos los años (no depende del selector): carga la versión
// ligera de cada año y cuenta filas con ubigeo válido, una municipalidad por fila.
function crearGraficoMuniPorAnio() {
    const cont = document.getElementById('chartMuniPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(window.RENAMU.anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = window.RENAMU.anios.map((anio, i) => {
                const conteo = listasPorAnio[i].filter((d) => d.ubigeo !== null && d.ubigeo !== undefined && d.ubigeo !== '').length;
                return [anio, conteo];
            });
            renderBarrasVerticales('chartMuniPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo entre todos los años (no depende del selector): suma el personal
// municipal al 31 de marzo (P19M_T, Módulo III) de cada año.
function crearGraficoPersonalPorAnio() {
    const cont = document.getElementById('chartPersonalPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(window.RENAMU.anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = window.RENAMU.anios.map((anio, i) => {
                const total = listasPorAnio[i].reduce((s, d) => s + (Number(d.personal_total_mar) || 0), 0);
                return [anio, total];
            });
            renderBarrasVerticales('chartPersonalPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo entre todos los años (no depende del selector): suma el personal
// de Locación / Orden de Servicios al 31 de marzo (P19A_2_T, Módulo III) de cada año.
function crearGraficoLocacionPorAnio() {
    const cont = document.getElementById('chartLocacionPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(window.RENAMU.anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = window.RENAMU.anios.map((anio, i) => {
                const total = listasPorAnio[i].reduce((s, d) => s + (Number(d.personal_locacion_mar) || 0), 0);
                return [anio, total];
            });
            renderBarrasVerticales('chartLocacionPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo entre todos los años (no depende del selector): suma el personal
// con discapacidad al 31 de marzo (P20_2_T, Módulo III) de cada año. Es una
// pregunta filtro: si la municipalidad respondió "No tiene", el campo queda
// vacío en vez de 0, pero el reduce ya lo trata igual (Number(null)||0 = 0).
function crearGraficoDiscapacidadPorAnio() {
    const cont = document.getElementById('chartDiscapacidadPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(window.RENAMU.anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = window.RENAMU.anios.map((anio, i) => {
                const total = listasPorAnio[i].reduce((s, d) => s + (Number(d.personal_discapacidad_mar) || 0), 0);
                return [anio, total];
            });
            renderBarrasVerticales('chartDiscapacidadPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo entre todos los años (no depende del selector): personal al 31 de
// marzo por régimen laboral (Módulo III, pregunta 19). Cada serie ya viene
// pre-sumada en el archivo ligero: personal_276_mar (Nombrado+Contratado del
// D.Leg. 276), personal_728_mar (D.Leg. 728) y personal_cas_mar (CAS).
// Paleta categórica: se separan los 3 tonos lo más posible en matiz (azul,
// verde-azulado, ámbar) en vez de azul+cian —dos azules contiguos— siguiendo
// la guía de Carbon Design System de maximizar el contraste entre colores
// vecinos de una paleta categórica para que se distingan incluso con daltonismo.
const SERIES_REGIMEN = [
    { campo: 'personal_276_mar', etiqueta: 'Decreto Legislativo N° 276', color: 'var(--blue)' },
    { campo: 'personal_728_mar', etiqueta: 'Decreto Legislativo N° 728', color: '#0E7C7B' },
    { campo: 'personal_cas_mar', etiqueta: 'Contrato Administrativo de Servicios (CAS)', color: '#A6720B' }
];

function crearGraficoRegimenPorAnio() {
    const svg = document.getElementById('chartRegimenPorAnio');
    const leyenda = document.getElementById('leyendaRegimenPorAnio');
    if (!svg || !leyenda) return;

    leyenda.innerHTML = SERIES_REGIMEN.map((s) => `
        <li><span class="swatch" style="background:${s.color}"></span>${escaparHtml(s.etiqueta)}</li>
    `).join('');

    Promise.all(window.RENAMU.anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const series = SERIES_REGIMEN.map((s) => ({
                ...s,
                valores: listasPorAnio.map((datos) => datos.reduce((acc, d) => acc + (Number(d[s.campo]) || 0), 0))
            }));
            renderGroupedBarChart(svg, window.RENAMU.anios, series);
        })
        .catch((err) => {
            svg.innerHTML = '';
            leyenda.innerHTML = `<li>No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</li>`;
        });
}

// SVG de barras agrupadas: un grupo de 3 barras (una por régimen) por año.
// Comparado con un gráfico de líneas, cada valor tiene su propio espacio
// horizontal, así que las etiquetas nunca se superponen aunque dos regímenes
// tengan cifras parecidas en el mismo año.
function renderGroupedBarChart(svg, etiquetasX, series, formatoValor) {
    formatoValor = formatoValor || ((v) => numeroPE(Math.round(v)));
    const W = 640, H = 300;
    const padL = 52, padR = 16, padTop = 34, padBottom = 32;
    const plotW = W - padL - padR;
    const plotH = H - padTop - padBottom;

    const maxDato = Math.max(1, ...series.flatMap((s) => s.valores));
    const max = maxDato * 1.15; // aire arriba para que la etiqueta de la barra más alta no se corte
    const n = etiquetasX.length;
    const y = (valor) => padTop + plotH - (valor / max) * plotH;
    const alto = (valor) => (valor / max) * plotH;

    // Cada año ocupa un mismo ancho de grupo; dentro del grupo, las 3 barras
    // van una al lado de la otra con un pequeño espacio entre ellas.
    const anchoGrupo = plotW / n;
    const paddingGrupo = anchoGrupo * 0.05;
    const anchoUtil = anchoGrupo - paddingGrupo * 2;
    const espacioBarra = 1;
    const anchoBarra = (anchoUtil - espacioBarra * (series.length - 1)) / series.length;

    // Grilla de referencia: 5 niveles (0%, 25%, 50%, 75%, 100% del máximo)
    const niveles = [0, 0.25, 0.5, 0.75, 1];
    const grilla = niveles.map((f) => {
        const valor = maxDato * f;
        const yy = y(valor);
        return `
            <line class="line-grid" x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}"></line>
            <text class="line-axis-label line-axis-label--y" x="${padL - 8}" y="${yy}">${formatoValor(valor)}</text>`;
    }).join('');

    const barras = etiquetasX.map((anio, i) => {
        const xGrupo = padL + i * anchoGrupo + paddingGrupo;
        return series.map((s, idxSerie) => {
            const v = s.valores[i];
            const xBarra = xGrupo + idxSerie * (anchoBarra + espacioBarra);
            const yBarra = y(v);
            return `
                <rect class="bar-rect" x="${xBarra}" y="${yBarra}" width="${anchoBarra}" height="${alto(v)}" rx="3" style="fill:${s.color}">
                    <title>${escaparHtml(s.etiqueta)} · ${anio}: ${formatoValor(v)}</title>
                </rect>
                <text class="line-value-label" x="${xBarra + anchoBarra / 2}" y="${yBarra - 6}" style="fill:${s.color};font-size:9.5px;font-weight:700">${formatoValor(v)}</text>`;
        }).join('');
    }).join('');

    const etiquetasEjeX = etiquetasX.map((anio, i) => {
        const xCentro = padL + i * anchoGrupo + anchoGrupo / 2;
        return `<text class="line-axis-label" x="${xCentro}" y="${H - 8}">${anio}</text>`;
    }).join('');

    svg.innerHTML = grilla + barras + etiquetasEjeX;
}

// Años usados por las tarjetas "por año" de Módulo II/IV que antes mostraban
// solo 2022-2025 (maquinaria pesada, computadoras, internet, PTE,
// instrumentos de gestión, administración tributaria, ejecución coactiva).
// Se agregó 2021 a pedido: el dato existe para los 7 indicadores.
const ANIOS_MAQUINARIA = [2021, 2022, 2023, 2024, 2025];

const SERIES_MAQUINARIA = [
    { campo: 'maquinaria_total', etiqueta: 'Total', color: 'var(--navy)' },
    { campo: 'maquinaria_operativa', etiqueta: 'Operativo', color: 'var(--blue)' },
    { campo: 'maquinaria_no_operativa', etiqueta: 'No operativo', color: '#C22B2B' }
];

// Guarda los valores absolutos ya calculados para poder alternar a porcentaje
// sin volver a leer los archivos ligeros.
let datosMaquinariaPorAnio = null;
let modoMaquinaria = 'absoluto'; // 'absoluto' | 'porcentaje'

function crearGraficoMaquinariaPorAnio() {
    const svg = document.getElementById('chartMaquinariaPorAnio');
    const leyenda = document.getElementById('leyendaMaquinariaPorAnio');
    const boton = document.getElementById('btnPorcentajeMaquinaria');
    if (!svg || !leyenda) return;

    leyenda.innerHTML = SERIES_MAQUINARIA.map((s) => `
        <li><span class="swatch" style="background:${s.color}"></span>${escaparHtml(s.etiqueta)}</li>
    `).join('');

    if (boton) boton.addEventListener('click', () => {
        modoMaquinaria = modoMaquinaria === 'absoluto' ? 'porcentaje' : 'absoluto';
        boton.classList.toggle('active', modoMaquinaria === 'porcentaje');
        boton.setAttribute('aria-pressed', String(modoMaquinaria === 'porcentaje'));
        renderGraficoMaquinaria();
    });

    Promise.all(ANIOS_MAQUINARIA.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            // "No operativo" no viene precalculado: es la diferencia Total - Operativo
            const totales = listasPorAnio.map((datos) => datos.reduce((s, d) => s + (Number(d.maquinaria_total) || 0), 0));
            const operativas = listasPorAnio.map((datos) => datos.reduce((s, d) => s + (Number(d.maquinaria_operativa) || 0), 0));
            const noOperativas = totales.map((t, i) => t - operativas[i]);

            datosMaquinariaPorAnio = { totales, operativas, noOperativas };
            renderGraficoMaquinaria();
        })
        .catch((err) => {
            svg.innerHTML = '';
            leyenda.innerHTML = `<li>No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</li>`;
        });
}

// Dibuja el gráfico con los datos ya cargados, en valor absoluto o en
// porcentaje sobre el total de cada año (Total siempre queda en 100%).
function renderGraficoMaquinaria() {
    const svg = document.getElementById('chartMaquinariaPorAnio');
    if (!svg || !datosMaquinariaPorAnio) return;

    const { totales, operativas, noOperativas } = datosMaquinariaPorAnio;

    let valoresPorCampo, formatoValor;
    if (modoMaquinaria === 'porcentaje') {
        const pct = (parte, total) => (total ? (parte / total) * 100 : 0);
        valoresPorCampo = {
            maquinaria_total: totales.map(() => 100),
            maquinaria_operativa: operativas.map((v, i) => pct(v, totales[i])),
            maquinaria_no_operativa: noOperativas.map((v, i) => pct(v, totales[i]))
        };
        formatoValor = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',') + '%';
    } else {
        valoresPorCampo = { maquinaria_total: totales, maquinaria_operativa: operativas, maquinaria_no_operativa: noOperativas };
        formatoValor = (v) => numeroPE(Math.round(v));
    }

    const series = SERIES_MAQUINARIA.map((s) => ({ ...s, valores: valoresPorCampo[s.campo] }));
    renderGroupedBarChart(svg, ANIOS_MAQUINARIA, series, formatoValor);
}

// Comparativo 2022-2025 (no depende del selector): computadoras operativas de
// las municipalidades (Módulo II, P13A_T = pc_total_operativas).
function crearGraficoComputadorasPorAnio() {
    const cont = document.getElementById('chartComputadorasPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(ANIOS_MAQUINARIA.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = ANIOS_MAQUINARIA.map((anio, i) => {
                const total = listasPorAnio[i].reduce((s, d) => s + (Number(d.pc_total_operativas) || 0), 0);
                return [anio, total];
            });
            renderBarrasVerticales('chartComputadorasPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo 2022-2025 (no depende del selector): municipalidades que cuentan
// con servicio de internet (Módulo II, P14A_1 = pc_con_acceso_internet > 0).
function crearGraficoInternetPorAnio() {
    const cont = document.getElementById('chartInternetPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(ANIOS_MAQUINARIA.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = ANIOS_MAQUINARIA.map((anio, i) => {
                const conInternet = listasPorAnio[i].filter((d) => Number(d.pc_con_acceso_internet) > 0).length;
                return [anio, conInternet];
            });
            renderBarrasVerticales('chartInternetPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo 2022-2025 (no depende del selector): municipalidades con Portal
// de Transparencia Estándar (Módulo II, P18_Portal con dato = tienen URL de
// su portal registrada). No se basa en la autoevaluación de P18 porque no
// siempre coincide con si realmente cargaron una URL (ver conversación).
function crearGraficoPtePorAnio() {
    const cont = document.getElementById('chartPtePorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(ANIOS_MAQUINARIA.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = ANIOS_MAQUINARIA.map((anio, i) => {
                const conPte = listasPorAnio[i].filter((d) => d.tiene_pte === 'Si').length;
                return [anio, conPte];
            });
            renderBarrasVerticales('chartPtePorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo 2022-2025 (no depende del selector): municipalidades que
// disponen de al menos uno de los 16 instrumentos de gestión y desarrollo
// urbano y/o rural (Módulo IV, P23_1 a P23_16; cada uno 1="Sí"/2="No").
function crearGraficoInstrumentosPorAnio() {
    const cont = document.getElementById('chartInstrumentosPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(ANIOS_MAQUINARIA.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = ANIOS_MAQUINARIA.map((anio, i) => {
                const conInstrumentos = listasPorAnio[i].filter((d) => d.tiene_instrumentos_gestion === 'Si').length;
                return [anio, conInstrumentos];
            });
            renderBarrasVerticales('chartInstrumentosPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo 2021-2025 (no depende del selector): municipalidades cuyo TUPA
// fue elaborado según Metodología de Determinación de Costos (Módulo IV, P26).
function crearGraficoTupaPorAnio() {
    const cont = document.getElementById('chartTupaPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(window.RENAMU.anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = window.RENAMU.anios.map((anio, i) => {
                const conTupa = listasPorAnio[i].filter((d) => d.tiene_tupa_metodologia_costos === 'Si').length;
                return [anio, conTupa];
            });
            renderBarrasVerticales('chartTupaPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo 2022-2025 (no depende del selector): municipalidades con personal
// exclusivo en el área de Administración Tributaria al 31 de marzo (Módulo IV,
// P32_2_T > 0).
function crearGraficoAdminTributariaPorAnio() {
    const cont = document.getElementById('chartAdminTributariaPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(ANIOS_MAQUINARIA.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = ANIOS_MAQUINARIA.map((anio, i) => {
                const conPersonal = listasPorAnio[i].filter((d) => Number(d.personal_administracion_tributaria_mar) > 0).length;
                return [anio, conPersonal];
            });
            renderBarrasVerticales('chartAdminTributariaPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo 2022-2025 (no depende del selector): municipalidades con Área de
// Ejecución Coactiva (Módulo IV, P33A = 1 "Sí y depende de Adm. Tributaria" ó
// 2 "Sí y no depende de Adm. Tributaria"; se excluye 3 "No tiene").
function crearGraficoEjecucionCoactivaPorAnio() {
    const cont = document.getElementById('chartEjecucionCoactivaPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(ANIOS_MAQUINARIA.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = ANIOS_MAQUINARIA.map((anio, i) => {
                const conArea = listasPorAnio[i].filter((d) => d.tiene_area_ejecucion_coactiva === 'Si').length;
                return [anio, conArea];
            });
            renderBarrasVerticales('chartEjecucionCoactivaPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Años de la encuesta (fuente de los archivos _lite.js) de los que se toma
// este indicador.
const ANIOS_LICENCIAS = [2021, 2022, 2023, 2024, 2025];

// Comparativo 2020-2024 (no depende del selector): suma nacional de licencias
// de funcionamiento otorgadas (Módulo IV, suma de P34A_1 a P34A_31; cada campo
// es el número de licencias otorgadas por tipo de establecimiento).
//
// OJO: esta pregunta del formulario RENAMU es retrospectiva. El diccionario de
// la encuesta "Año 2025" titula esta sección "...licencias de funcionamiento
// para establecimientos, 2024" — es decir, la encuesta levantada en el año X
// pregunta por las licencias otorgadas en el año X-1. Por eso se etiqueta cada
// barra con (año de la encuesta − 1), aunque el dato salga de
// municipios_{año}_lite.js.
function crearGraficoLicenciasPorAnio() {
    const cont = document.getElementById('chartLicenciasPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(ANIOS_LICENCIAS.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = ANIOS_LICENCIAS.map((anio, i) => {
                const total = listasPorAnio[i].reduce((s, d) => s + (Number(d.licencias_funcionamiento_total) || 0), 0);
                return [anio - 1, total];
            });
            renderBarrasVerticales('chartLicenciasPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo 2020-2024 (no depende del selector): suma nacional de casos
// atendidos por la DEMUNA (Módulo V, suma de P64_1_1 a P64_19_1). Misma
// lógica que licencias de funcionamiento: la encuesta es retrospectiva (la
// sección se titula "...2024" en la encuesta "Año 2025"), así que cada barra
// se etiqueta con (año de la encuesta − 1).
function crearGraficoDemunaPorAnio() {
    const cont = document.getElementById('chartDemunaPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(ANIOS_LICENCIAS.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = ANIOS_LICENCIAS.map((anio, i) => {
                const total = listasPorAnio[i].reduce((s, d) => s + (Number(d.casos_demuna_total) || 0), 0);
                return [anio - 1, total];
            });
            renderBarrasVerticales('chartDemunaPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

// Comparativo 2021-2025 (no depende del selector): municipalidades que
// administran al menos un establecimiento de salud (Módulo V, suma de
// P66_1_1 a P66_10_1 > 0). A diferencia de licencias/DEMUNA, esta pregunta
// SÍ corresponde al año de la encuesta (sin desfase).
function crearGraficoSaludPorAnio() {
    const cont = document.getElementById('chartSaludPorAnio');
    if (!cont) return;

    cont.innerHTML = '<p class="chart-state"><span class="table-state-spinner" aria-hidden="true"></span>Calculando…</p>';

    Promise.all(window.RENAMU.anios.map((anio) => window.RENAMU.cargarLigero(anio)))
        .then((listasPorAnio) => {
            const filas = window.RENAMU.anios.map((anio, i) => {
                const conSalud = listasPorAnio[i].filter((d) => d.administra_establecimientos_salud === 'Si').length;
                return [anio, conSalud];
            });
            renderBarrasVerticales('chartSaludPorAnio', filas);
        })
        .catch((err) => {
            cont.innerHTML = `<p class="chart-state"><span class="material-icons">error_outline</span>
                No se pudieron cargar los datos. ${escaparHtml(err && err.message)}</p>`;
        });
}

function renderBarrasVerticales(contenedorId, filas) {
    const cont = document.getElementById(contenedorId);

    if (!filas.length) {
        cont.innerHTML = '<p class="chart-state">Sin datos disponibles.</p>';
        return;
    }

    const max = Math.max(...filas.map(([, valor]) => valor), 1);
    cont.innerHTML = filas.map(([etiqueta, valor]) => `
        <div class="vbar-col">
            <div class="vbar-value">${numeroPE(valor)}</div>
            <div class="vbar-track">
                <div class="vbar-fill" style="height:${Math.max((valor / max) * 100, 2)}%"></div>
            </div>
            <div class="vbar-axis">${escaparHtml(etiqueta)}</div>
        </div>
    `).join('');
}

function agrupar(datos, clave, valorFn) {
    const acc = {};
    datos.forEach((d) => {
        const k = d[clave] || 'No especifica';
        acc[k] = (acc[k] || 0) + valorFn(d);
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
}

function crearGraficoDepartamentos() {
    const filas = agrupar(window.RENAMU.datosLigeros(), 'departamento', () => 1).slice(0, 10);
    renderBarras('chartDeptos', filas);
}

function crearGraficoPCs() {
    const filas = agrupar(window.RENAMU.datosLigeros(), 'departamento', (d) => Number(d.pc_total_operativas) || 0).slice(0, 10);
    renderBarras('chartPCs', filas);
}

function crearResumenTipos() {
    const datos = window.RENAMU.datosLigeros();
    const provinciales = datos.filter((d) => Number(d.tipo_municipalidad) === 1).length;
    const distritales = datos.filter((d) => Number(d.tipo_municipalidad) === 2).length;

    document.getElementById('resumenTipos').innerHTML = `
        <div class="summary-item">
            <div class="label">Provinciales</div>
            <div class="value">${numeroPE(provinciales)}</div>
            <div class="hint">${porcentaje(provinciales, datos.length)} del registro</div>
        </div>
        <div class="summary-item">
            <div class="label">Distritales</div>
            <div class="value">${numeroPE(distritales)}</div>
            <div class="hint">${porcentaje(distritales, datos.length)} del registro</div>
        </div>`;
}

function crearTopPCs() {
    const datos = [...window.RENAMU.datosLigeros()]
        .sort((a, b) => (Number(b.pc_total_operativas) || 0) - (Number(a.pc_total_operativas) || 0))
        .slice(0, 5);

    const rangos = ['gold', 'silver', 'bronze', '', ''];

    document.getElementById('topPCs').innerHTML = datos.map((d, i) => `
        <div class="top-item">
            <div class="top-item-main">
                <div class="top-rank ${rangos[i]}">${i + 1}</div>
                <div>
                    <div class="top-item-title">${escaparHtml(tituloCaso(d.distrito))}</div>
                    <div class="top-item-sub">${escaparHtml(tituloCaso(d.provincia))}, ${escaparHtml(tituloCaso(d.departamento))}</div>
                </div>
            </div>
            <div class="top-item-value">${numeroPE(d.pc_total_operativas)} <small>PCs</small></div>
        </div>
    `).join('');
}

function crearTiposConexion() {
    const datos = window.RENAMU.datosLigeros();
    const filas = agrupar(datos, 'tipo_conexion_internet', () => 1).slice(0, 6);

    document.getElementById('tiposConexion').innerHTML = filas.map(([nombre, valor], i) => `
        <div class="top-item">
            <div class="top-item-main">
                <div class="top-rank ${i < 3 ? ['gold', 'silver', 'bronze'][i] : ''}">${i + 1}</div>
                <div class="top-item-title">${escaparHtml(nombre)}</div>
            </div>
            <div class="top-item-value">${numeroPE(valor)} <small>${porcentaje(valor, datos.length)}</small></div>
        </div>
    `).join('');
}

function crearResumenSexo() {
    const datos = window.RENAMU.datosLigeros();
    const hombres = datos.filter((d) => d.sexo_alcalde === 'Hombre').length;
    const mujeres = datos.filter((d) => d.sexo_alcalde === 'Mujer').length;

    document.getElementById('resumenSexo').innerHTML = `
        <div class="summary-item">
            <div class="label">Alcaldes</div>
            <div class="value">${numeroPE(hombres)}</div>
            <div class="hint">${porcentaje(hombres, datos.length)} de las autoridades</div>
        </div>
        <div class="summary-item summary-item--accent">
            <div class="label">Alcaldesas</div>
            <div class="value">${numeroPE(mujeres)}</div>
            <div class="hint">${porcentaje(mujeres, datos.length)} de las autoridades</div>
        </div>`;
}

// Módulo III (Recursos Humanos): personal municipal al 31 de diciembre del año activo
function crearGraficoPersonal() {
    const filas = agrupar(window.RENAMU.datosLigeros(), 'departamento', (d) => Number(d.personal_total_dic) || 0).slice(0, 10);
    renderBarras('chartPersonal', filas);
}

// Módulo IV (Competencias): instrumentos de planificación municipal
function crearResumenInstrumentos() {
    const datos = window.RENAMU.datosLigeros();
    const conPDMC = datos.filter((d) => d.tiene_pdmc === 'Si').length;
    const conPEI = datos.filter((d) => d.tiene_pei === 'Si').length;

    document.getElementById('resumenInstrumentos').innerHTML = `
        <div class="summary-item">
            <div class="label">Plan de Desarrollo Municipal Concertado</div>
            <div class="value">${porcentaje(conPDMC, datos.length)}</div>
            <div class="hint">${numeroPE(conPDMC)} municipalidades</div>
        </div>
        <div class="summary-item summary-item--accent">
            <div class="label">Plan Estratégico Institucional</div>
            <div class="value">${porcentaje(conPEI, datos.length)}</div>
            <div class="hint">${numeroPE(conPEI)} municipalidades</div>
        </div>`;
}

// Módulo V (Servicios Públicos): recojo de residuos sólidos
function crearFrecuenciaResiduos() {
    const datos = window.RENAMU.datosLigeros();
    const filas = agrupar(datos, 'frecuencia_recojo_residuos', () => 1);

    document.getElementById('frecuenciaResiduos').innerHTML = filas.map(([nombre, valor], i) => `
        <div class="top-item">
            <div class="top-item-main">
                <div class="top-rank ${i < 3 ? ['gold', 'silver', 'bronze'][i] : ''}">${i + 1}</div>
                <div class="top-item-title">${escaparHtml(nombre)}</div>
            </div>
            <div class="top-item-value">${numeroPE(valor)} <small>${porcentaje(valor, datos.length)}</small></div>
        </div>
    `).join('');
}

function crearCoberturaResiduos() {
    const datos = window.RENAMU.datosLigeros();
    const filas = agrupar(datos, 'cobertura_recojo_residuos', () => 1);

    document.getElementById('coberturaResiduos').innerHTML = filas.map(([nombre, valor], i) => `
        <div class="top-item">
            <div class="top-item-main">
                <div class="top-rank ${i < 3 ? ['gold', 'silver', 'bronze'][i] : ''}">${i + 1}</div>
                <div class="top-item-title">${escaparHtml(nombre)}</div>
            </div>
            <div class="top-item-value">${numeroPE(valor)} <small>${porcentaje(valor, datos.length)}</small></div>
        </div>
    `).join('');
}

function porcentaje(parte, total) {
    if (!total) return '—';
    return (Math.round((parte / total) * 1000) / 10).toFixed(1).replace('.', ',') + '%';
}
