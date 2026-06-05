# Documentos de insumo

Esta carpeta es la **bandeja de entrada de documentos** para el análisis. Todo lo que coloques
aquí se envía a Claude en la corrida semanal y se combina con la **búsqueda web** y las
**noticias** del repositorio (no reemplaza a internet: lo complementa).

## Cómo usarla
1. Sube tus archivos a esta carpeta (por ejemplo, arrastrándolos en GitHub o por commit).
2. En la próxima ejecución del workflow, el generador los adjunta a la API de Claude.
3. El análisis resultante puede citar cada documento en las alertas como
   `documento: <nombre del archivo>`.

## Formatos admitidos
- **PDF** (`.pdf`) — Claude los lee de forma nativa (texto, tablas, gráficos).
- **Texto** (`.txt`, `.md`, `.csv`) — se incluyen como texto plano.

## Recomendaciones
- Nombres claros y con fecha, p. ej. `tachira-servicios-publicos-2026-05.pdf`.
- Evita documentos enormes (límite práctico ~32 MB por corrida sumando todos).
- Si un documento deja de ser relevante, bórralo de la carpeta para no sobrecargar el análisis.
- `README.md` y los archivos ocultos se ignoran automáticamente.
