# Apreciación de Situación Política · Freddy Bernal

Repositorio de análisis político que evalúa la **situación externa de Freddy Bernal**
(Gobernador del estado Táchira, Venezuela) a través de un tablero **interactivo y visual**,
con **alertas por severidad** en seis entornos políticos:

- 🇻🇪 **Venezuela** (nacional)
- 🇨🇴 **Colombia** (binacional)
- 🟧 **Norte de Santander** (frontera colombiana: Cúcuta / Catatumbo)
- 🏙️ **San Cristóbal** (capital del Táchira)
- 📍 **Táchira** (estado, base territorial)
- 🗺️ **Región Occidental** (Zulia, Mérida, Trujillo, Barinas, Apure)

El análisis se **actualiza automáticamente una vez por semana** mediante la **API de Claude**
(Anthropic), que investiga la coyuntura con **búsqueda web** y se apoya en las noticias del
repositorio. La página es estática y se publica en **GitHub Pages** para consulta en cualquier momento.

---

## Cómo funciona

```
GitHub Actions (lunes 06:00 UTC + manual)
        │  scripts/generar-apreciacion.mjs
        │    • lee data/semana-*.json (contexto de noticias)
        │    • llama a la API de Claude con la herramienta de búsqueda web
        │    • valida y escribe data/apreciacion.json (+ snapshot en data/apreciacion-history/)
        │  git commit + push
        ▼
apreciacion.html  ──fetch('data/apreciacion.json')──►  navegador (GitHub Pages)
```

> **Seguridad:** la clave de la API **nunca** está en el sitio web. Vive únicamente como
> *secret* del repositorio y solo la usa el GitHub Action. El navegador solo lee un JSON estático.

---

## Páginas

| Archivo | Descripción |
|---|---|
| `apreciacion.html` | Tablero de apreciación de situación (filtros por entorno, mini-mapa, alertas por severidad, niveles y tendencias, auto-refresco). |
| `index.html` | Portada de la unidad "Poder & Narrativa" con acceso al tablero. |
| `noticias.html` | Centro de noticias semanal. |
| `data/apreciacion.json` | Apreciación vigente (la genera el workflow). |
| `data/apreciacion-history/` | Histórico de versiones con marca de tiempo. |

---

## Configuración (una sola vez)

1. **Secret de la API.** En GitHub: *Settings → Secrets and variables → Actions → New repository secret*.
   - Nombre: `ANTHROPIC_API_KEY`
   - Valor: tu clave de la API de Anthropic.
2. **Permisos del workflow.** *Settings → Actions → General → Workflow permissions* → **Read and write permissions**.
3. **GitHub Pages.** *Settings → Pages* → *Deploy from a branch* → elige la rama y carpeta raíz (`/`).
   El tablero quedará en `https://<usuario>.github.io/<repo>/apreciacion.html`.

---

## Actualizar manualmente

Desde la pestaña **Actions → "Actualizar Apreciación de Situación" → Run workflow**.
El cron semanal (lunes 06:00 UTC) corre automáticamente sin intervención.

---

## Ejecutar / probar en local

**Tablero estático** (sin necesidad de API):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/apreciacion.html
```

> Debe servirse por HTTP (no `file://`), porque `fetch()` de JSON local se bloquea en `file://`.

**Script de generación** (requiere clave real):

```bash
cd scripts
npm install
ANTHROPIC_API_KEY=sk-... node generar-apreciacion.mjs
```

El script **no sobrescribe** `data/apreciacion.json` si la respuesta del modelo no pasa la
validación (entornos, niveles, tendencias y severidades válidos), protegiendo el tablero en vivo.

---

## Documentos de insumo

Puedes alimentar el análisis con tus propios documentos: coloca PDFs o textos en la carpeta
**`documentos/`** y, en la corrida semanal, el generador los adjunta a la API de Claude (lectura
nativa de PDF) y los **combina con la búsqueda web y las noticias** — no sustituye a internet, lo
complementa. El análisis puede citar cada documento como `documento: <nombre>`. Ver
`documentos/README.md` para el detalle.

## Personalización

- **Prompt del análisis:** edita `scripts/PROMPT.md` (sin tocar código) para ajustar el enfoque.
- **Modelo:** por defecto `claude-opus-4-8`. Puedes cambiarlo con la variable de entorno
  `APRECIACION_MODEL` (p. ej. `claude-sonnet-4-6` para corridas más económicas).
- **Frecuencia:** modifica el `cron` en `.github/workflows/apreciacion.yml`.
- **Entornos / colores:** definidos tanto en `scripts/generar-apreciacion.mjs` (vocabularios)
  como en `apreciacion.html` (estilos). Mantén ambos sincronizados si los cambias.

---

*Unidad Estratégica Poder & Narrativa — "No se trata de reaccionar. Se trata de anticipar."*
