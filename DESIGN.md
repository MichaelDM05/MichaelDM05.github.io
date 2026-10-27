# RENAMU · Sistema visual v5

> Versión aplicada desde el lienzo de Claude Design "RENAMU · Rediseño de páginas" (27/10/2026).
> Sustituye la paleta y la tipografía de la v3 descrita más abajo; las reglas de datos siguen vigentes
> salvo donde se indica.

- **Campos:** marino `#0A2540` con trama de puntos (hero, cabeceras de página, tarjetas destacadas);
  `#071B30` en la franja institucional y el pie. Lienzo blanco, superficie `#F4F7FB`, chip `#EAF2FA`.
- **Acción y datos:** azul `#2C55A2` (hover `#1F4282`). Acento naranja `#E8692E` solo como punto o
  cifra que cambia. Celeste `#8FCBF0` para etiquetas sobre marino.
- **Texto:** `#0B1F33`, apoyo `#33475C`, notas `#4A5D73`; sobre marino `#C4D3E2`.
- **Tipografía:** titulares en Archivo 700/800, texto en Inter, etiquetas en IBM Plex Mono mayúsculas
  (`01 · Organización territorial`). Todas alojadas en `fonts/`.
- **Formas:** botones en píldora sin mayúsculas, tarjetas con borde de 1 px y radio 14–22 px.
- **Datos:** serie consolidada `#2C55A2`, año que cambia `#E8692E`, años base `#A9CFEE` (con etiqueta
  de valor directa en cada barra, porque el celeste claro no llega a 3:1 sobre blanco). Coroplético de
  población sin cambios salvo el segundo rango (`#2C55A2`).
- **Se conservan:** el mapa del hero con la constelación y las municipalidades por departamento, y el
  mapa interactivo de población por distrito.

---

---
version: 3
name: RENAMU-INEI (institucional)
description: "Portal estadístico del Registro Nacional de Municipalidades (INEI). Colores institucionales del INEI (azul, celeste y blanco) sobre la estructura del sistema 'constellation': titulares escultóricos en peso 400 a gran escala, texto de apoyo ligero, una sola acción rellena por vista y el mapa del Perú dibujado como constelación de partículas como figura de marca."

colors:
  brand: "#0055A2"         # Azul INEI · R0 G85 B162 · C95 M66 Y0 K0. Hero, cabeceras, pie, botón, títulos de tabla, enlaces
  brand-deep: "#00427F"    # hover del botón, pie de página
  celeste: "#5CB8E6"       # celeste suave (más bajo que el de referencia); vive sobre el azul: mapa, pines, series
  celeste-ref: "#008FD5"   # celeste de referencia INEI · R0 G143 B213 · C100 M16 Y0 K0; en la constelación
  white: "#FFFFFF"         # lienzo de todo el contenido y texto sobre azul
  on-brand: "#D7E6F4"      # texto secundario sobre azul
  ink: "#0F2A44"           # texto sobre blanco (azul casi negro)
  ink-soft: "#4E6178"      # notas, etiquetas de cifras, navegación inactiva
  surface: "#F1F6FB"       # paneles funcionales (filtros, tablas, formularios, mapa)

typography:
  family: "Inter (variable, alojada en /fonts)"
  features: '"ss01" on, tabular-nums'
  display: { size: "clamp(3rem, 7.6vw, 113px)", weight: 400, tracking: "-0.04em", leading: 0.95 }
  heading-lg: { size: "clamp(2.75rem, 6vw, 78px)", weight: 400, tracking: "-0.04em" }
  heading: { size: "clamp(2.25rem, 3.8vw, 52px)", weight: 400, tracking: "-0.035em" }
  stat: { size: "clamp(2.5rem, 4.4vw, 64px)", weight: 400, tracking: "-0.04em" }
  body: { size: 18px, weight: "300 sobre blanco, 200 sobre azul", leading: 1.5 }
  nav-label: { size: 14px, weight: 600, transform: uppercase, tracking: "0.025em" }

rounded: { buttons: 24px, logo: 10px, panels: 4px }
spacing: { section: "120px (80px en ≤768px)", container: "1160px, márgenes 28px (16px en móvil)" }
---

## Reglas

- **Campos azules, contenido en blanco.** El hero, las cabeceras de página, el pie y las tarjetas de
  series de Estadísticas son campos azul INEI con texto blanco; todo lo demás va sobre blanco con
  texto `ink`.
- **Celeste solo sobre azul.** Es el color de la constelación, los pines y las series de datos dentro
  de los campos azules. Sobre blanco no se usa para texto (no alcanza contraste); ahí manda el azul.
- **Una acción rellena por vista.** Píldora azul con texto blanco sobre fondo blanco; sobre el campo
  azul del hero se invierte (píldora blanca, texto azul). Lo secundario es texto sin contenedor.
- **Jerarquía por escala, no por peso.** Titulares en 400 con tracking negativo.
- **Un solo momento de movimiento:** la constelación del hero. Las secciones no tienen entradas animadas.
- **Datos (validados con el skill dataviz, `validate_palette.js`).** Los gráficos van sobre
  superficie clara, nunca sobre el campo azul (ahí los colores no pasan la banda de luminosidad).
  - Categórica, máximo 3 series: azul INEI `#0055A2`, naranja `#EB6834`, celeste de referencia
    `#008FD5`. Pasa todos los pares, protan/deutan (ΔE ≥ 17) y visión normal. El naranja queda en
    2,94:1 sobre `#F1F6FB`, por eso las barras llevan siempre su valor escrito.
  - Serie de padrón: base = celeste `#008FD5`, cambio = naranja, nivel consolidado = azul INEI.
  - Mapa de población (ordinal, 5 rangos): `#7FB8E6 → #4A97D6 → #1C74C0 → #0055A2 → #00396E`.
    El paso más claro mantiene 2,1:1 sobre blanco. Distrito seleccionado: trazo naranja.
  - El texto de los gráficos va en tinta (`ink`, `#2E4A5E`, `ink-soft`), nunca en el color de la serie.
  - Si hacen falta más de 3 series, se agrupan en "Otros" o se separan en gráficos pequeños; no se
    inventan colores nuevos.
