# RENAMU · Sitio web

Sitio estático que publica el **Registro Nacional de Municipalidades (RENAMU)** del INEI:
el reporte Power BI, un buscador del registro, estadísticas agregadas y las descargas
de los datos. Cubre los levantamientos **2021 a 2025** (Módulo I — datos generales y
Módulo II — equipamiento y TIC).

## Estructura

```
RENAMU_web/
├── index.html            Portada
├── dashboard.html        Reporte Power BI + buscador con filtros y tabla (sin paginar)
├── estadisticas.html     Agregados por departamento, tipo, conectividad y autoridades
├── datos.html            Descargas (CSV/JSON/PDF) y diccionario de campos
├── contacto.html         Formulario (se envía a Google Apps Script)
├── 404.html              Página de error personalizada (la usa GitHub Pages automáticamente)
├── css/style.css         Toda la hoja de estilos del sitio
├── js/
│   ├── main.js           Navbar, menú móvil, animación de entrada, toast y utilidades
│   ├── dashboard.js      Filtros, orden y render de la tabla de municipalidades
│   ├── estadisticas.js   Cálculo y render de los gráficos
│   └── datos.js          Generación de los archivos CSV/JSON en el navegador
├── data/
│   ├── municipios.js         Cargador: descarga el año pedido bajo demanda
│   └── municipios_YYYY.js    Un archivo por año (~6,9 MB, 121 campos por municipalidad)
├── docs/
│   └── renamu_diccionario_YYYY.pdf   Diccionario oficial de variables del INEI (2022-2025)
├── favicon.svg           Ícono del sitio (marca INEI/RENAMU)
├── apple-touch-icon.png  Ícono para agregar el sitio a la pantalla de inicio (iOS)
├── og-image.png          Imagen de vista previa al compartir el sitio (Open Graph/Twitter Card)
├── robots.txt            Permite el rastreo completo y apunta al sitemap
├── sitemap.xml           Listado de páginas para buscadores
├── .nojekyll             Evita que GitHub Pages procese el sitio con Jekyll
└── .vscode/              Configuración del editor
```

## Cómo se cargan los datos

Cada archivo `municipios_YYYY.js` pesa cerca de 7 MB, así que **no se incluyen todos en
el HTML**. `data/municipios.js` expone `window.RENAMU` y descarga sólo el año que la
página necesita, inyectando su `<script>` la primera vez que se pide:

```js
window.RENAMU.anios          // [2021, 2022, 2023, 2024, 2025]
window.RENAMU.anioActual     // año activo
window.RENAMU.datos()        // registros ya cargados del año activo
window.RENAMU.setAnio(2023)  // cambia de año -> Promise con los datos
window.RENAMU.cargar(2023)   // carga un año sin cambiar el activo
window.RENAMU.estaCargado(2023)
```

Se usa inyección de `<script>` y no `fetch()` a propósito: así el sitio también funciona
al abrir los archivos directamente con `file://`.

Los archivos de datos declaran `const municipiosYYYY = [...]`. Un `const` de nivel
superior **no** queda colgado de `window`, por eso el cargador resuelve el identificador
con `new Function(...)`.

## Cifras del registro

| Año  | Municipalidades |
|------|-----------------|
| 2021 | 1,874 |
| 2022 | 1,874 |
| 2023 | 1,891 |
| 2024 | 1,891 |
| 2025 | 1,891 |

25 departamentos y 196 provincias; 121 campos por municipalidad.

## Cómo ejecutarlo

Basta abrir `index.html` en el navegador. Para trabajar con recarga y rutas limpias:

```bash
python -m http.server 8000
# luego: http://localhost:8000
```

En VS Code, `.vscode/launch.json` incluye una configuración que abre `index.html` en Chrome.

## Diccionario de datos (PDF)

`datos.html#diccionario` enlaza el diccionario oficial de variables que el INEI publica
junto a cada base de RENAMU (`docs/renamu_diccionario_YYYY.pdf`, años 2022-2025; no existe
uno para 2021). Son enlaces `<a download>` a archivos estáticos, sin generación en el
navegador ni dependencias externas.

La misma página muestra en HTML la tabla "Variables globales de identificación" que abre
ese PDF (Año, idmunici, ccdd, ccpp, ccdi, Ubigeo, Departamento, Provincia, Distrito), con
su equivalencia a los nombres de campo usados en las descargas CSV/JSON del sitio
(`anio`, `id_municipalidad`, `cod_departamento`...). Nota de calidad de datos: `ubigeo` e
`id_municipalidad` son siempre el mismo código, y `cod_departamento`/`cod_provincia`/
`cod_distrito`/`ubigeo` se publican sin ceros a la izquierda.

