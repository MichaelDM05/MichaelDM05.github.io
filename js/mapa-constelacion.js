// RENAMU · constelación del hero: el mapa del Perú dibujado con miles de
// triángulos blancos y celestes que se reúnen al cargar, flotan y se apartan del cursor.
// Requiere data/mapa-peru-paths.js. Sin JS, o si el navegador no puede, queda el
// mapa estático (img/mapa-peru.svg) tal cual.

document.addEventListener('DOMContentLoaded', () => {
    const box = document.querySelector('.hero-map');
    const DEPS = window.PERU_DEPS;
    if (!box || !Array.isArray(DEPS) || typeof Path2D !== 'function') return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lienzo del SVG del hero (viewBox 0 0 572 500). Los trazos de PERU_DEPS están
    // en coordenadas locales de img/mapa-peru.svg, que el hero coloca desplazado
    // (x + 110, y + 20).
    const ANCHO = 572;
    const ALTO = 500;
    const DX = 110;
    const DY = 20;

    // Sobre el campo azul institucional: blancos y celestes, del más claro al de
    // referencia del INEI (R0 G143 B213)
    const COLORES = [
        ['#FFFFFF', 30], ['#BFE4F7', 24], ['#5CB8E6', 26], ['#008FD5', 12], ['#E3F2FB', 8]
    ];
    const bolsa = COLORES.flatMap(([c, peso]) => Array(peso).fill(c));
    const colorAzar = () => bolsa[Math.floor(Math.random() * bolsa.length)];

    const rutas = DEPS.map((d) => {
        const p = new Path2D();
        p.addPath(new Path2D(d), { a: 1, b: 0, c: 0, d: 1, e: DX, f: DY });
        return p;
    });

    // --- Muestreo: puntos dentro del territorio y, más densos, sobre los límites ---
    const dentro = (x, y) => rutas.some((r) => ctx.isPointInPath(r, x, y));
    const enBorde = (x, y) => rutas.some((r) => ctx.isPointInStroke(r, x, y));

    const particulas = [];
    const nueva = (x, y, extra) => Object.assign({
        hx: x, hy: y,                                   // posición de reposo
        x: Math.random() * ANCHO, y: Math.random() * ALTO, // de dónde llega
        vx: 0, vy: 0,
        t: 1.4 + Math.random() * 2.4,                   // tamaño (px del lienzo)
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.012,
        fase: Math.random() * Math.PI * 2,
        amp: 0.6 + Math.random() * 1.6,
        color: colorAzar(),
        alfa: 0.55 + Math.random() * 0.45
    }, extra);

    let intentos = 0;
    while (particulas.length < 1500 && intentos < 40000) {
        intentos++;
        const x = 110 + Math.random() * 300;
        const y = 20 + Math.random() * 440;
        if (dentro(x, y)) particulas.push(nueva(x, y));
    }

    ctx.lineWidth = 1.6;
    intentos = 0;
    let borde = 0;
    while (borde < 700 && intentos < 60000) {
        intentos++;
        const x = 105 + Math.random() * 310;
        const y = 15 + Math.random() * 450;
        if (enBorde(x, y)) {
            particulas.push(nueva(x, y, { t: 1.2 + Math.random() * 1.4, alfa: 0.8 + Math.random() * 0.2 }));
            borde++;
        }
    }

    // Polvo ambiental: pocas partículas tenues que derivan por todo el lienzo
    const polvo = Array.from({ length: 110 }, () => ({
        x: Math.random() * ANCHO, y: Math.random() * ALTO,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
        t: 1.2 + Math.random() * 2, rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.01, color: colorAzar(), alfa: 0.12 + Math.random() * 0.25
    }));

    if (!particulas.length) return;

    canvas.className = 'hero-constelacion';
    canvas.setAttribute('aria-hidden', 'true');
    box.prepend(canvas);
    box.classList.add('con-constelacion');

    // --- Tamaño y densidad de píxeles ---
    let escala = 1;
    const ajustar = () => {
        const ancho = box.clientWidth;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        escala = ancho / ANCHO;
        canvas.width = Math.round(ancho * dpr);
        canvas.height = Math.round(ancho * (ALTO / ANCHO) * dpr);
        ctx.setTransform(dpr * escala, 0, 0, dpr * escala, 0, 0);
    };
    ajustar();

    // --- Dibujo ---
    const triangulo = (x, y, t, rot) => {
        ctx.moveTo(x + Math.cos(rot) * t, y + Math.sin(rot) * t);
        ctx.lineTo(x + Math.cos(rot + 2.094) * t, y + Math.sin(rot + 2.094) * t);
        ctx.lineTo(x + Math.cos(rot + 4.189) * t, y + Math.sin(rot + 4.189) * t);
        ctx.closePath();
    };

    const pintar = (lista, alfaExtra) => {
        // Agrupado por color: un trazo por color en vez de uno por partícula
        const porColor = new Map();
        for (const p of lista) {
            if (!porColor.has(p.color)) porColor.set(p.color, []);
            porColor.get(p.color).push(p);
        }
        ctx.lineWidth = 0.9;
        for (const [color, grupo] of porColor) {
            ctx.strokeStyle = color;
            for (const p of grupo) {
                ctx.globalAlpha = p.alfa * alfaExtra(p);
                ctx.beginPath();
                triangulo(p.x, p.y, p.t, p.rot);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    };

    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) {
        for (const p of particulas) { p.x = p.hx; p.y = p.hy; }
        ctx.clearRect(0, 0, ANCHO, ALTO);
        pintar(polvo, () => 1);
        pintar(particulas, () => 1);
        window.addEventListener('resize', () => {
            ajustar();
            ctx.clearRect(0, 0, ANCHO, ALTO);
            pintar(polvo, () => 1);
            pintar(particulas, () => 1);
        });
        return;
    }

    // --- Cursor: las partículas cercanas se apartan y vuelven ---
    const cursor = { x: -999, y: -999 };
    box.addEventListener('pointermove', (ev) => {
        const r = canvas.getBoundingClientRect();
        cursor.x = (ev.clientX - r.left) / escala;
        cursor.y = (ev.clientY - r.top) / escala;
    });
    box.addEventListener('pointerleave', () => { cursor.x = -999; cursor.y = -999; });

    const RADIO = 46;
    let tiempo = 0;
    let anterior = 0;
    let activo = true;
    let pedido = 0;

    // Un paso de física equivale a 1/60 s; se dan tantos pasos como tiempo real
    // haya pasado (máx. 4), así la animación va igual en pantallas de 60 o 120 Hz
    // y no se dispara tras una pausa.
    const cuadro = (ahora) => {
        const pasos = anterior ? Math.min(Math.round((ahora - anterior) / 16.67), 4) : 1;
        anterior = ahora;
        for (let i = 0; i < pasos; i++) paso();
        dibujar();
        if (activo) pedido = requestAnimationFrame(cuadro);
    };

    const paso = () => {
        tiempo += 1 / 60;
        // Entrada: durante ~2 s el resorte es más suave para que el mapa "se forme"
        const llegada = Math.min(tiempo / 2.2, 1);
        const resorte = 0.012 + llegada * 0.03;

        for (const p of particulas) {
            const ox = p.hx + Math.sin(tiempo * 0.9 + p.fase) * p.amp;
            const oy = p.hy + Math.cos(tiempo * 0.7 + p.fase) * p.amp;
            p.vx += (ox - p.x) * resorte;
            p.vy += (oy - p.y) * resorte;

            const dx = p.x - cursor.x;
            const dy = p.y - cursor.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < RADIO * RADIO && d2 > 0.01) {
                const d = Math.sqrt(d2);
                const f = (1 - d / RADIO) * 1.6;
                p.vx += (dx / d) * f;
                p.vy += (dy / d) * f;
            }

            p.vx *= 0.86;
            p.vy *= 0.86;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
        }

        for (const q of polvo) {
            q.x += q.vx; q.y += q.vy; q.rot += q.vr;
            if (q.x < -5) q.x = ANCHO + 5; else if (q.x > ANCHO + 5) q.x = -5;
            if (q.y < -5) q.y = ALTO + 5; else if (q.y > ALTO + 5) q.y = -5;
        }
    };

    const dibujar = () => {
        ctx.clearRect(0, 0, ANCHO, ALTO);
        pintar(polvo, () => 1);
        // Centelleo suave e individual
        pintar(particulas, (p) => 0.75 + 0.25 * Math.sin(tiempo * 2 + p.fase * 3));
    };

    // Solo se anima mientras el hero está a la vista y la pestaña visible
    const reanudar = () => {
        if (activo || document.hidden) return;
        activo = true;
        anterior = 0;
        pedido = requestAnimationFrame(cuadro);
    };
    const pausar = () => { activo = false; cancelAnimationFrame(pedido); };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => (e.isIntersecting ? reanudar() : pausar())).observe(box);
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? pausar() : reanudar()));
    window.addEventListener('resize', ajustar);

    pedido = requestAnimationFrame(cuadro);
});
