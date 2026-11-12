// RENAMU · Dashboard (datos reales, Módulo I y II)

let datosFiltrados = [];
let orden = { campo: null, asc: true };

// ubigeo/id_municipalidad pierden el cero inicial en departamentos 1-9 (se guardan
// como número); esto lo restaura para mostrar y filtrar con el formato oficial de 6 dígitos.
function ubigeoPadded(d) {
    return String(d.ubigeo).padStart(6, '0');
}

// La Municipalidad Metropolitana de Lima (150101) figura en el registro como
// provincial (tipo 1); en el directorio se muestra y filtra como "Metropolitana".
const UBIGEO_METROPOLITANA = '150101';

// Código del filtro Tipo: 'M' (Metropolitana), '1' (Provincial) o '2' (Distrital)
function tipoDe(d) {
    return ubigeoPadded(d) === UBIGEO_METROPOLITANA ? 'M' : String(d.tipo_municipalidad);
}

const ETIQUETA_TIPO = { M: 'Metropolitana', 1: 'Provincial', 2: 'Distrital' };
const ORDEN_TIPO = { M: 0, 1: 1, 2: 2 };

// El Callao se agrupa dentro de Lima: el Perú se cuenta con 24 departamentos.
function departamentoDe(d) {
    return d.departamento === 'CALLAO' ? 'LIMA' : d.departamento;
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

// Directorio de municipalidades por año del registro: 2021-2025 es el Excel
// "Directorio F01" alojado en el sitio; 2026, el ZIP de cuadros Excel de gob.pe.
// Los años sin archivo ocultan el botón de descarga.
const DIRECTORIO_POR_ANIO = {
    2026: {
        url: 'https://cdn.www.gob.pe/uploads/document/file/9915971/8058591-cuadros-excel-directorio-nacional-de-gobiernos-regionales-municipalidades-provinciales-distritales-y-de-centros-poblados-2026.zip?v=1778013297',
        titulo: 'Cuadros Excel del Directorio Nacional de Gobiernos Regionales, Municipalidades Provinciales, Distritales y de Centros Poblados 2026 (ZIP)',
    },
};
[2021, 2022, 2023, 2024, 2025].forEach((a) => {
    DIRECTORIO_POR_ANIO[a] = {
        url: `descargas/directorio/directorio_f01_${a}.xlsx`,
        nombre: `Directorio F01. Municipalidades Provinciales y Distritales - ${a}.xlsx`,
        titulo: `Directorio F01. Municipalidades Provinciales y Distritales - ${a} (Excel)`,
    };
});

function actualizarDescargaDirectorio(anio) {
    const enlace = document.getElementById('descargaDirectorio');
    if (!enlace) return;
    const archivo = DIRECTORIO_POR_ANIO[anio];
    enlace.hidden = !archivo;
    if (!archivo) return;
    enlace.href = archivo.url;
    enlace.title = archivo.titulo;
    // Nombre sugerido al guardar (solo aplica a archivos del propio sitio)
    if (archivo.nombre) enlace.setAttribute('download', archivo.nombre);
    else enlace.setAttribute('download', '');
}

// Directorio F01 (2021-2025): data/directorio_AAAA.js deja en
// window.RENAMU_DIRECTORIO[anio] = { fecha, nota, campos, filas }. Se carga una vez
// por año; los años sin archivo resuelven null y usan los datos del RENAMU.
const ANIOS_DIRECTORIO = [2021, 2022, 2023, 2024, 2025];
const directorioPromesas = {};

function cargarDirectorio(anio) {
    anio = Number(anio);
    if (!ANIOS_DIRECTORIO.includes(anio)) return Promise.resolve(null);
    if (!directorioPromesas[anio]) {
        directorioPromesas[anio] = new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = `data/directorio_${anio}.js`;
            s.onload = () => resolve((window.RENAMU_DIRECTORIO || {})[anio] || null);
            s.onerror = () => { delete directorioPromesas[anio]; resolve(null); };
            document.head.appendChild(s);
        });
    }
    return directorioPromesas[anio];
}

// Filas del cuadro: registro RENAMU del año + columnas del directorio por ubigeo
let filasBase = [];

function construirFilas(datos, dir) {
    const porUbigeo = new Map();
    if (dir) {
        const c = dir.campos;
        dir.filas.forEach((f) => {
            const o = {};
            c.forEach((k, i) => { o[k] = f[i]; });
            porUbigeo.set(o.ubigeo, o);
        });
    }
    return datos.map((d) => {
        const x = porUbigeo.get(ubigeoPadded(d));
        if (!x) {
            return Object.assign({}, d, {
                telefonos: d.telefono_alcalde == null ? null : String(d.telefono_alcalde),
                correo: d.correo_municipalidad,
            });
        }
        return Object.assign({}, d, {
            nombre_alcalde: x.alcalde || d.nombre_alcalde,
            sexo_alcalde: x.sexo || d.sexo_alcalde,
            direccion: x.direccion,
            codigo_ciudad: x.codigo_ciudad,
            telefonos: x.telefonos,
            correo: x.correo,
        });
    });
}

function mostrarNotaDirectorio(dir) {
    const nota = document.getElementById('directorioNota');
    if (!nota) return;
    nota.hidden = !dir;
    nota.textContent = dir
        ? `${dir.nota || `Directorio actualizado al ${dir.fecha}.`} Fuente: INEI, Directorio F01 de Municipalidades Provinciales y Distritales ${dir.anio}.`
        : '';
}

