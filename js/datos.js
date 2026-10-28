// RENAMU · Página de datos — enlaza las descargas oficiales del año elegido

// Peso de cada .zip en descargas/<año>/ (se muestra junto al formato)
const PESOS = {
    2021: { spss: '1,5', csv: '1,3' },
    2022: { spss: '1,5', csv: '1,4' },
    2023: { spss: '1,5', csv: '1,4' },
    2024: { spss: '1,6', csv: '1,4' },
    2025: { spss: '1,6', csv: '1,4' },
    2026: { spss: '1,8', csv: '1,5' }
};

// Archivos alojados en Google Drive (compartidos como "Cualquier persona con el enlace").
// Copia el ID que va entre /d/ y /view en el enlace de compartir. Si un año o formato
// no figura aquí, el botón descarga el .zip de descargas/<año>/.
const DRIVE = {
    2021: {
        spss: { id: '1ZQL0k15fi1i_F4imJ-PBzxdNV6H92hTQ', peso: '6,9' },
        csv: { id: '1vq3lQPiOEGJ4YA1EBORBz62ezb6gBuIj', peso: '10,0' }
    },
    2022: {
        spss: { id: '1U_hBsvM16FdL7Ed-GB1YqGBwAnyezw4I', peso: '5,1' },
        csv: { id: '1ZMAZVBeJ40i3Hno-oWikpLTgzhWSh1f9', peso: '11,1' }
    },
    2023: {
        spss: { id: '1gamgthtPJOxQffFAXyuBdFg1BViSSQNG', peso: '5,4' },
        csv: { id: '1HphlABmDjMvCOIRAFDqW-FFn6y2DFv0b', peso: '11,6' }
    },
    2024: {
        spss: { id: '18R84gSbi24OSarfQ1cq72D4cYbdAzPZs', peso: '5,9' },
        csv: { id: '1qrpbrkgC1AdyKk22KfQcb595H5iX8jtP', peso: '11,0' }
    },
    2025: {
        spss: { id: '1YDNeuvgXA5gx6-eEJFxokjDwnjDqRgnm', peso: '5,7' },
        csv: { id: '1F9d6yEjtRbDCE8BcFFbLv0PnFcxn6IDw', peso: '11,1' }
    },
    2026: {
        spss: { id: '1bolk06fSr1Pwr3K9kOOyozTYr8prgfzV', peso: '13,1' },
        csv: { id: '1skqDjVsu9w0SSg34HlXNhY4HUX25ch_K', peso: '11,3' }
    }
};

// Temas de los tabulados; el número y el sufijo forman el nombre del archivo
const TEMAS = [
    ['01', 'equipamiento-tic', 'Equipamiento y TIC'],
    ['02', 'recursos-humanos-finanzas', 'Recursos humanos y finanzas municipales'],
    ['03', 'planificacion-municipal', 'Planificación municipal'],
    ['04', 'administracion-tributaria', 'Gestión de administración tributaria'],
    ['05', 'licencias', 'Licencias otorgadas por la municipalidad'],
    ['06', 'desarrollo-urbano-rural', 'Desarrollo urbano y/o rural'],
    ['07', 'saneamiento-ambiental', 'Saneamiento ambiental y salubridad'],
    ['08', 'educacion-cultura-deporte', 'Educación, cultura, deporte y recreación'],
    ['09', 'servicios-sociales', 'Servicios sociales'],
    ['10', 'salud', 'Salud'],
    ['11', 'seguridad-ciudadana', 'Seguridad ciudadana'],
    ['12', 'gestion-riesgo-desastres', 'Gestión del riesgo de desastres'],
    ['13', 'desarrollo-economico-local', 'Promoción del desarrollo económico local'],
    ['14', 'ambiente', 'Protección y conservación del ambiente'],
    ['15', 'participacion-vecinal', 'Participación vecinal']
];

