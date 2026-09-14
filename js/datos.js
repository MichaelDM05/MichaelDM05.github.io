// RENAMU · Página de datos — genera las descargas en el navegador

// Campos del Módulo I y II que se exportan en el CSV resumido.
// El JSON completo conserva los 121 campos originales del registro.
const CAMPOS_CSV = [
    'anio', 'ubigeo', 'departamento', 'provincia', 'distrito',
    'tipo_municipalidad', 'informante_etiqueta',
    'nombre_alcalde', 'sexo_alcalde',
    'correo_municipalidad', 'pagina_web_municipalidad',
    'pc_total_operativas', 'pc_con_acceso_internet', 'tipo_conexion_internet',
    'tiene_portal_transparencia', 'url_portal_transparencia'
];

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('anioDescarga');
    select.innerHTML = window.RENAMU.anios.map((a) =>
        `<option value="${a}" ${a === window.RENAMU.anioActual ? 'selected' : ''}>${a}</option>`
    ).join('');

    select.addEventListener('change', (e) => {
        window.RENAMU.anioActual = Number(e.target.value);
        document.querySelectorAll('.anio-activo').forEach((el) => { el.textContent = e.target.value; });
    });

    document.querySelectorAll('.anio-activo').forEach((el) => { el.textContent = window.RENAMU.anioActual; });

    document.getElementById('btnCsv').addEventListener('click', (e) => descargar(e.currentTarget, 'csv'));
    document.getElementById('btnJson').addEventListener('click', (e) => descargar(e.currentTarget, 'json'));
    document.getElementById('btnResumen').addEventListener('click', (e) => descargar(e.currentTarget, 'resumen'));
});

function descargar(boton, formato) {
    const anio = window.RENAMU.anioActual;

    // El archivo del año pesa ~6,9 MB: se descarga sólo cuando alguien lo pide
    const yaEstaba = window.RENAMU.estaCargado(anio);
    if (!yaEstaba) {
        boton.classList.add('is-busy');
        boton.disabled = true;
        mostrarToast(`Preparando el registro ${anio}…`, 'hourglass_top');
    }

    window.RENAMU.cargar(anio)
        .then((datos) => {
            if (formato === 'csv') {
                guardarArchivo(aCsv(datos, CAMPOS_CSV), `renamu_${anio}_principal.csv`, 'text/csv');
            } else if (formato === 'json') {
                guardarArchivo(JSON.stringify(datos, null, 2), `renamu_${anio}_completo.json`, 'application/json');
            } else {
                const filas = resumenPorDepartamento(datos);
                guardarArchivo(aCsv(filas, Object.keys(filas[0])), `renamu_${anio}_resumen_departamentos.csv`, 'text/csv');
            }
            mostrarToast(`Descarga lista · RENAMU ${anio}`, 'download_done');
        })
        .catch((err) => mostrarToast('No se pudo preparar la descarga: ' + err.message, 'error'))
        .finally(() => {
            boton.classList.remove('is-busy');
            boton.disabled = false;
        });
}

function resumenPorDepartamento(datos) {
    const acc = {};

    datos.forEach((d) => {
        const dep = d.departamento || 'NO ESPECIFICA';
        if (!acc[dep]) {
            acc[dep] = {
                departamento: dep,
                municipalidades: 0,
                provinciales: 0,
                distritales: 0,
                pc_operativas: 0,
                pc_con_internet: 0,
                con_portal_transparencia: 0,
                alcaldesas: 0
            };
        }
        const f = acc[dep];
        f.municipalidades += 1;
        if (Number(d.tipo_municipalidad) === 1) f.provinciales += 1; else f.distritales += 1;
        f.pc_operativas += Number(d.pc_total_operativas) || 0;
        f.pc_con_internet += Number(d.pc_con_acceso_internet) || 0;
        if (d.tiene_portal_transparencia === 'Si') f.con_portal_transparencia += 1;
        if (d.sexo_alcalde === 'Mujer') f.alcaldesas += 1;
    });

    return Object.values(acc).sort((a, b) => a.departamento.localeCompare(b.departamento, 'es'));
}

function aCsv(filas, campos) {
    const escapar = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };

    // Punto y coma: es el separador que Excel espera en configuración regional es-PE
    const cabecera = campos.join(';');
    const cuerpo = filas.map((fila) => campos.map((c) => escapar(fila[c])).join(';'));
    return [cabecera].concat(cuerpo).join('\r\n');
}

function guardarArchivo(contenido, nombre, tipo) {
    // BOM para que Excel reconozca UTF-8 y no rompa las tildes
    const partes = tipo === 'text/csv' ? ['﻿', contenido] : [contenido];
    const blob = new Blob(partes, { type: tipo + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
