// RENAMU · Formulario de contacto
// (antes estaba en línea en contacto.html; como archivo aparte la página puede
// usar una Content-Security-Policy sin 'unsafe-inline' en script-src)

// Pega aquí la URL de "Aplicación web" que te da Apps Script al desplegar
const CONTACTO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgK9K1XXOFR6PTEWHLTkMLGPEYmpRMdBw5wjlobkd4b9mDYKXrXsID7_pqMbx86pbF/exec';

// Campos que se envían a Apps Script: los mismos de siempre. La casilla de
// consentimiento se valida aquí pero no se envía, para no alterar lo que
// espera el script del servidor.
const CAMPOS_ENVIADOS = ['nombre', 'correo', 'asunto', 'mensaje'];

// Captcha propio: un reto matemático simple + un campo trampa (honeypot).
// No depende de ningún servicio externo ni de una clave de sitio.
let captchaResultado = 0;

function generarCaptcha() {
    const a = 1 + Math.floor(Math.random() * 9);
    const b = 1 + Math.floor(Math.random() * 9);
    captchaResultado = a + b;
    document.getElementById('captchaPregunta').textContent = `${a} + ${b}`;
    document.getElementById('campoCaptcha').value = '';
}

// Error junto al campo (WCAG 3.3.1): el toast desaparece a los 3 s y no todos
// los lectores de pantalla lo asocian con el campo que falló.
function marcarError(idCampo, idError, mensaje) {
    const campo = document.getElementById(idCampo);
    const error = document.getElementById(idError);
    campo.setAttribute('aria-invalid', 'true');
    error.textContent = mensaje;
    error.hidden = false;
}

function limpiarErrores(form) {
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; el.hidden = true; });
}

generarCaptcha();

document.getElementById('formContacto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const boton = form.querySelector('button[type="submit"]');

    const datos = Object.fromEntries(new FormData(form).entries());

    // Honeypot: una persona nunca ve ni llena este campo. Si viene con contenido
    // es un bot; simulamos éxito para no darle pistas de que fue detectado.
    if (datos.sitio_web) {
        form.reset();
        generarCaptcha();
        mostrarToast('Mensaje enviado. Te responderemos pronto.', 'check_circle');
        return;
    }

    limpiarErrores(form);
    const errores = [];

    if (!datos.nombre.trim()) {
        marcarError('campoNombre', 'errorNombre', 'Escribe tu nombre.');
        errores.push('campoNombre');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo.trim())) {
        marcarError('campoCorreo', 'errorCorreo', 'Escribe un correo válido, por ejemplo nombre@dominio.com.');
        errores.push('campoCorreo');
    }
    if (!datos.mensaje.trim()) {
        marcarError('campoMensaje', 'errorMensaje', 'Escribe tu mensaje.');
        errores.push('campoMensaje');
    }
    if (Number(datos.captcha_respuesta) !== captchaResultado) {
        marcarError('campoCaptcha', 'errorCaptcha', 'La verificación no es correcta. Resuelve la nueva operación.');
        errores.push('campoCaptcha');
        generarCaptcha();
    }
    if (!datos.consentimiento) {
        marcarError('campoConsentimiento', 'errorConsentimiento', 'Debes aceptar la Política de Privacidad para enviar el mensaje.');
        errores.push('campoConsentimiento');
    }

    if (errores.length) {
        mostrarToast(errores.length === 1 ? 'Revisa el campo marcado.' : `Revisa los ${errores.length} campos marcados.`, 'error');
        document.getElementById(errores[0]).focus();
        return;
    }

    const envio = {};
    CAMPOS_ENVIADOS.forEach((campo) => { envio[campo] = datos[campo]; });

    boton.disabled = true;
    boton.classList.add('is-busy');

    try {
        const resp = await fetch(CONTACTO_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            // Sin cookies ni referrer completo hacia Google: no hacen falta para enviar el mensaje
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(envio)
        });
        const data = await resp.json();

        if (data.ok) {
            mostrarToast('Mensaje enviado. Te responderemos pronto.', 'check_circle');
            form.reset();
            generarCaptcha();
        } else {
            mostrarToast('No se pudo enviar. Intenta de nuevo.', 'error');
            generarCaptcha();
        }
    } catch (err) {
        mostrarToast('No se pudo enviar. Revisa tu conexión.', 'error');
    } finally {
        boton.disabled = false;
        boton.classList.remove('is-busy');
    }
});
