// RENAMU · Video tutorial "Recorrido en 2 minutos"
// - Cualquier elemento con [data-tutorial] abre el video en una ventana (<dialog>).
// - En la primera visita a Inicio aparece una sugerencia flotante (después del
//   banner de cookies). Al cerrarla o ver el video no vuelve a mostrarse:
//   se recuerda en localStorage (renamu_tutorial_visto), declarado en la Política de Cookies.

(function () {
    const VIDEO = 'media/RENAMU_recorrido_2min.mp4';
    const CLAVE = 'renamu_tutorial_visto';
    let dialogo = null;

    function marcarVisto() {
        try { localStorage.setItem(CLAVE, '1'); } catch (e) { /* almacenamiento bloqueado */ }
    }
    function yaVisto() {
        try { return localStorage.getItem(CLAVE) === '1'; } catch (e) { return false; }
    }

    function crearDialogo() {
        dialogo = document.createElement('dialog');
        dialogo.className = 'tutorial-dialog';
        dialogo.setAttribute('aria-labelledby', 'tutorialTitulo');
        dialogo.innerHTML = `
            <div class="tutorial-dialog-head">
                <h2 id="tutorialTitulo">Tutorial: cómo explorar el sitio (2 min)</h2>
                <button type="button" class="tutorial-cerrar" aria-label="Cerrar video" data-cerrar>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
            <video class="tutorial-video" controls preload="none" playsinline>
                <source src="${VIDEO}" type="video/mp4">
                Tu navegador no puede reproducir este video. <a href="${VIDEO}" download>Descárgalo aquí</a>.
            </video>`;
        dialogo.addEventListener('click', (e) => {
            // Clic en el fondo oscuro o en la X: cerrar
            if (e.target === dialogo || e.target.closest('[data-cerrar]')) dialogo.close();
        });
        dialogo.addEventListener('close', () => {
            const v = dialogo.querySelector('video');
            if (v) v.pause();
        });
        document.body.appendChild(dialogo);
    }

    function abrir() {
        if (!dialogo) crearDialogo();
        marcarVisto();
        quitarSugerencia();
        if (typeof dialogo.showModal === 'function') dialogo.showModal();
        else dialogo.setAttribute('open', '');
        const v = dialogo.querySelector('video');
        if (v) v.play().catch(() => { /* el usuario puede pulsar play */ });
    }

    let sugerencia = null;
    function quitarSugerencia() {
        if (sugerencia) { sugerencia.remove(); sugerencia = null; }
    }

    function mostrarSugerencia() {
        if (yaVisto() || sugerencia) return;
        sugerencia = document.createElement('aside');
        sugerencia.className = 'tutorial-sugerencia';
        sugerencia.setAttribute('aria-label', 'Sugerencia: video tutorial');
        sugerencia.innerHTML = `
            <button type="button" class="tutorial-sugerencia-x" aria-label="Cerrar sugerencia" data-cerrar>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <span class="tutorial-sugerencia-icono" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </span>
            <div>
                <strong>¿Primera vez aquí?</strong>
                <p>Mira el tutorial de 2 minutos y aprende a explorar el sitio.</p>
                <button type="button" class="btn btn-primary btn-sm" data-tutorial>Ver video</button>
            </div>`;
        sugerencia.addEventListener('click', (e) => {
            if (e.target.closest('[data-cerrar]')) { marcarVisto(); quitarSugerencia(); }
        });
        document.body.appendChild(sugerencia);
    }

    // Espera a que no haya banner de cookies en pantalla para no taparlo
    function sugerirCuandoLibre(intentos) {
        if (yaVisto()) return;
        if (document.querySelector('.cookie-banner')) {
            if (intentos > 0) setTimeout(() => sugerirCuandoLibre(intentos - 1), 1500);
            return;
        }
        mostrarSugerencia();
    }

    document.addEventListener('click', (e) => {
        const disparador = e.target.closest('[data-tutorial]');
        if (disparador) { e.preventDefault(); abrir(); }
    });

    document.addEventListener('DOMContentLoaded', () => {
        if (document.body.hasAttribute('data-sugerir-tutorial')) {
            setTimeout(() => sugerirCuandoLibre(400), 2500);
        }
    });
})();