Para agregar el diccionario de un año nuevo: copia el PDF a `docs/renamu_diccionario_YYYY.pdf`
y añade su enlace en la lista "También disponible" de `datos.html`.

## Formulario de contacto

`contacto.html` envía el formulario a un despliegue de Google Apps Script. La URL está
en la constante `CONTACTO_SCRIPT_URL` dentro de esa página; si se vuelve a desplegar el
script, hay que actualizarla ahí.

### Captcha propio (sin servicios externos)

El formulario usa dos mecanismos anti-spam que no requieren cuenta ni clave de ningún
proveedor:

- **Honeypot** (`#campoWeb` / `sitio_web`): un campo fuera de pantalla que una persona
  nunca ve ni llena. Si llega con contenido, el envío se descarta silenciosamente (se
  simula éxito) sin llamar al Apps Script.
- **Reto matemático** (`#campoCaptcha` / `captcha_respuesta`): una suma de dos números
  de un dígito generada en `generarCaptcha()`; se vuelve a generar tras cada intento
  fallido o envío exitoso.

Esto filtra bots de formularios genéricos, pero no es tan robusto como reCAPTCHA/hCaptcha
frente a bots dirigidos. Si en el futuro se necesita más protección, la validación real
tendría que moverse también al Apps Script (hoy sólo valida en el navegador).

## Publicar en GitHub Pages

El sitio es 100% estático (HTML/CSS/JS sin build), así que funciona en GitHub Pages sin
configuración adicional: solo hay que servir el contenido de `RENAMU_web/` como raíz del
repositorio (o como carpeta `/docs` de la rama que elijas en Settings → Pages).

El dominio real ya está configurado: **`https://michaeldm05.github.io/`** (sitio servido
en la raíz, no bajo `/RENAMU_web/`). Aparece en `<link rel="canonical">`, `og:url`,
`og:image`, `twitter:image`, los bloques `<script type="application/ld+json">` de las 5
páginas, `sitemap.xml` y `robots.txt`.

Si en el futuro el sitio se muda a otro dominio o a un repositorio de proyecto (que en
GitHub Pages sí añade el nombre del repo a la ruta, ej. `michaeldm05.github.io/otro-repo/`),
hay que reemplazar `michaeldm05.github.io/` por la URL nueva en esos mismos archivos.
`404.html` no necesita cambios (GitHub Pages lo sirve automáticamente para cualquier ruta
que no exista).

## SEO técnico y datos estructurados

- **Metadatos por página**: título, `meta description`, `canonical`, Open Graph y Twitter
  Card propios en cada una de las 5 páginas (no genéricos ni duplicados).
- **`og-image.png`** (1200×630): se genera una sola vez a partir de una plantilla HTML con
  la identidad del sitio; si cambian las cifras destacadas, regenera la imagen y vuelve a
  copiarla (no hay un paso de build automático para esto).
- **Datos estructurados (JSON-LD)**: `index.html` declara `GovernmentOrganization` (INEI),
  `WebSite` y `Dataset` (RENAMU, con sus formatos de descarga); las otras 4 páginas
  declaran `BreadcrumbList` para reforzar su posición en la navegación.
- **Jerarquía de encabezados**: cada página tiene un único `<h1>` y no salta de nivel
  (por ejemplo, los títulos del pie de página son `<h2>`, no `<h4>`, para no saltarse el
  `<h3>` cuando corresponde). Los títulos de "Indicadores clave" en el Dashboard son
  visualmente ocultos (`.sr-only`) sólo para mantener la jerarquía sin duplicar diseño.
- **Favicon real**: `favicon.svg` + `apple-touch-icon.png`, en vez del `data:` URI inline
  que traía la primera versión del sitio (más fácil de mantener y de cachear).

## Accesibilidad y resiliencia frente a fuentes que no cargan

- `.material-icons` limita su ancho (`max-width:1.6em; overflow:hidden`): si la fuente de
  Material Icons no llega a cargar (red bloqueada, CDN caído), el navegador muestra el
  nombre de la liga como texto (p. ej. "rocket_launch") y este límite evita que esa
  palabra suelta rompa el diseño de botones y cabeceras.
- El indicador de orden de las columnas del Dashboard es un triángulo dibujado en CSS
  puro (no un ícono de fuente), así nunca puede aparecer como texto suelto.
- Navegación por teclado: enlace "saltar al contenido", foco visible (`:focus-visible`),
  `aria-current="page"` en el enlace activo (tanto estático en el HTML como reforzado por
  `js/main.js`), `aria-label` en la navegación principal y en los botones sin texto.
