// RENAMU · Gestor de consentimiento de cookies y almacenamiento local
//
// Qué hace hoy:
//   - Muestra el aviso con Aceptar / Rechazar / Configurar hasta que la persona elige.
//   - Guarda la elección SOLO en este navegador (localStorage, clave CLAVE) y la
//     vuelve a pedir cuando cambia VERSION o pasan DIAS_VALIDEZ días.
//   - Cualquier botón o enlace con [data-abrir-cookies] reabre la configuración.
//
// Qué NO hace: el sitio no carga hoy analítica ni publicidad, así que no hay nada
// que bloquear. Si en el futuro se agrega una herramienta de ese tipo, debe
// incluirse bloqueada así y este archivo la activará solo con consentimiento:
//
//   <script type="text/plain" data-consent="analitica" data-src="https://..."></script>
//
// (y si fuera Google Analytics / Ads, añadir aquí Consent Mode v2 con los valores
// por defecto en "denied" antes de cargar gtag.js).
//
// El iframe de Power BI del Dashboard NO pasa por este gestor: por decisión del
// proyecto no se modifica su carga. Se informa en la Política de Cookies.

(function () {
    const CLAVE = 'renamu_consentimiento';
    const VERSION = 1;
    const DIAS_VALIDEZ = 365;
    const CATEGORIAS_OPCIONALES = ['analitica'];

    function leer() {
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE));
            if (!guardado || guardado.version !== VERSION) return null;
            const edadDias = (Date.now() - new Date(guardado.fecha).getTime()) / 86400000;
            if (!(edadDias >= 0 && edadDias <= DIAS_VALIDEZ)) return null;
            return guardado;
        } catch (e) {
            return null;
        }
    }

    function guardar(categorias) {
        const registro = { version: VERSION, fecha: new Date().toISOString(), categorias: categorias };
        try {
            localStorage.setItem(CLAVE, JSON.stringify(registro));
        } catch (e) {
            // Navegación privada o almacenamiento bloqueado: la elección vale solo para esta visita
        }
        estado = registro;
        aplicar();
        document.dispatchEvent(new CustomEvent('renamu:consentimiento', { detail: registro }));
    }

    function todas(valor) {
        const categorias = {};
        CATEGORIAS_OPCIONALES.forEach((c) => { categorias[c] = valor; });
        return categorias;
    }

    // Activa los scripts bloqueados de las categorías aceptadas
    function aplicar() {
        if (!estado) return;
        document.querySelectorAll('script[type="text/plain"][data-consent]').forEach((bloqueado) => {
            if (!estado.categorias[bloqueado.dataset.consent]) return;
            const script = document.createElement('script');
            if (bloqueado.dataset.src) script.src = bloqueado.dataset.src;
            else script.textContent = bloqueado.textContent;
            bloqueado.replaceWith(script);
        });
    }

    let estado = leer();
    let banner = null;
    let dialogo = null;
    let origenFoco = null;

    function crearBanner() {
        banner = document.createElement('section');
        banner.className = 'cookie-banner';
        banner.setAttribute('aria-labelledby', 'cookieBannerTitulo');
        banner.innerHTML = `
            <div class="cookie-banner-inner">
                <div class="cookie-banner-text">
                    <h2 id="cookieBannerTitulo">Tu privacidad en este sitio</h2>
                    <p>
                        No usamos cookies de analítica ni de publicidad. Solo guardamos tu elección
                        en este navegador. El reporte Power BI del Dashboard es un servicio de Microsoft
                        que puede usar sus propias cookies. Los datos que envíes por el formulario de
                        contacto se tratan según la Política de Privacidad. Más detalles en la
                        <a href="cookies.html">Política de Cookies</a> y la
                        <a href="privacidad.html">Política de Privacidad</a>.
                    </p>
                </div>
                <div class="cookie-banner-actions">
                    <button type="button" class="btn btn-outline btn-sm" data-cookie-accion="rechazar">Rechazar</button>
                    <button type="button" class="btn btn-outline btn-sm" data-cookie-accion="configurar">Configurar</button>
                    <button type="button" class="btn btn-primary btn-sm" data-cookie-accion="aceptar">Aceptar</button>
                </div>
            </div>`;

        banner.addEventListener('click', (e) => {
            const boton = e.target.closest('[data-cookie-accion]');
            if (!boton) return;
            const accion = boton.dataset.cookieAccion;
            if (accion === 'aceptar') { guardar(todas(true)); cerrarBanner(); }
            else if (accion === 'rechazar') { guardar(todas(false)); cerrarBanner(); }
            else abrirDialogo(boton);
        });

        // Justo después del enlace "Saltar al contenido": se alcanza pronto con el teclado
        const skip = document.querySelector('.skip-link');
        if (skip) skip.after(banner); else document.body.prepend(banner);
    }

    function cerrarBanner() {
        if (!banner) return;
        const teniaFoco = banner.contains(document.activeElement);
        banner.remove();
        banner = null;
        // Que el foco no se pierda en un elemento que ya no existe
        if (teniaFoco) {
            const main = document.getElementById('contenido');
            if (main) { main.setAttribute('tabindex', '-1'); main.focus(); }
        }
    }

    function crearDialogo() {
        dialogo = document.createElement('dialog');
        dialogo.className = 'cookie-dialog';
        dialogo.setAttribute('aria-labelledby', 'cookieDialogoTitulo');
        dialogo.setAttribute('aria-describedby', 'cookieDialogoDesc');
        dialogo.innerHTML = `
            <form method="dialog" class="cookie-dialog-form">
                <h2 id="cookieDialogoTitulo">Configurar cookies</h2>
                <p id="cookieDialogoDesc">Elige qué categorías opcionales permites. Puedes cambiarlo cuando quieras desde el enlace «Configurar cookies» del pie de página.</p>

                <fieldset class="cookie-cat">
                    <legend>Necesarias</legend>
                    <label class="cookie-switch">
                        <input type="checkbox" checked disabled aria-describedby="cookieDescNecesarias">
                        <span>Siempre activas</span>
                    </label>
                    <p id="cookieDescNecesarias">Guardan tu elección sobre cookies en este navegador (<code>localStorage</code>). Sin ellas tendríamos que preguntarte en cada página.</p>
                </fieldset>

                <fieldset class="cookie-cat">
                    <legend>Analítica y medición</legend>
                    <label class="cookie-switch">
                        <input type="checkbox" name="analitica" aria-describedby="cookieDescAnalitica">
                        <span>Permitir</span>
                    </label>
                    <p id="cookieDescAnalitica">Actualmente el sitio no utiliza ninguna herramienta de analítica. Si se incorpora alguna, solo se activará si marcas esta opción.</p>
                </fieldset>

                <fieldset class="cookie-cat">
                    <legend>Contenido de terceros · Power BI (Microsoft)</legend>
                    <p>El reporte incrustado en el Dashboard lo sirve Microsoft desde <code>app.powerbi.com</code> y puede instalar sus propias cookies al cargarse. Esta configuración no lo controla; consulta la <a href="cookies.html#terceros">Política de Cookies</a>.</p>
                </fieldset>

                <div class="cookie-dialog-actions">
                    <button type="button" class="btn btn-outline btn-sm" data-cookie-dialogo="rechazar">Rechazar opcionales</button>
                    <button type="button" class="btn btn-outline btn-sm" data-cookie-dialogo="aceptar">Aceptar todas</button>
                    <button type="button" class="btn btn-primary btn-sm" data-cookie-dialogo="guardar">Guardar selección</button>
                </div>
                <button type="button" class="cookie-dialog-close" data-cookie-dialogo="cerrar" aria-label="Cerrar sin guardar">
                    <span class="material-icons" aria-hidden="true">close</span>
                </button>
            </form>`;

        dialogo.addEventListener('click', (e) => {
            const boton = e.target.closest('[data-cookie-dialogo]');
            if (!boton) return;
            const accion = boton.dataset.cookieDialogo;
            if (accion === 'aceptar') guardar(todas(true));
            else if (accion === 'rechazar') guardar(todas(false));
            else if (accion === 'guardar') {
                const categorias = {};
                CATEGORIAS_OPCIONALES.forEach((c) => {
                    const input = dialogo.querySelector(`input[name="${c}"]`);
                    categorias[c] = Boolean(input && input.checked);
                });
                guardar(categorias);
            }
            if (accion !== 'cerrar') cerrarBanner();
            cerrarDialogo();
        });

        // Esc cierra el diálogo de forma nativa; se devuelve el foco igual
        dialogo.addEventListener('close', restaurarFoco);
        dialogo.addEventListener('cancel', () => setTimeout(restaurarFoco, 0));

        document.body.appendChild(dialogo);
    }

    function cerrarDialogo() {
        if (dialogo.open) dialogo.close();
        else dialogo.removeAttribute('open');
        // Síncrono: Chrome no siempre dispara "close" si el foco no estaba en la página
        restaurarFoco();
    }

    // Devolver el foco a quien abrió el diálogo (WCAG 2.4.3)
    function restaurarFoco() {
        if (origenFoco === null) return;
        if (origenFoco && document.contains(origenFoco)) {
            origenFoco.focus();
        } else {
            // El botón "Configurar" del aviso ya no existe si se guardó una elección
            const main = document.getElementById('contenido');
            if (main) { main.setAttribute('tabindex', '-1'); main.focus(); }
        }
        origenFoco = null;
    }

    function abrirDialogo(origen) {
        if (!dialogo) crearDialogo();
        origenFoco = origen || document.activeElement;
        CATEGORIAS_OPCIONALES.forEach((c) => {
            const input = dialogo.querySelector(`input[name="${c}"]`);
            if (input) input.checked = Boolean(estado && estado.categorias[c]);
        });
        if (typeof dialogo.showModal === 'function') {
            dialogo.showModal();
        } else {
            // Navegadores sin <dialog>: se muestra igual, sin fondo modal
            dialogo.setAttribute('open', '');
        }
        const primero = dialogo.querySelector('input:not([disabled])');
        if (primero) primero.focus();
    }

    window.RENAMUConsentimiento = {
        estado: () => estado,
        permitido: (categoria) => Boolean(estado && estado.categorias[categoria]),
        abrir: abrirDialogo
    };

    function iniciar() {
        document.addEventListener('click', (e) => {
            const disparador = e.target.closest('[data-abrir-cookies]');
            if (!disparador) return;
            e.preventDefault();
            abrirDialogo(disparador);
        });

        if (estado) aplicar();
        else crearBanner();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
