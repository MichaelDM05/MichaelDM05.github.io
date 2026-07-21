// RENAMU · Dashboard (datos reales, Módulo I y II)

const PAGE_SIZE = 15;
let paginaActual = 1;
let datosFiltrados = [];

document.addEventListener('DOMContentLoaded', () => {
    poblarSelectorAnio();
    poblarFiltroDepartamento();
    recalcularTodo();

    document.getElementById('filtroAnio').addEventListener('change', (e) => {
        window.RENAMU.setAnio(e.target.value);
        recalcularTodo();
    });
});

function recalcularTodo() {
    poblarStats();
    aplicarFiltros();
}

function poblarSelectorAnio() {
    const select = document.getElementById('filtroAnio');
    select.innerHTML = window.RENAMU.anios.map((a) =>
        `<option value="${a}" ${a === window.RENAMU.anioActual ? 'selected' : ''}>${a}</option>`
    ).join('');
}

function poblarStats() {
    const datos = window.RENAMU.datos();
    document.getElementById('totalMuni').textContent = datos.length.toLocaleString('es-PE');

    const deptos = new Set(datos.map((d) => d.departamento));
    document.getElementById('totalDept').textContent = deptos.size;

    const totalPCs = datos.reduce((s, d) => s + (Number(d.pc_total_operativas) || 0), 0);
    document.getElementById('promedioPCs').textContent = (totalPCs / datos.length).toFixed(1);

    const conPortal = datos.filter((d) => d.tiene_portal_transparencia === 'Si').length;
    document.getElementById('pctPortal').textContent = Math.round((conPortal / datos.length) * 100) + '%';
}

function poblarFiltroDepartamento() {
    const select = document.getElementById('filtroDepto');
    const datos = window.RENAMU.datos();
    const deptos = [...new Set(datos.map((d) => d.departamento))].sort();
    select.innerHTML = '<option value="">Todos</option>' +
        deptos.map((dep) => `<option value="${dep}">${dep}</option>`).join('');
}

function aplicarFiltros() {
    const datos = window.RENAMU.datos();
    const depto = document.getElementById('filtroDepto').value;
    const tipo = document.getElementById('filtroTipo').value;
    const busqueda = document.getElementById('busqueda').value.trim().toLowerCase();

    datosFiltrados = datos.filter((d) => {
        if (depto && d.departamento !== depto) return false;
        if (tipo && String(d.tipo_municipalidad) !== tipo) return false;
        if (busqueda) {
            const texto = `${d.distrito} ${d.provincia} ${d.departamento} ${d.nombre_alcalde || ''}`.toLowerCase();
            if (!texto.includes(busqueda)) return false;
        }
        return true;
    });

    paginaActual = 1;
    renderTabla();
}

function renderTabla() {
    const tbody = document.getElementById('tablaBody');
    const total = datosFiltrados.length;
    const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
    paginaActual = Math.min(paginaActual, totalPaginas);

    const inicio = (paginaActual - 1) * PAGE_SIZE;
    const pagina = datosFiltrados.slice(inicio, inicio + PAGE_SIZE);

    document.getElementById('resultadosCount').textContent = `${total.toLocaleString('es-PE')} resultados`;

    if (pagina.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="8" style="text-align:center;padding:60px;color:var(--gray-500);">
                <span class="material-icons" style="font-size:2.4rem;display:block;margin-bottom:12px;color:var(--gray-400);">search_off</span>
                No se encontraron municipalidades con esos filtros.
            </td></tr>`;
    } else {
        tbody.innerHTML = pagina.map((d) => `
            <tr>
                <td>${d.ubigeo}</td>
                <td>${d.departamento}</td>
                <td>${d.provincia}</td>
                <td>${d.distrito}</td>
                <td><span class="pill ${Number(d.tipo_municipalidad) === 1 ? 'pill-blue' : 'pill-green'}">${d.informante_etiqueta || (Number(d.tipo_municipalidad) === 1 ? 'Provincial' : 'Distrital')}</span></td>
                <td>${tituloCaso(d.nombre_alcalde) || '—'}</td>
                <td>${d.pc_total_operativas ?? 0}</td>
                <td>${d.tiene_portal_transparencia === 'Si'
                    ? '<span class="pill pill-green">Sí</span>'
                    : '<span class="pill" style="background:var(--gray-200);color:var(--gray-500);">No</span>'}</td>
            </tr>
        `).join('');
    }

    document.getElementById('paginationInfo').textContent =
        total === 0 ? '' : `Página ${paginaActual} de ${totalPaginas}`;

    renderPaginacion(totalPaginas);
}

function tituloCaso(str) {
    if (!str) return str;
    return str.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function renderPaginacion(totalPaginas) {
    const cont = document.getElementById('paginacion');
    let html = `<button ${paginaActual === 1 ? 'disabled' : ''} onclick="irAPagina(${paginaActual - 1})">
        <span class="material-icons" style="font-size:16px;">chevron_left</span>
    </button>`;

    const rango = 2;
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActual - rango && i <= paginaActual + rango)) {
            html += `<button class="${i === paginaActual ? 'active' : ''}" onclick="irAPagina(${i})">${i}</button>`;
        } else if (i === paginaActual - rango - 1 || i === paginaActual + rango + 1) {
            html += `<button disabled>…</button>`;
        }
    }

    html += `<button ${paginaActual === totalPaginas ? 'disabled' : ''} onclick="irAPagina(${paginaActual + 1})">
        <span class="material-icons" style="font-size:16px;">chevron_right</span>
    </button>`;

    cont.innerHTML = html;
}

function recargarPowerBI() {
    const frame = document.getElementById('powerbiFrame');
    const loading = document.getElementById('powerbiLoading');
    if (!frame) return;
    loading.style.display = 'flex';
    frame.src = frame.src;
}

function pantallaCompletaPowerBI() {
    const wrapper = document.getElementById('powerbiWrapper');
    if (!wrapper) return;
    if (wrapper.requestFullscreen) wrapper.requestFullscreen();
    else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
}

function irAPagina(n) {
    paginaActual = n;
    renderTabla();
    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}