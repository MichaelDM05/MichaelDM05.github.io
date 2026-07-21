// RENAMU · comportamiento compartido entre páginas

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    // Resaltar el enlace de navegación activo (por si una página olvida la clase)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-links a').forEach((link) => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
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