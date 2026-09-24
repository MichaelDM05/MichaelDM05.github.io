// RENAMU · Estadísticas (agregados del año activo)

document.addEventListener('DOMContentLoaded', () => {
    poblarSelectorAnio();
    cambiarAnio(window.RENAMU.anioActual);
    crearGraficoMuniPorAnio();

    document.getElementById('filtroAnio').addEventListener('change', (e) => cambiarAnio(e.target.value));
});

function poblarSelectorAnio() {
    const select = document.getElementById('filtroAnio');
    select.innerHTML = window.RENAMU.anios.map((a) =>
        `<option value="${a}" ${a === window.RENAMU.anioActual ? 'selected' : ''}>${a}</option>`
    ).join('');
}

const CONTENEDORES = ['chartDeptos', 'chartPCs', 'resumenTipos', 'topPCs', 'tiposConexion', 'resumenSexo'];

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

function porcentaje(parte, total) {
    if (!total) return '—';
    return (Math.round((parte / total) * 1000) / 10).toFixed(1).replace('.', ',') + '%';
}
