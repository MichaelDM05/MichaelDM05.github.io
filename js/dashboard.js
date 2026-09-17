// RENAMU · Dashboard (datos reales, Módulo I y II)

let datosFiltrados = [];
let orden = { campo: null, asc: true };

// ubigeo/id_municipalidad pierden el cero inicial en departamentos 1-9 (se guardan
// como número); esto lo restaura para mostrar y filtrar con el formato oficial de 6 dígitos.
function ubigeoPadded(d) {
    return String(d.ubigeo).padStart(6, '0');
}

document.addEventListener('DOMContentLoaded', () => {
    poblarSelectorAnio();
    conectarEventos();
    cambiarAnio(window.RENAMU.anioActual);
});

function conectarEventos() {
    document.getElementById('filtroAnio').addEventListener('change', (e) => cambiarAnio(e.target.value));
    document.getElementById('filtroDepto').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroTipo').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroUbigeo').addEventListener('input', debounce(aplicarFiltros, 200));
    document.getElementById('busqueda').addEventListener('input', debounce(aplicarFiltros, 200));
    document.getElementById('limpiarFiltros').addEventListener('click', limpiarFiltros);

    document.querySelectorAll('.data-table th[data-campo]').forEach((th) => {
        th.addEventListener('click', () => ordenarPor(th.dataset.campo));
        th.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ordenarPor(th.dataset.campo); }
        });
    });
}

function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function cambiarAnio(anio) {
    mostrarCargando();
    window.RENAMU.setAnioLigero(anio)
        .then(() => {
            poblarStats();
            poblarFiltroDepartamento();
            aplicarFiltros();
        })
        .catch((err) => mostrarErrorCarga(err));
}

function mostrarCargando() {
    document.getElementById('tablaBody').innerHTML = `
        <tr><td colspan="8" class="table-state">
            <span class="table-state-spinner" aria-hidden="true"></span>
            Cargando el registro del año ${escaparHtml(window.RENAMU.anioActual)}…
        </td></tr>`;
    document.getElementById('resultadosCount').textContent = '';
    document.querySelectorAll('.stat-item-number').forEach((el) => el.classList.add('is-loading'));
}

function mostrarErrorCarga(err) {
    document.getElementById('tablaBody').innerHTML = `
        <tr><td colspan="8" class="table-state">
            <span class="material-icons table-state-icon">error_outline</span>
            No se pudieron cargar los datos del año ${escaparHtml(window.RENAMU.anioActual)}.
            <small>${escaparHtml(err && err.message)}</small>
        </td></tr>`;
    document.querySelectorAll('.stat-item-number').forEach((el) => el.classList.remove('is-loading'));
}

function poblarSelectorAnio() {
    const select = document.getElementById('filtroAnio');
    select.innerHTML = window.RENAMU.anios.map((a) =>
        `<option value="${a}" ${a === window.RENAMU.anioActual ? 'selected' : ''}>${a}</option>`
    ).join('');
}

function poblarStats() {
    const datos = window.RENAMU.datosLigeros();
    const total = datos.length;

    const set = (id, valor) => {
        const el = document.getElementById(id);
        el.classList.remove('is-loading');
        el.textContent = valor;
    };

    if (!total) {
        ['totalMuni', 'totalDept', 'promedioPCs', 'pctPortal'].forEach((id) => set(id, '—'));
        return;
    }

    set('totalMuni', numeroPE(total));
    set('totalDept', new Set(datos.map((d) => d.departamento)).size);

    const totalPCs = datos.reduce((s, d) => s + (Number(d.pc_total_operativas) || 0), 0);
    set('promedioPCs', (totalPCs / total).toFixed(1));

    const conPortal = datos.filter((d) => d.tiene_portal_transparencia === 'Si').length;
    set('pctPortal', Math.round((conPortal / total) * 100) + '%');
}

function poblarFiltroDepartamento() {
    const select = document.getElementById('filtroDepto');
    const seleccionado = select.value;
    const deptos = [...new Set(window.RENAMU.datosLigeros().map((d) => d.departamento))].sort();

    select.innerHTML = '<option value="">Todos</option>' +
        deptos.map((dep) => `<option value="${escaparHtml(dep)}">${escaparHtml(dep)}</option>`).join('');

    // Conservar la selección si ese departamento también existe en el año nuevo
    if (seleccionado && deptos.includes(seleccionado)) select.value = seleccionado;
}

function limpiarFiltros() {
    document.getElementById('filtroDepto').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroUbigeo').value = '';
    document.getElementById('busqueda').value = '';
    aplicarFiltros();
}

