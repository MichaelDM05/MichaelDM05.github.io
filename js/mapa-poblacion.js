// RENAMU · mapa coroplético de población (Censos Nacionales 2025)
// Réplica del tablero del INEI: vista departamental (por defecto, con el nombre de
// cada ámbito sobre el mapa) y vista distrital, con sus rangos y la misma paleta.
// Requiere js/vendor/d3, js/vendor/topojson-client y data/poblacion_distritos.js

document.addEventListener('DOMContentLoaded', () => {
    const box = document.getElementById('pobMapa');
    if (!box || !window.d3 || !window.topojson || !window.TOPO_DIST || !window.POB_DIST) return;

    const TOPO = window.TOPO_DIST;
    const DATA = window.POB_DIST;
    const PERU = { t: 34157732, h: 16865658 };

    // Rampa de un solo tono en azul INEI, de más a menos población (del azul
    // institucional oscuro al celeste)
    const PALETA = ['#00396E', '#2C55A2', '#1C74C0', '#4A97D6', '#7FB8E6'];
    // Rangos del INEI por nivel. El departamental tiene 26 ámbitos: Lima se divide en
    // Lima Metropolitana y Región Lima, y el Callao va aparte.
    const RANGOS = {
        dep: [[1404634, 10141775], [1033085, 1404633], [709030, 1033084], [372156, 709029], [194828, 372155]],
        dist: [[14671, 1176422], [6019, 14670], [2949, 6018], [1308, 2948], [148, 1307]]
    };
    const UNIDAD = { dep: ['departamento', 'departamentos'], dist: ['distrito', 'distritos'] };

    const esc = typeof escaparHtml === 'function' ? escaparHtml : (s) => String(s);
    const fmt = (n) => (n == null ? '—' : Math.round(n).toLocaleString('es-PE').replace(/[., ]/g, ' '));
    const pct = (a, b) => (b ? (a / b * 100).toFixed(1).replace('.', ',') + '%' : '—');
    const dec = (n) => n.toFixed(1).replace('.', ',');
    const tc = (s) => (s || '').toLowerCase()
        .replace(/(^|[\s(\-])(\p{L})/gu, (m, p, c) => p + c.toUpperCase())
        .replace(/\b(De|Del|La|Las|Los|Y)\b/g, (w) => w.toLowerCase())
        .replace(/^./, (c) => c.toUpperCase());
    const $ = (id) => document.getElementById(id);

    // Nombres con tilde, como los rotula el INEI (la cartografía los trae sin tilde)
    const TILDES = { ANCASH: 'ÁNCASH', APURIMAC: 'APURÍMAC', HUANUCO: 'HUÁNUCO', JUNIN: 'JUNÍN', 'SAN MARTIN': 'SAN MARTÍN' };
    const conTilde = (e) => TILDES[e] || e;

    // ---------- Distritos ----------
    const obj = TOPO.objects.dist;
    const feats = topojson.feature(TOPO, obj).features;
    // Cartografía antigua: dos distritos de Loreto pasaron a la provincia Putumayo con nuevo ubigeo
    const ALIAS = { '160109': '160801', '160114': '160803' };
    feats.forEach((f) => {
        const p = f.properties;
        p.k = ALIAS[p.u] || p.u;
        p.v = DATA[p.k];
    });

    // ---------- Ámbitos departamentales del INEI ----------
    const NOMBRE_DEP = {};   // código de 2 dígitos -> nombre del departamento
    obj.geometries.forEach((g) => { NOMBRE_DEP[g.properties.u.slice(0, 2)] = g.properties.e; });
    const ambitoDe = (ubigeo) => {
        const e = NOMBRE_DEP[ubigeo.slice(0, 2)];
        if (e !== 'LIMA') return e;
        return ubigeo.startsWith('1501') ? 'LIMA METROPOLITANA' : 'REGIÓN LIMA';
    };
    feats.forEach((f) => { f.properties.a = ambitoDe(f.properties.k); });
    const ETIQUETA = {
        'LIMA METROPOLITANA': 'LIMA METROPOLITANA ¹',
        'REGIÓN LIMA': 'REGIÓN LIMA ²',
        CALLAO: 'PROV. CONST. DEL CALLAO'
    };
    const NOMBRE_AMBITO = {
        'LIMA METROPOLITANA': 'Lima Metropolitana',
        'REGIÓN LIMA': 'Región Lima',
        CALLAO: 'Provincia Constitucional del Callao'
    };

    // Totales con todos los distritos del censo (también los que no tienen polígono).
    // La superficie se reconstruye como población / densidad de cada distrito.
    const totales = {};
    Object.entries(DATA).forEach(([k, [t, h, d]]) => {
        const a = ambitoDe(k);
        const s = totales[a] || (totales[a] = { t: 0, h: 0, km2: 0 });
        s.t += t;
        s.h += h;
        if (d) s.km2 += t / d;
    });
    const deps = Object.keys(totales).map((a) => {
        const geoms = obj.geometries.filter((g) => ambitoDe(ALIAS[g.properties.u] || g.properties.u) === a);
        const s = totales[a];
        return {
            type: 'Feature',
            geometry: topojson.merge(TOPO, geoms),
            properties: {
                a,
                e: a === 'LIMA METROPOLITANA' || a === 'REGIÓN LIMA' ? 'LIMA' : a,
                nombre: NOMBRE_AMBITO[a] || tc(conTilde(a)),
                etiqueta: ETIQUETA[a] || conTilde(a),
                v: [s.t, s.h, s.km2 ? s.t / s.km2 : 0]
            }
        };
    });

    const rangoDe = (nivel, t) => RANGOS[nivel].findIndex(([a, b]) => t >= a && t <= b);
    feats.forEach((f) => { f.properties.r = f.properties.v ? rangoDe('dist', f.properties.v[0]) : -1; });
    deps.forEach((f) => { f.properties.r = rangoDe('dep', f.properties.v[0]); });

    // Distritos del censo sin polígono (creados después de la cartografía usada)
    const enMapa = new Set(feats.map((f) => f.properties.k));
    const faltan = Object.keys(DATA).filter((k) => !enMapa.has(k));
    const popFalt = faltan.reduce((s, k) => s + DATA[k][0], 0);
    $('pobGap').textContent = `El censo registra ${fmt(Object.keys(DATA).length)} distritos; ${faltan.length} de creación reciente (${fmt(popFalt)} hab.) no tienen polígono en esta cartografía y no se dibujan, aunque sí suman en los totales.`;

    // ---------- Dibujo ----------
    const svg = d3.select(box.querySelector('svg'));
    const g = svg.append('g');
    const proj = d3.geoMercator();
    const path = d3.geoPath(proj);
    const color = (d) => (d.properties.r >= 0 ? PALETA[d.properties.r] : 'var(--gray-300)');

    const capaDist = g.append('g').attr('class', 'pob-capa');
    const pathsDist = capaDist.selectAll('path').data(feats).join('path').attr('class', 'pob-d').style('fill', color);
    const depMesh = capaDist.append('path').attr('class', 'pob-dep')
        .datum(topojson.mesh(TOPO, obj, (a, b) => (a !== b ? ambitoDe(a.properties.u) !== ambitoDe(b.properties.u) : true)));

    const capaDep = g.append('g').attr('class', 'pob-capa');
    const pathsDep = capaDep.selectAll('path').data(deps).join('path').attr('class', 'pob-d pob-d--dep').style('fill', color);

    // Rótulos: al centro del polígono más grande de cada ámbito. Lima Metropolitana y el
    // Callao son muy pequeños a esta escala: llevan una llamada con línea guía.
    // El Callao, Lima Metropolitana y Región Lima van en una columna de llamadas a la
    // izquierda de la costa, en este orden (¹ arriba, ² debajo). El valor es la fila.
    const LLAMADA = { CALLAO: 0, 'LIMA METROPOLITANA': 1, 'REGIÓN LIMA': 2 };
    // La línea de Región Lima sale de Cañete, al sur de Lima Metropolitana, para que
    // no cruce las otras dos
    const CANETE = { type: 'Feature', geometry: topojson.merge(TOPO, obj.geometries.filter((gm) => gm.properties.u.startsWith('1505'))) };
    // Ajuste fino (px a escala 1) donde dos rótulos vecinos se pisarían
    const DESPLAZA = { LAMBAYEQUE: [-16, 2], CAJAMARCA: [14, 6], AYACUCHO: [-12, 6], APURIMAC: [16, -4] };
    const capaRot = g.append('g').attr('class', 'pob-rotulos').attr('aria-hidden', 'true');
    // Sobre los tres azules más oscuros el rótulo va en blanco para que se lea
    const rotulos = capaRot.selectAll('g').data(deps).join('g').attr('class', 'pob-rot')
        .classed('pob-rot--claro', (d) => d.properties.r >= 0 && d.properties.r <= 2 && !(d.properties.a in LLAMADA));
    rotulos.filter((d) => d.properties.a in LLAMADA).append('line');
    rotulos.append('text').attr('text-anchor', (d) => (d.properties.a in LLAMADA ? 'end' : 'middle'));

    function anclaDe(f) {
        if (f.properties.a === 'REGIÓN LIMA') return path.centroid(CANETE);
        const gm = f.geometry;
        if (gm.type !== 'MultiPolygon') return path.centroid(f);
        let mayor = null, area = -1;
        gm.coordinates.forEach((c) => {
            const pol = { type: 'Polygon', coordinates: c };
            const a = path.area(pol);
            if (a > area) { area = a; mayor = pol; }
        });
        return path.centroid(mayor);
    }

    let W = 0, H = 0, k = 1;
    function ubicarRotulos() {
        const fs = 9.5 / k, dx = (v) => v / k;
        const ref = deps.find((f) => f.properties.a === 'LIMA METROPOLITANA').ancla;
        rotulos.each(function (d) {
            const fila = LLAMADA[d.properties.a];
            const ll = fila !== undefined;
            const dz = DESPLAZA[d.properties.a] || [0, 0];
            const x = d.ancla[0] + dx(dz[0]), y = d.ancla[1] + dx(dz[1]);
            const sel = d3.select(this);
            const tx = ll ? ref[0] + dx(-64) : x, ty = ll ? ref[1] + dx(-26 + fila * 20) : y;
            sel.select('line').attr('x1', x).attr('y1', y).attr('x2', tx + dx(3)).attr('y2', ty - fs * 0.35);
            const t = sel.select('text').attr('x', tx).attr('y', ty).style('font-size', fs + 'px').style('stroke-width', 2.6 / k);
            // Los nombres de dos palabras largas se parten en dos líneas
            const partes = d.properties.etiqueta.length > 14 && !ll ? d.properties.etiqueta.split(' ') : [d.properties.etiqueta];
            const lineas = partes.length > 2 ? [partes.slice(0, -1).join(' '), partes.at(-1)] : partes;
            t.selectAll('tspan').data(lineas).join('tspan')
                .attr('x', tx).attr('dy', (_, i) => (i ? '1.1em' : lineas.length > 1 ? '-0.2em' : '0.35em'))
                .text((s) => s);
        });
    }

    function size() {
        W = box.clientWidth;
        H = Math.max(520, Math.min(760, W * 1.2));
        box.style.height = H + 'px';
        svg.attr('viewBox', `0 0 ${W} ${H}`);
        proj.fitExtent([[24, 16], [W - 60, H - 16]], { type: 'FeatureCollection', features: feats });
        pathsDist.attr('d', path);
        depMesh.attr('d', path);
        pathsDep.attr('d', path);
        deps.forEach((f) => { f.ancla = anclaDe(f); });
        ubicarRotulos();
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
        .on('zoom', (ev) => {
            g.attr('transform', ev.transform);
            if (ev.transform.k !== k) { k = ev.transform.k; ubicarRotulos(); }
        });
    svg.call(zoom).style('touch-action', 'pan-y');
    window.addEventListener('resize', () => { if (box.clientWidth !== W) size(); });

    const zoomTo = (fs) => {
        const [[x0, y0], [x1, y1]] = path.bounds({ type: 'FeatureCollection', features: fs });
        const kk = Math.min(60, 0.88 / Math.max((x1 - x0) / W, (y1 - y0) / H));
        svg.transition().duration(650).call(zoom.transform,
            d3.zoomIdentity.translate(W / 2, H / 2).scale(kk).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
    };
    $('pobZin').onclick = () => svg.transition().call(zoom.scaleBy, 1.6);
    $('pobZout').onclick = () => svg.transition().call(zoom.scaleBy, 1 / 1.6);
    $('pobZreset').onclick = () => { depSel.value = ''; aplicarDep(''); };

    // ---------- Estado: nivel, departamento y rango resaltado ----------
    let nivel = 'dep';
    let depActual = '';
    let rangoOn = -1;
    const visibles = () => (nivel === 'dep' ? pathsDep : pathsDist);
    const actuales = () => (nivel === 'dep' ? deps : feats).filter((f) => !depActual || f.properties.a === depActual);

    function leyenda() {
        const lista = actuales();
        const L = $('pobLeyenda');
        L.innerHTML = '';
        RANGOS[nivel].forEach(([a, b], i) => {
            const n = lista.filter((f) => f.properties.r === i).length;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = rangoOn === i ? 'on' : '';
            btn.setAttribute('aria-pressed', String(rangoOn === i));
            btn.innerHTML = `<i style="background:${PALETA[i]}"></i><span>${fmt(a)} – ${fmt(b)}</span><em>(${n})</em>`;
            btn.onclick = () => { rangoOn = rangoOn === i ? -1 : i; pintar(); };
            L.appendChild(btn);
        });
        $('pobLeyNota').textContent = `Entre paréntesis, número de ${UNIDAD[nivel][1]} en cada rango. Haz clic en un rango para resaltarlo.`;
    }

    function pintar() {
        const esDep = nivel === 'dep';
        capaDep.style('display', esDep ? null : 'none');
        capaRot.style('display', esDep ? null : 'none');
        capaDist.style('display', esDep ? 'none' : null);
        [pathsDep, pathsDist].forEach((p) => p
            .classed('dim', (d) => rangoOn >= 0 && d.properties.r !== rangoOn)
            .classed('out', (d) => !!depActual && d.properties.a !== depActual));
        rotulos.classed('out', (d) => !!depActual && d.properties.a !== depActual);
        leyenda();
    }

    // ---------- Resumen ----------
    function resumen(etiqueta, t, h) {
        $('pobAmbito').textContent = etiqueta;
        $('pobTotal').textContent = fmt(t);
        $('pobH').textContent = `${fmt(h)} (${pct(h, t)})`;
        $('pobM').textContent = `${fmt(t - h)} (${pct(t - h, t)})`;
    }

    const depSel = $('pobDep');
    // Las mismas 26 opciones del INEI: Lima se divide en Lima Metropolitana y Región Lima
    const ordenDe = (a) => (a === 'REGIÓN LIMA' ? 'LIMA REGION' : a);
    deps.map((f) => f.properties).sort((x, y) => ordenDe(x.a).localeCompare(ordenDe(y.a), 'es')).forEach((p) => {
        const o = document.createElement('option');
        o.value = p.a;
        o.textContent = p.nombre;
        depSel.appendChild(o);
    });
    function aplicarDep(e) {
        depActual = e;
        if (e) {
            const dep = deps.find((f) => f.properties.a === e).properties;
            resumen(dep.nombre, dep.v[0], dep.v[1]);
            zoomTo(feats.filter((f) => f.properties.a === e));
        } else {
            resumen('Perú', PERU.t, PERU.h);
            svg.transition().duration(650).call(zoom.transform, d3.zoomIdentity);
        }
        pintar();
    }
    depSel.onchange = () => aplicarDep(depSel.value);

    // ---------- División territorial ----------
    const botonesNivel = document.querySelectorAll('[data-nivel]');
    function cambiarNivel(n) {
        nivel = n;
        rangoOn = -1;
        tip.hidden = true;
        seleccionar(null);
        botonesNivel.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.nivel === n)));
        pintar();
    }
    botonesNivel.forEach((b) => { b.onclick = () => cambiarNivel(b.dataset.nivel); });

    // ---------- Búsqueda de distrito (cambia a la vista distrital) ----------
    const dl = $('pobLista');
    const porEtiqueta = new Map();
    feats.forEach((f) => {
        const p = f.properties;
        const lab = `${tc(p.d)} – ${tc(p.p)}, ${tc(conTilde(p.e))}`;
        porEtiqueta.set(lab, f);
        const o = document.createElement('option');
        o.value = lab;
        dl.appendChild(o);
    });
    $('pobBuscar').addEventListener('change', (ev) => {
        const f = porEtiqueta.get(ev.target.value);
        if (!f) return;
        if (nivel !== 'dist') cambiarNivel('dist');
        seleccionar(f);
        zoomTo([f]);
    });

    // ---------- Ventana emergente y ficha ----------
    const tip = $('pobTip');
    const ficha = $('pobFicha');
    let seleccionado = null;
    const esDepFeat = (p) => p.nombre !== undefined;

    function htmlTip(p) {
        const cab = esDepFeat(p)
            ? `<strong>${esc(p.nombre)}</strong>`
            : `<strong>${esc(tc(p.d))}</strong><span class="pob-tip-pp">${esc(tc(p.p))} · ${esc(tc(conTilde(p.e)))}</span>`;
        if (!p.v) return cab + `<span>Sin dato censal para el ubigeo ${esc(p.u)}.</span>`;
        const [t, h, d] = p.v;
        return cab + `<span class="pob-tip-tot"><small>Población total</small>${fmt(t)}</span>
            <span class="pob-tip-sec">Población por sexo</span>
            <span class="pob-tip-r"><span class="pob-tip-h">Hombres</span><b>${fmt(h)} (${pct(h, t)})</b></span>
            <span class="pob-tip-r"><span class="pob-tip-m">Mujeres</span><b>${fmt(t - h)} (${pct(t - h, t)})</b></span>
            <span class="pob-tip-sec">Densidad de la población</span>
            <b>${dec(d)} hab/km²</b>`;
    }
    function llenarFicha(p) {
        if (!p) {
            ficha.innerHTML = `<p class="pob-vacio">Pasa el cursor o haz clic sobre un ${UNIDAD[nivel][0]} para ver su ficha.</p>`;
            return;
        }
        const dep = esDepFeat(p);
        const cab = dep
            ? `<div class="pob-eyebrow">Ámbito departamental</div><h3>${esc(p.nombre)}</h3>`
            : `<div class="pob-eyebrow">Distrito · ubigeo ${esc(p.k)}</div><h3>${esc(tc(p.d))}</h3><div class="pob-ficha-ruta">Provincia ${esc(tc(p.p))} · ${esc(tc(conTilde(p.e)))}</div>`;
        if (!p.v) { ficha.innerHTML = cab + `<p class="pob-vacio">Sin dato censal para el ubigeo ${esc(p.u)}.</p>`; return; }
        const [t, h, d] = p.v;
        const [a, b] = RANGOS[nivel][p.r];
        ficha.innerHTML = cab + `<dl class="pob-kv">
            <dt>Población total</dt><dd>${fmt(t)}</dd>
            <dt>Hombres</dt><dd>${fmt(h)} · ${pct(h, t)}</dd>
            <dt>Mujeres</dt><dd>${fmt(t - h)} · ${pct(t - h, t)}</dd>
            <dt>Densidad</dt><dd>${dec(d)} hab/km²</dd>
            <dt>Rango INEI</dt><dd>${fmt(a)} – ${fmt(b)}</dd></dl>
            <div class="pob-sexbar" aria-hidden="true"><i class="h" style="width:${h / t * 100}%"></i><i class="m" style="width:${(t - h) / t * 100}%"></i></div>`;
    }
    function seleccionar(f) {
        seleccionado = f;
        [pathsDep, pathsDist].forEach((p) => p.classed('sel', (d) => d === f));
        if (f) {
            visibles().filter((d) => d === f).raise();
            depMesh.raise();
        }
        llenarFicha(f && f.properties);
    }

    [pathsDep, pathsDist].forEach((p) => p.on('mousemove', (ev, d) => {
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
      .on('click', (ev, d) => seleccionar(d)));

    aplicarDep('');
    llenarFicha(null);
});
