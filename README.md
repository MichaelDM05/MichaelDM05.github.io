# RENAMU · Sitio web

Sitio estático que publica el **Registro Nacional de Municipalidades (RENAMU)** del INEI:
el reporte Power BI, un buscador del registro, estadísticas agregadas y las descargas
de los datos. Cubre los levantamientos **2021 a 2025** (Módulo I — datos generales y
Módulo II — equipamiento y TIC).

## Estructura

```
RENAMU_web/
├── index.html            Portada
├── dashboard.html        Reporte Power BI + buscador con filtros y tabla paginada
├── estadisticas.html     Agregados por departamento, tipo, conectividad y autoridades
├── datos.html            Descargas (CSV/JSON) y diccionario de campos
├── contacto.html         Formulario (se envía a Google Apps Script)
├── css/style.css         Toda la hoja de estilos del sitio
├── js/
│   ├── main.js           Navbar, menú móvil, animación de entrada, toast y utilidades
│   ├── dashboard.js      Filtros, orden, paginación y control del iframe de Power BI
│   ├── estadisticas.js   Cálculo y render de los gráficos
│   └── datos.js          Generación de los archivos CSV/JSON en el navegador
├── data/
│   ├── municipios.js         Cargador: descarga el año pedido bajo demanda
│   └── municipios_YYYY.js    Un archivo por año (~6,9 MB, 121 campos por municipalidad)
├── docs/
│   └── renamu_diccionario_YYYY.pdf   Diccionario oficial de variables del INEI (2022-2025)
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

### Anti-spam: reCAPTCHA de Google + honeypot

El formulario combina dos mecanismos:

- **reCAPTCHA v2** ("No soy un robot"): el widget se carga con
  `<script src="https://www.google.com/recaptcha/api.js">` y se muestra con
  `<div class="g-recaptcha" data-sitekey="...">` dentro de `contacto.html`. Es gratuito.
  **Para activarlo hace falta una clave propia**, porque una clave de reCAPTCHA queda
  registrada a un dominio concreto:
  1. Entra a <https://www.google.com/recaptcha/admin/create> con una cuenta Google.
  2. Elige **reCAPTCHA v2 → "Casilla de verificación no soy un robot"**.
  3. Agrega el dominio donde vivirá el sitio (y `localhost` si quieres probarlo en tu equipo).
  4. Copia la **clave del sitio** y reemplaza `TU_CLAVE_DE_SITIO_RECAPTCHA` en
     `contacto.html` (buscar `data-sitekey`).
  5. Guarda la **clave secreta** — no va en este repo, va en el Apps Script (ver abajo).

  Mientras la clave sea la de ejemplo, Google muestra su propio aviso
  ("ERROR para el propietario del sitio web: la clave del sitio web no es válida") en
  vez del checkbox; el formulario sigue funcionando pero no deja enviar hasta tener una
  clave real, porque el checkbox nunca llega a marcarse.

- **Honeypot** (`#campoWeb` / `sitio_web`): un campo fuera de pantalla que una persona
  nunca ve ni llena, complementario al de Google y sin costo. Si llega con contenido,
  el envío se descarta silenciosamente (se simula éxito) sin llamar al Apps Script ni
  gastar una verificación de reCAPTCHA.

**El checkbox solo no basta.** Verifica en el navegador que se marcó, pero un bot que
llame directamente a la URL del Apps Script (sin pasar por esta página) puede mandar
cualquier texto en `g-recaptcha-response`. La protección real ocurre cuando el Apps
Script valida ese token contra Google antes de reenviar el correo. Snippet para pegar
en el script (usando la *clave secreta* del paso 5, como `PropertiesService` o una
constante):

```javascript
function esHumano(token) {
  const secreto = 'TU_CLAVE_SECRETA_RECAPTCHA';
  const resp = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'post',
    payload: { secret: secreto, response: token }
  });
  return JSON.parse(resp.getContentText()).success === true;
}

// Al inicio de doPost(e), antes de procesar el resto del body:
const datos = JSON.parse(e.postData.contents);
if (!esHumano(datos['g-recaptcha-response'])) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'captcha' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```