function aplicarFiltros() {
    const datos = window.RENAMU.datosLigeros();
    const depto = document.getElementById('filtroDepto').value;
    const tipo = document.getElementById('filtroTipo').value;
    const ubigeo = document.getElementById('filtroUbigeo').value.trim().replace(/\s+/g, '');
    const busqueda = document.getElementById('busqueda').value.trim().toLowerCase();

    datosFiltrados = datos.filter((d) => {
        if (depto && d.departamento !== depto) return false;
        if (tipo && String(d.tipo_municipalidad) !== tipo) return false;
        if (ubigeo && !ubigeoPadded(d).startsWith(ubigeo)) return false;
        if (busqueda) {
            const texto = `${d.distrito} ${d.provincia} ${d.departamento} ${d.nombre_alcalde || ''}`.toLowerCase();
            if (!texto.includes(busqueda)) return false;
        }
        return true;
    });

    aplicarOrden();
    renderTabla();
}

function ordenarPor(campo) {
    orden = { campo: campo, asc: orden.campo === campo ? !orden.asc : true };
    aplicarOrden();
    renderTabla();
}

function aplicarOrden() {
    if (!orden.campo) return;
    const campo = orden.campo;
    const dir = orden.asc ? 1 : -1;
    const numerico = campo === 'ubigeo' || campo === 'tipo_municipalidad';

    datosFiltrados.sort((a, b) => {
        const va = a[campo], vb = b[campo];
        if (numerico) return ((Number(va) || 0) - (Number(vb) || 0)) * dir;
        return String(va ?? '').localeCompare(String(vb ?? ''), 'es') * dir;
    });

    document.querySelectorAll('.data-table th[data-campo]').forEach((th) => {
        const activo = th.dataset.campo === campo;
        th.classList.toggle('sorted', activo);
        th.classList.toggle('desc', activo && !orden.asc);
        th.setAttribute('aria-sort', activo ? (orden.asc ? 'ascending' : 'descending') : 'none');
    });
}

// Sin paginación: las 1,891 municipalidades filtradas se renderizan de una vez
// dentro del recuadro, que se desplaza internamente (.table-scroll).
function renderTabla() {
    const tbody = document.getElementById('tablaBody');
    const total = datosFiltrados.length;

    document.getElementById('resultadosCount').textContent =
        `${numeroPE(total)} ${total === 1 ? 'resultado' : 'resultados'}`;

    if (total === 0) {
        tbody.innerHTML = `
            <tr><td colspan="8" class="table-state">
                <span class="material-icons table-state-icon">search_off</span>
                No se encontraron municipalidades con esos filtros.
            </td></tr>`;
        return;
    }

    tbody.innerHTML = datosFiltrados.map((d) => {
        const esProvincial = Number(d.tipo_municipalidad) === 1;
        const tipo = d.informante_etiqueta || (esProvincial ? 'Provincial' : 'Distrital');
        return `
        <tr>
            <td class="mono">${escaparHtml(ubigeoPadded(d))}</td>
            <td>${escaparHtml(tituloCaso(d.departamento))}</td>
            <td>${escaparHtml(tituloCaso(d.provincia))}</td>
            <td class="cell-strong">${escaparHtml(tituloCaso(d.distrito))}</td>
            <td><span class="pill ${esProvincial ? 'pill-blue' : 'pill-soft'}">${escaparHtml(tipo)}</span></td>
            <td>${escaparHtml(tituloCaso(d.nombre_alcalde)) || '—'}</td>
            <td>${escaparHtml(d.sexo_alcalde) || '—'}</td>
            <td class="mono">${escaparHtml((d.correo_municipalidad || '').toLowerCase()) || '—'}</td>
        </tr>`;
    }).join('');
}

function recargarPowerBI() {
    const frame = document.getElementById('powerbiFrame');
    const loading = document.getElementById('powerbiLoading');
    if (!frame) return;
    if (loading) loading.style.display = 'flex';
    frame.src = frame.src;
    vigilarPowerBI();
}

function pantallaCompletaPowerBI() {
    const wrapper = document.getElementById('powerbiWrapper');
    if (!wrapper) return;
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen();
    } else if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
    }
}

// Si el reporte no responde, el overlay no puede quedarse girando para siempre
let temporizadorPowerBI;
function vigilarPowerBI() {
    clearTimeout(temporizadorPowerBI);
    temporizadorPowerBI = setTimeout(() => {
        const loading = document.getElementById('powerbiLoading');
        if (loading && loading.style.display !== 'none') {
            loading.innerHTML = `
                <span class="material-icons" aria-hidden="true">cloud_off</span>
                <span>El reporte está tardando en responder.</span>
                <button class="btn btn-sm btn-outline" onclick="recargarPowerBI()">Reintentar</button>`;
        }
    }, 15000);
}

function powerBICargado() {
    clearTimeout(temporizadorPowerBI);
    const loading = document.getElementById('powerbiLoading');
    if (loading) loading.style.display = 'none';
}

vigilarPowerBI();