let cargaVigente = 0;

function cambiarAnio(anio) {
    const turno = ++cargaVigente;
    actualizarDescargaDirectorio(anio);
    mostrarCargando();
    Promise.all([window.RENAMU.setAnioLigero(anio), cargarDirectorio(anio)])
        .then(([, dir]) => {
            if (turno !== cargaVigente) return;
            filasBase = construirFilas(window.RENAMU.datosLigeros(), dir);
            mostrarNotaDirectorio(dir);
            poblarStats();
            poblarFiltroDepartamento();
            aplicarFiltros();
        })
        .catch((err) => { if (turno === cargaVigente) mostrarErrorCarga(err); });
}

function mostrarCargando() {
    document.getElementById('tablaBody').innerHTML = `
        <tr><td colspan="11" class="table-state">
            <span class="table-state-spinner" aria-hidden="true"></span>
            Cargando el registro del año ${escaparHtml(window.RENAMU.anioActual)}…
        </td></tr>`;
    document.getElementById('resultadosCount').textContent = '';
    document.querySelectorAll('.stat-item-number').forEach((el) => el.classList.add('is-loading'));
}

function mostrarErrorCarga(err) {
    document.getElementById('tablaBody').innerHTML = `
        <tr><td colspan="11" class="table-state">
            <span class="material-icons table-state-icon" aria-hidden="true">error_outline</span>
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
        ['totalMuni', 'totalDept', 'totalProvConst', 'promedioPCs', 'pctPortal'].forEach((id) => set(id, '—'));
        return;
    }

    set('totalMuni', numeroPE(total));
    // departamentoDe() suma el Callao a Lima; la Provincia Constitucional se cuenta aparte
    set('totalDept', new Set(datos.map(departamentoDe)).size);
    set('totalProvConst', datos.some((d) => d.departamento === 'CALLAO') ? 1 : 0);

    const totalPCs = datos.reduce((s, d) => s + (Number(d.pc_total_operativas) || 0), 0);
    set('promedioPCs', decimalPE(totalPCs / total, 1));

    const conPortal = datos.filter((d) => d.tiene_portal_transparencia === 'Si').length;
    set('pctPortal', decimalPE((conPortal / total) * 100, 1) + '%');
}

function poblarFiltroDepartamento() {
    const select = document.getElementById('filtroDepto');
    const seleccionado = select.value;
    const deptos = [...new Set(window.RENAMU.datosLigeros().map(departamentoDe))].sort();

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
    const datos = filasBase;
    const depto = document.getElementById('filtroDepto').value;
    const tipo = document.getElementById('filtroTipo').value;
    const ubigeo = document.getElementById('filtroUbigeo').value.trim().replace(/\s+/g, '');
    const busqueda = document.getElementById('busqueda').value.trim().toLowerCase();

    datosFiltrados = datos.filter((d) => {
        if (depto && departamentoDe(d) !== depto) return false;
        if (tipo && tipoDe(d) !== tipo) return false;
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
    const valor = (d) => {
        if (campo === 'departamento') return departamentoDe(d);
        if (campo === 'tipo_municipalidad') return ORDEN_TIPO[tipoDe(d)];
        return d[campo];
    };

    datosFiltrados.sort((a, b) => {
        const va = valor(a);
        const vb = valor(b);
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

// Sin paginación: las 1 892 municipalidades filtradas se renderizan de una vez
// dentro del recuadro, que se desplaza internamente (.table-scroll).
function renderTabla() {
    const tbody = document.getElementById('tablaBody');
    const total = datosFiltrados.length;

    document.getElementById('resultadosCount').textContent =
        `${numeroPE(total)} ${total === 1 ? 'resultado' : 'resultados'}`;

    if (total === 0) {
        tbody.innerHTML = `
            <tr><td colspan="11" class="table-state">
                <span class="material-icons table-state-icon" aria-hidden="true">search_off</span>
                No se encontraron municipalidades con esos filtros.
            </td></tr>`;
        return;
    }

    tbody.innerHTML = datosFiltrados.map((d) => {
        const codigoTipo = tipoDe(d);
        const esProvincial = codigoTipo !== '2';
        const tipo = ETIQUETA_TIPO[codigoTipo] || d.informante_etiqueta;
        return `
        <tr>
            <td class="mono">${escaparHtml(ubigeoPadded(d))}</td>
            <td>${escaparHtml(tituloCaso(departamentoDe(d)))}</td>
            <td>${escaparHtml(tituloCaso(d.provincia))}</td>
            <td class="cell-strong">${escaparHtml(tituloCaso(d.distrito))}</td>
            <td><span class="pill ${esProvincial ? 'pill-blue' : 'pill-soft'}">${escaparHtml(tipo)}</span></td>
            <td>${escaparHtml(tituloCaso(d.nombre_alcalde)) || '—'}</td>
            <td>${escaparHtml(d.sexo_alcalde) || '—'}</td>
            <td>${escaparHtml(d.direccion) || '—'}</td>
            <td class="mono">${escaparHtml(d.codigo_ciudad) || '—'}</td>
            <td class="mono">${escaparHtml(d.telefonos) || '—'}</td>
            <td class="mono">${escaparHtml((d.correo || '').toLowerCase()) || '—'}</td>
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