// Tabulados completos de un año en Google Drive (un .zip con todos los temas).
// Cuando un nivel tiene el año aquí, la tarjeta ofrece ese archivo en vez de elegir tema.
const DRIVE_TABULADOS = {
    distrital: {
        2021: { id: '1g7_oUy5DDbX8zOLf5Z-6cpsHWo7HML7C', peso: '52,9' },
        2022: { id: '1vm-OUbtSf4ep-G03FwWY4rP3vKt5VCpA', peso: '59,8' },
        2023: { id: '1T0Nb_5gED55MR-rA6wHFT1239bGU0yr6', peso: '28,8' },
        2024: { id: '1yePnctoiRypWPkKbWkzCIh6kvOnkbMgq', peso: '19,6' },
        2025: { id: '1ZEEPwXTKxXbAZioMcTFcLipV8Wvl4DcU', peso: '17,3' },
        2026: { id: '1cnm0vM-K4lhGCqXprVa4ifxXSzm0EL_e', peso: '19,0' }
    },
    departamental: {
        2021: { id: '1Pf_Tx94SVQP2R3zNr-UXCUsUi5YfQnX3', peso: '38,9' },
        2022: { id: '13O0IHYRX5IJ9WuCQbODc5vEg4DnkWPKv', peso: '49,2' },
        2023: { id: '1iUI3phQbdHBBKsqYVL6Z9gDIiL6EN8I8', peso: '90,2' },
        2024: { id: '13AHgu1hC0MxOc_H9mSLW3G5qgJ_IS9oB', peso: '81,3' },
        2025: { id: '1q021_XjIvYkUT2Pn-j2ua_3YU_RY2u5u', peso: '33,0' },
        2026: { id: '1qA3_D_KY3BGKggeo8oO55Z55mz5KfI9f', peso: '32,9' }
    }
};

// Años con tabulados por tema en descargas/ (el más reciente se ofrece para los demás)
const ANIOS_TABULADO = [2021];

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('anioDescarga');
    const tabulados = document.querySelectorAll('[data-tabulado]');

    tabulados.forEach((card) => {
        const tema = card.querySelector('select');
        tema.innerHTML = TEMAS.map(([n, , nombre]) => `<option value="${n}">${n} · ${nombre}</option>`).join('');
        tema.addEventListener('change', () => actualizarTabulado(card, Number(select.value)));
    });

    const actualizar = () => {
        const anio = Number(select.value);
        document.querySelectorAll('.anio-activo').forEach((el) => { el.textContent = anio; });
        ['spss', 'csv'].forEach((formato) => {
            const drive = DRIVE[anio]?.[formato];
            document.getElementById(formato === 'spss' ? 'btnSpss' : 'btnCsv').href = drive
                ? `https://drive.google.com/uc?export=download&id=${drive.id}`
                : `descargas/${anio}/renamu_${anio}_${formato}.zip`;
            document.querySelector(`[data-peso="${formato}"]`).innerHTML = `${drive ? drive.peso : PESOS[anio][formato]}&nbsp;MB`;
        });
        tabulados.forEach((card) => actualizarTabulado(card, anio));
    };

    select.addEventListener('change', actualizar);
    actualizar();
});

function actualizarTabulado(card, anio) {
    const drive = DRIVE_TABULADOS[card.dataset.tabulado][anio];
    const boton = card.querySelector('a.btn');
    card.querySelector('[data-control]').hidden = Boolean(drive);
    card.querySelector('.tabulado-drive').hidden = !drive;
    if (drive) {
        card.querySelector('.tabulado-aviso:not(.tabulado-drive)').hidden = true;
        card.querySelector('[data-meta]').innerHTML = `${drive.peso}&nbsp;MB`;
        card.querySelector('.btn-texto').textContent = `Descargar tabulado ${anio}`;
        // Drive no analiza estos .zip y mostraría un aviso de virus antes de bajarlos;
        // confirm=t en la dirección de descarga directa lo omite.
        boton.href = `https://drive.usercontent.google.com/download?id=${drive.id}&export=download&confirm=t`;
        return;
    }
    card.querySelector('[data-meta]').textContent = '15 temas';

    const disponible = ANIOS_TABULADO.includes(anio);
    const anioArchivo = disponible ? anio : Math.max(...ANIOS_TABULADO);
    const [n, sufijo] = TEMAS.find(([num]) => num === card.querySelector('select').value);
    card.querySelector('.tabulado-aviso:not(.tabulado-drive)').hidden = disponible;
    card.querySelector('.btn-texto').textContent = `Descargar tabulado ${anioArchivo}`;
    boton.href =
        `descargas/${anioArchivo}/tabulados/tabulado_${card.dataset.tabulado}_${anioArchivo}_${n}_${sufijo}.zip`;
}
