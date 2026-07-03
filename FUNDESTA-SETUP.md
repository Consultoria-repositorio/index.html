# FUNDESTA — Reporte semanal de actividades

Sistema para que todo el equipo de FUNDESTA reporte semanalmente qué hizo, y para que
coordinación le dé seguimiento a quién reportó qué (y quién no ha reportado). Son dos
páginas nuevas en este mismo sitio:

| Página | Para quién | Qué hace |
|---|---|---|
| `fundesta-reportes.html` | Todo el equipo | Formulario para reportar la semana. Público, sin contraseña. |
| `fundesta-dashboard.html` | Coordinación | Panel con todos los reportes, filtrable por persona y semana, y quién falta por reportar. Protegido con contraseña. |

**La "base de datos" es una Google Sheet.** Cada respuesta del formulario cae automáticamente
en una hoja de cálculo de Google; el dashboard la lee en vivo. No hay servidor ni base de datos
que mantener — Google la aloja gratis y tú puedes abrirla y editarla en cualquier momento.

No hay que tocar código para activarlo: solo crear el formulario en Google y pegar 4 URLs en
`assets/fundesta-config.js`.

---

## Paso 1 — Crear el Google Form

1. Ve a [forms.google.com](https://forms.google.com) y crea un formulario nuevo.
2. Título sugerido: **"Reporte semanal de actividades — FUNDESTA"**.
3. Agrega estas preguntas (los nombres exactos no importan, el dashboard los detecta por
   palabra clave — pero mantén estas palabras en el texto de la pregunta):

   | Pregunta | Tipo | Obligatoria |
   |---|---|---|
   | Nombre completo | Respuesta corta (o Lista desplegable con los nombres del equipo) | Sí |
   | Área / programa | Respuesta corta u Opción múltiple | No |
   | Semana que reporta | **Fecha** (usa el lunes de esa semana) | Sí |
   | Actividades realizadas esta semana | Párrafo | Sí |
   | Logros / resultados | Párrafo | No |
   | Dificultades o bloqueos | Párrafo | No |
   | Prioridades para la próxima semana | Párrafo | No |
   | Horas dedicadas (aprox.) | Respuesta corta | No |
   | Enlaces / evidencias | Respuesta corta | No |

   > Consejo: usar **Lista desplegable** para "Nombre completo" (con los nombres exactos del
   > equipo) evita errores de tipeo que romperían el conteo de "quién no ha reportado".

4. En la pestaña **Respuestas** del formulario, haz clic en el ícono de Sheets (verde) para
   crear la hoja de cálculo de respuestas. Esto crea una nueva Google Sheet vinculada.

---

## Paso 2 — Obtener la URL para incrustar el formulario

1. En el formulario, botón **Enviar** (arriba a la derecha) → pestaña **`<>`** (insertar).
2. Copia la URL que aparece dentro de `src="..."` del código. Termina en `?embedded=true`.
3. Copia también la URL normal del formulario (la de la barra de direcciones, o **Enviar → 🔗**).

---

## Paso 3 — Publicar la hoja de respuestas como CSV

1. Abre la Google Sheet de respuestas (la que creaste en el Paso 1.4).
2. **Archivo → Compartir → Publicar en la Web**.
3. En "Vincular", elige la hoja de respuestas (normalmente "Respuestas de formulario 1").
4. En el segundo desplegable elige **Valores separados por comas (.csv)**.
5. Clic en **Publicar** y confirma.
6. Copia la URL que te da (algo como
   `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`).

   > **Importante sobre privacidad:** "Publicar en la Web" hace que cualquiera con ese enlace
   > (aunque no tenga cuenta de Google) pueda ver los datos en CSV — no aparece listado en
   > ningún buscador ni en la Sheet misma, pero técnicamente no es privado si alguien consigue
   > el enlace. Además, como este repositorio es público en GitHub, cualquiera que revise el
   > código fuente del sitio puede ver ese enlace. Si los reportes contienen información
   > sensible, considera hacer este repositorio **privado** en GitHub (requiere plan de pago
   > para publicar GitHub Pages desde un repo privado) en vez de depender solo de la
   > contraseña del dashboard, que es un candado básico pensado para desanimar el acceso
   > casual, no seguridad real.

7. Copia también el enlace normal de edición de la hoja (para el botón "abrir hoja de
   cálculo" del dashboard).

---

## Paso 4 — Elegir la contraseña del dashboard

El dashboard no guarda la contraseña en texto plano, sino su huella SHA-256. Para generarla:

1. Abre cualquier página en Chrome/Edge/Firefox y presiona `F12` para abrir la consola.
2. Pega esto (cambia `tu-contraseña` por la que quieras usar) y presiona Enter:

   ```js
   crypto.subtle.digest('SHA-256', new TextEncoder().encode('tu-contraseña'))
     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
   ```

3. Copia el texto largo (64 caracteres) que imprime la consola.

---

## Paso 5 — Configurar el sitio

Edita `assets/fundesta-config.js` y reemplaza:

```js
window.FUNDESTA_CONFIG = {
  FORM_EMBED_URL: 'https://docs.google.com/forms/d/e/TU_ID/viewform?embedded=true',
  FORM_DIRECT_URL: 'https://docs.google.com/forms/d/e/TU_ID/viewform',
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/TU_ID/pub?output=csv',
  SHEET_EDIT_URL: 'https://docs.google.com/spreadsheets/d/TU_ID/edit',
  DASHBOARD_PASSWORD_HASH: 'el-hash-de-64-caracteres-del-paso-4',
  EQUIPO: [
    'María Pérez',
    'Juan Rodríguez',
    // ...un nombre por persona, exactamente como lo escriben en el formulario
  ],
};
```

Guarda, haz commit y push. Listo — `fundesta-reportes.html` ya muestra el formulario real y
`fundesta-dashboard.html` ya lee los datos.

---

## Uso semanal

- Comparte el enlace de `fundesta-reportes.html` con todo el equipo (por ejemplo, cada
  viernes por el grupo de WhatsApp o correo interno).
- Coordinación revisa `fundesta-dashboard.html`: totales, filtro por persona/semana, buscador
  de texto libre, y la tarjeta roja de "sin reportar esta semana" (calculada a partir de la
  lista `EQUIPO`).
- El botón **"abrir hoja de cálculo"** del dashboard lleva directo a la Google Sheet, por si
  necesitas corregir un dato a mano o exportarlo a Excel.

## Limitaciones a tener en cuenta

- Los datos publicados como CSV pueden tardar unos minutos en reflejar respuestas nuevas —
  es un retraso normal de la función "Publicar en la Web" de Google, no un error del sitio.
- El candado de contraseña del dashboard es una barrera básica en el navegador, no un sistema
  de autenticación real. No lo uses para datos verdaderamente confidenciales sin las medidas
  del Paso 3.
- Si cambias las preguntas del formulario, el dashboard sigue funcionando mientras el texto de
  cada pregunta conserve las palabras clave que usa para identificarlas (ver la función
  `findKey` en `fundesta-dashboard.html`).
