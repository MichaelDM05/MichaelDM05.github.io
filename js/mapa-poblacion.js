// RENAMU · mapa coroplético de población por distrito (Censos Nacionales 2025)
// Requiere js/vendor/d3, js/vendor/topojson-client y data/poblacion_distritos.js

document.addEventListener('DOMContentLoaded', () => {
    const box = document.getElementById('pobMapa');
    if (!box || !window.d3 || !window.topojson || !window.TOPO_DIST || !window.POB_DIST) return;

    const TOPO = window.TOPO_DIST;
    const DATA = window.POB_DIST;
    const PERU = { t: 34157732, h: 16865658, m: 17292074 };
    // Rangos del INEI para el nivel distrital; la rampa va del celeste claro al azul marino del sitio
    const RANGOS = [
        { a: 14671, b: 1176422, c: '#0A2A43' },
        { a: 6019, b: 14670, c: '#1565C0' },
        { a: 2949, b: 6018, c: '#4A90D9' },
        { a: 1308, b: 2948, c: '#93C2EC' },
        { a: 148, b: 1307, c: '#D6E8F8' }
    ];

    const esc = typeof escaparHtml === 'function' ? escaparHtml : (s) => String(s);
    const fmt = (n) => (n == null ? '—' : Math.round(n).toLocaleString('es-PE').replace(/[., ]/g, ' '));
    const pct = (a, b) => (b ? (a / b * 100).toFixed(1).replace('.', ',') + '%' : '—');
    const tc = (s) => (s || '').toLowerCase()
        .replace(/(^|[\s(\-])(\p{L})/gu, (m, p, c) => p + c.toUpperCase())
        .replace(/\b(De|Del|La|Las|Los|Y)\b/g, (w) => w.toLowerCase())
        .replace(/^./, (c) => c.toUpperCase());
    const rango = (v) => RANGOS.findIndex((r) => v >= r.a && v <= r.b);
    const $ = (id) => document.getElementById(id);

    const obj = TOPO.objects.dist;
    const feats = topojson.feature(TOPO, obj).features;
    // Cartografía antigua: dos distritos de Loreto pasaron a la provincia Putumayo con nuevo ubigeo
    const ALIAS = { '160109': '160801', '160114': '160803' };
    feats.forEach((f) => {
        const p = f.properties;
        p.k = ALIAS[p.u] || p.u;
        p.v = DATA[p.k];
        p.r = p.v ? rango(p.v[0]) : -1;
    });

    // Distritos del censo sin polígono (creados después de la cartografía usada)
    const enMapa = new Set(feats.map((f) => f.properties.k));
    const faltan = Object.keys(DATA).filter((k) => !enMapa.has(k));
    const popFalt = faltan.reduce((s, k) => s + DATA[k][0], 0);
    $('pobGap').textContent = `El censo registra ${fmt(Object.keys(DATA).length)} distritos; ${faltan.length} de creación reciente (${fmt(popFalt)} hab.) no tienen polígono en esta cartografía y no se dibujan, aunque sí suman en el total nacional.`;

    const svg = d3.select(box.querySelector('svg'));
    const g = svg.append('g');
    const proj = d3.geoMercator();
    const path = d3.geoPath(proj);
    const paths = g.selectAll('path').data(feats).join('path')
        .attr('class', 'pob-d')
        .style('fill', (d) => (d.properties.r >= 0 ? RANGOS[d.properties.r].c : 'var(--gray-300)'));
    const depMesh = g.append('path').attr('class', 'pob-dep')
        .datum(topojson.mesh(TOPO, obj, (a, b) => (a !== b ? a.properties.e !== b.properties.e : true)));

    let W = 0, H = 0;
    function size() {
        W = box.clientWidth;
        H = Math.max(520, Math.min(760, W * 1.2));
        box.style.height = H + 'px';
        svg.attr('viewBox', `0 0 ${W} ${H}`);
        proj.fitExtent([[16, 16], [W - 60, H - 16]], { type: 'FeatureCollection', features: feats });
        paths.attr('d', path);
        depMesh.attr('d', path);
    }
    size();

    // La rueda sólo hace zoom con Ctrl/⌘ y el arrastre táctil de un dedo desplaza la página:
    // el mapa está en mitad del inicio y no debe secuestrar el scroll.
    const zoom = d3.zoom().scaleExtent([1, 60])
        .filter((ev) => {
            if (ev.type === 'wheel') return ev.ctrlKey || ev.metaKey;
            if (ev.type === 'touchstart') return ev.touches.length > 1;
            return !ev.button;
        })
        .on('zoom', (ev) => g.attr('transform', ev.transform));
    svg.call(zoom).style('touch-action', 'pan-y');
    window.addEventListener('resize', () => { if (box.clientWidth !== W) size(); });

    const zoomTo = (fs) => {
        const [[x0, y0], [x1, y1]] = path.bounds({ type: 'FeatureCollection', features: fs });
        const k = Math.min(60, 0.88 / Math.max((x1 - x0) / W, (y1 - y0) / H));
        svg.transition().duration(650).call(zoom.transform,
            d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
    };
    $('pobZin').onclick = () => svg.transition().call(zoom.scaleBy, 1.6);
    $('pobZout').onclick = () => svg.transition().call(zoom.scaleBy, 1 / 1.6);
    $('pobZreset').onclick = () => { depSel.value = ''; aplicarDep(''); };

    // Leyenda
    let rangoOn = -1;
    let actual = feats;
    function leyenda() {
        const cnt = RANGOS.map((_, i) => actual.filter((f) => f.properties.r === i).length);
        const L = $('pobLeyenda');
        L.innerHTML = '';
        RANGOS.forEach((r, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = rangoOn === i ? 'on' : '';
            b.setAttribute('aria-pressed', String(rangoOn === i));
            b.innerHTML = `<i style="background:${r.c}"></i><span>${fmt(r.a)} – ${fmt(r.b)}</span><em>(${cnt[i]})</em>`;
            b.onclick = () => {
                rangoOn = rangoOn === i ? -1 : i;
                paths.classed('dim', (d) => rangoOn >= 0 && d.properties.r !== rangoOn);
                leyenda();
            };
            L.appendChild(b);
        });
    }

    // Departamentos
    const depSel = $('pobDep');
    [...new Set(feats.map((f) => f.properties.e))].sort((a, b) => a.localeCompare(b, 'es')).forEach((e) => {
        const o = document.createElement('option');
        o.value = e;
        o.textContent = tc(e);
        depSel.appendChild(o);
    });
    function resumen(etiqueta, t, h) {
        $('pobAmbito').textContent = etiqueta;
        $('pobTotal').textContent = fmt(t);
        $('pobH').textContent = `${fmt(h)} (${pct(h, t)})`;
        $('pobM').textContent = `${fmt(t - h)} (${pct(t - h, t)})`;
    }
    function aplicarDep(e) {
        actual = e ? feats.filter((f) => f.properties.e === e) : feats;
        paths.classed('out', (d) => !!e && d.properties.e !== e);
        if (e) {
            const suma = (i) => actual.reduce((s, f) => s + (f.properties.v ? f.properties.v[i] : 0), 0);
            resumen(tc(e) + ' · distritos en el mapa', suma(0), suma(1));
            zoomTo(actual);
        } else {
            resumen('Perú', PERU.t, PERU.h);
            svg.transition().duration(650).call(zoom.transform, d3.zoomIdentity);
        }
        leyenda();
    }
    depSel.onchange = () => aplicarDep(depSel.value);

    // Búsqueda
    const dl = $('pobLista');
    const porEtiqueta = new Map();
    feats.forEach((f) => {
        const p = f.properties;
        const lab = `${tc(p.d)} – ${tc(p.p)}, ${tc(p.e)}`;
        porEtiqueta.set(lab, f);
        const o = document.createElement('option');
        o.value = lab;
        dl.appendChild(o);
    });
    $('pobBuscar').addEventListener('change', (ev) => {
        const f = porEtiqueta.get(ev.target.value);
        if (!f) return;
        seleccionar(f);
        zoomTo([f]);
    });

    // Ficha y tooltip
    const tip = $('pobTip');
    const ficha = $('pobFicha');
    let seleccionado = null;
    const den = (v) => String(v).replace('.', ',');

    function htmlTip(p) {
        const cab = `<strong>${esc(tc(p.d))}</strong><span class="pob-tip-pp">${esc(tc(p.p))} · ${esc(tc(p.e))}</span>`;
        if (!p.v) return cab + `<span>Sin dato censal para el ubigeo ${esc(p.u)}.</span>`;
        const [t, h, d] = p.v;
        return cab + `<span class="pob-tip-tot">${fmt(t)}<small>habitantes</small></span>
            <span class="pob-tip-r"><span>Hombres</span><b>${fmt(h)} · ${pct(h, t)}</b></span>
            <span class="pob-tip-r"><span>Mujeres</span><b>${fmt(t - h)} · ${pct(t - h, t)}</b></span>
            <span class="pob-tip-r"><span>Densidad</span><b>${den(d)} hab/km²</b></span>`;
    }
    function llenarFicha(p) {
        const cab = `<div class="pob-eyebrow">Distrito · ubigeo ${esc(p.k)}</div><h3>${esc(tc(p.d))}</h3><div class="pob-ficha-ruta">Provincia ${esc(tc(p.p))} · ${esc(tc(p.e))}</div>`;
        if (!p.v) { ficha.innerHTML = cab + `<p class="pob-vacio">Sin dato censal para el ubigeo ${esc(p.u)}.</p>`; return; }
        const [t, h, d] = p.v;
        ficha.innerHTML = cab + `<dl class="pob-kv">
            <dt>Población total</dt><dd>${fmt(t)}</dd>
            <dt>Hombres</dt><dd>${fmt(h)} · ${pct(h, t)}</dd>
            <dt>Mujeres</dt><dd>${fmt(t - h)} · ${pct(t - h, t)}</dd>
            <dt>Densidad</dt><dd>${den(d)} hab/km²</dd>
            <dt>Rango INEI</dt><dd>${fmt(RANGOS[p.r].a)} – ${fmt(RANGOS[p.r].b)}</dd></dl>
            <div class="pob-sexbar" aria-hidden="true"><i class="h" style="width:${h / t * 100}%"></i><i class="m" style="width:${(t - h) / t * 100}%"></i></div>`;
    }
    function seleccionar(f) {
        seleccionado = f;
        paths.classed('sel', (d) => d === f);
        paths.filter((d) => d === f).raise();
        depMesh.raise();
        llenarFicha(f.properties);
    }

    paths.on('mousemove', (ev, d) => {
        tip.hidden = false;
        tip.innerHTML = htmlTip(d.properties);
        const r = box.getBoundingClientRect();
        let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
        if (x + tip.offsetWidth > r.width - 8) x = ev.clientX - r.left - tip.offsetWidth - 14;
        if (y + tip.offsetHeight > r.height - 8) y = ev.clientY - r.top - tip.offsetHeight - 14;
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
        if (!seleccionado) llenarFicha(d.properties);
    }).on('mouseleave', () => { tip.hidden = true; })
      .on('click', (ev, d) => seleccionar(d));

    aplicarDep('');
});
