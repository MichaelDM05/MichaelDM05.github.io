// RENAMU · comportamiento compartido entre páginas

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const marcarScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
        window.addEventListener('scroll', marcarScroll, { passive: true });
        marcarScroll();
    }

    // Menú móvil
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
        const cerrar = () => {
            links.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        };

        toggle.addEventListener('click', () => {
            const abierto = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(abierto));
        });

        links.querySelectorAll('a').forEach((a) => a.addEventListener('click', cerrar));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
        window.addEventListener('resize', () => { if (window.innerWidth > 860) cerrar(); });
    }

    // Sin IntersectionObserver el contenido debe verse igual, no quedarse en opacity:0
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    } else {
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    }

    // Resaltar el enlace de navegación activo (por si una página olvida la clase)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-links a').forEach((link) => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
});

// Disponible globalmente para cualquier página que necesite notificar al usuario
function mostrarToast(mensaje, icono) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const msgEl = document.getElementById('toastMessage');
    const iconEl = toast.querySelector('.toast-icon');
    if (msgEl) msgEl.textContent = mensaje;
    if (iconEl && icono) iconEl.textContent = icono;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3200);
}

// Los datos vienen de archivos locales del INEI, pero igual se escapan antes de
// inyectarlos con innerHTML: un apóstrofo o un "&" en un nombre no debe romper la tabla.
function escaparHtml(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function numeroPE(n) {
    return Number(n || 0).toLocaleString('es-PE');
}

// "PERCY ZUTA  CASTILLO" -> "Percy Zuta Castillo"
function tituloCaso(str) {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
