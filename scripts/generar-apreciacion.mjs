#!/usr/bin/env node
/**
 * generar-apreciacion.mjs
 *
 * Genera data/apreciacion.json con la "Apreciación de Situación Política" de Freddy Bernal
 * llamando a la API de Claude (Anthropic) con la herramienta de búsqueda web, fundamentando
 * el análisis en las noticias semanales del repositorio (data/semana-*.json).
 *
 * Uso:   ANTHROPIC_API_KEY=sk-... node generar-apreciacion.mjs
 *
 * No sobrescribe el JSON existente si la respuesta del modelo no pasa la validación.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const OUT_FILE = join(DATA_DIR, 'apreciacion.json');
const HISTORY_DIR = join(DATA_DIR, 'apreciacion-history');

const MODEL = process.env.APRECIACION_MODEL || 'claude-opus-4-8';

/* ── Vocabularios controlados (deben coincidir con apreciacion.html) ── */
const ENTORNOS = [
  { id: 'venezuela',        nombre: 'Venezuela (Nacional)',     icono: '🇻🇪' },
  { id: 'colombia',         nombre: 'Colombia (Binacional)',    icono: '🇨🇴' },
  { id: 'norte_santander',  nombre: 'Norte de Santander',       icono: '🟧' },
  { id: 'san_cristobal',    nombre: 'San Cristóbal',            icono: '🏙️' },
  { id: 'tachira',          nombre: 'Táchira (Estado)',         icono: '📍' },
  { id: 'region_occidental',nombre: 'Región Occidental',        icono: '🗺️' },
];
const ENTORNO_IDS = ENTORNOS.map((e) => e.id);
const NIVELES = ['critico', 'elevado', 'moderado', 'estable', 'favorable'];
const TENDENCIAS = ['ascendente', 'estable', 'descendente'];
const SEVERIDADES = ['critica', 'alta', 'media', 'baja'];

/* ── Utilidades ── */
function hoyISO() { return new Date().toISOString().slice(0, 10); }

function leerNoticiasRecientes(maxSemanas = 3) {
  let archivos = [];
  try {
    archivos = readdirSync(DATA_DIR)
      .filter((f) => /^semana-\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .reverse()
      .slice(0, maxSemanas);
  } catch { /* sin carpeta data */ }

  const items = [];
  for (const f of archivos) {
    try {
      const json = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf8'));
      const semana = json.semana || f;
      (json.noticias || []).forEach((n) => {
        items.push(`- [${semana}#${n.id}] (${n.categoria || 's/c'}, ${n.fecha || 's/f'}, ${n.fuente || 's/fuente'}) ${n.titulo}: ${n.resumen || ''}`);
      });
    } catch (e) {
      console.warn(`Aviso: no se pudo leer ${f}: ${e.message}`);
    }
  }
  return items.join('\n');
}

function leerApreciacionPrevia() {
  if (!existsSync(OUT_FILE)) return null;
  try { return JSON.parse(readFileSync(OUT_FILE, 'utf8')); }
  catch { return null; }
}

function resumenPrevio(prev) {
  if (!prev || !Array.isArray(prev.entornos)) return 'No hay apreciación previa disponible.';
  return prev.entornos
    .map((e) => `- ${e.id}: nivel=${e.nivel}, tendencia=${e.tendencia}`)
    .join('\n');
}

/* ── Construcción del esquema/instrucción ── */
function bloqueEsquemaYNoticias(noticias, prev) {
  const esquema = {
    generado: 'AAAA-MM-DDTHH:MM:SSZ',
    modelo: MODEL,
    sujeto: 'Freddy Bernal — Gobernador del estado Táchira',
    resumen_ejecutivo: 'string',
    nivel_global: NIVELES.join(' | '),
    tendencia_global: TENDENCIAS.join(' | '),
    entornos: ENTORNOS.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      icono: e.icono,
      resumen: 'string',
      nivel: NIVELES.join(' | '),
      tendencia: TENDENCIAS.join(' | '),
      factores_clave: ['string (3 a 5)'],
      alertas: [{
        id: 'string',
        severidad: SEVERIDADES.join(' | '),
        titulo: 'string',
        descripcion: 'string',
        fecha: 'AAAA-MM-DD',
        fuentes: ['url o identificador de noticia'],
      }],
    })),
  };

  return [
    'ESQUEMA JSON EXACTO que debes devolver (respeta claves, orden de los 6 entornos y vocabularios):',
    '```json',
    JSON.stringify(esquema, null, 2),
    '```',
    '',
    'IDs de entorno obligatorios y en este orden: ' + ENTORNO_IDS.join(', ') + '.',
    '',
    'APRECIACIÓN PREVIA (para calcular la tendencia respecto a la situación anterior):',
    resumenPrevio(prev),
    '',
    'DIGEST DE NOTICIAS DEL REPOSITORIO (contexto local de base; complementa con búsqueda web):',
    noticias || '(sin noticias locales disponibles)',
  ].join('\n');
}

/* ── Extraer y parsear el JSON de la respuesta ── */
function extraerTexto(message) {
  return (message.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function parsearJSON(texto) {
  let t = texto.trim();
  // quitar fences markdown si aparecen
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // recortar al primer { … último }
  const ini = t.indexOf('{');
  const fin = t.lastIndexOf('}');
  if (ini !== -1 && fin !== -1) t = t.slice(ini, fin + 1);
  return JSON.parse(t);
}

/* ── Validación estricta ── */
function validar(data) {
  const err = [];
  if (!data || typeof data !== 'object') return ['La respuesta no es un objeto JSON.'];
  if (!data.resumen_ejecutivo) err.push('Falta resumen_ejecutivo.');
  if (!NIVELES.includes(data.nivel_global)) err.push(`nivel_global inválido: ${data.nivel_global}`);
  if (!TENDENCIAS.includes(data.tendencia_global)) err.push(`tendencia_global inválido: ${data.tendencia_global}`);

  if (!Array.isArray(data.entornos)) {
    err.push('entornos no es un arreglo.');
    return err;
  }
  const ids = data.entornos.map((e) => e && e.id);
  for (const req of ENTORNO_IDS) {
    if (!ids.includes(req)) err.push(`Falta el entorno: ${req}`);
  }
  data.entornos.forEach((e, i) => {
    const tag = `entorno[${i}] (${e && e.id})`;
    if (!e || typeof e !== 'object') { err.push(`${tag} no es objeto.`); return; }
    if (!ENTORNO_IDS.includes(e.id)) err.push(`${tag}: id no reconocido.`);
    if (!NIVELES.includes(e.nivel)) err.push(`${tag}: nivel inválido (${e.nivel}).`);
    if (!TENDENCIAS.includes(e.tendencia)) err.push(`${tag}: tendencia inválida (${e.tendencia}).`);
    if (!e.resumen) err.push(`${tag}: falta resumen.`);
    if (!Array.isArray(e.factores_clave) || !e.factores_clave.length) err.push(`${tag}: factores_clave vacío.`);
    if (!Array.isArray(e.alertas)) { err.push(`${tag}: alertas no es arreglo.`); return; }
    e.alertas.forEach((a, j) => {
      const at = `${tag}.alerta[${j}]`;
      if (!SEVERIDADES.includes(a.severidad)) err.push(`${at}: severidad inválida (${a.severidad}).`);
      if (!a.titulo) err.push(`${at}: falta titulo.`);
    });
  });
  return err;
}

/* ── Normaliza (rellena nombre/icono canónicos y ordena entornos) ── */
function normalizar(data) {
  const byId = {};
  data.entornos.forEach((e) => { byId[e.id] = e; });
  data.entornos = ENTORNOS.map((meta) => {
    const e = byId[meta.id] || {};
    e.id = meta.id;
    e.nombre = e.nombre || meta.nombre;
    e.icono = e.icono || meta.icono;
    e.alertas = Array.isArray(e.alertas) ? e.alertas : [];
    e.factores_clave = Array.isArray(e.factores_clave) ? e.factores_clave : [];
    return e;
  });
  data.generado = new Date().toISOString();
  data.modelo = MODEL;
  data.sujeto = data.sujeto || 'Freddy Bernal — Gobernador del estado Táchira';
  return data;
}

/* ── Main ── */
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: falta la variable de entorno ANTHROPIC_API_KEY.');
    process.exit(1);
  }

  const hoy = hoyISO();
  const noticias = leerNoticiasRecientes();
  const prev = leerApreciacionPrevia();
  const systemPrompt = readFileSync(join(__dirname, 'PROMPT.md'), 'utf8');
  const esquemaNoticias = bloqueEsquemaYNoticias(noticias, prev);

  const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno

  console.log(`Generando apreciación (${hoy}) con modelo ${MODEL}…`);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 8 }],
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: esquemaNoticias, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `Fecha de hoy: ${hoy}. Investiga en la web la coyuntura actual de cada entorno y devuelve SOLO el JSON del esquema, en español.` },
      ],
    }],
  });

  if (message.usage) {
    console.log('Uso de tokens:', JSON.stringify(message.usage));
  }

  const texto = extraerTexto(message);
  let data;
  try {
    data = parsearJSON(texto);
  } catch (e) {
    console.error('ERROR: no se pudo parsear el JSON de la respuesta:', e.message);
    console.error('--- Respuesta del modelo (primeros 1200 chars) ---');
    console.error(texto.slice(0, 1200));
    process.exit(2);
  }

  const errores = validar(data);
  if (errores.length) {
    console.error('ERROR: la respuesta no pasó la validación. No se sobrescribe el JSON existente.');
    errores.forEach((m) => console.error('  • ' + m));
    process.exit(3);
  }

  data = normalizar(data);

  // Escribir el archivo principal + snapshot de historial
  if (!existsSync(HISTORY_DIR)) mkdirSync(HISTORY_DIR, { recursive: true });
  const pretty = JSON.stringify(data, null, 2) + '\n';
  writeFileSync(OUT_FILE, pretty, 'utf8');
  const stamp = data.generado.replace(/[:]/g, '').replace(/\.\d+Z$/, 'Z');
  writeFileSync(join(HISTORY_DIR, `${stamp}.json`), pretty, 'utf8');

  console.log(`OK: escrito ${OUT_FILE}`);
  console.log(`OK: snapshot data/apreciacion-history/${stamp}.json`);
  console.log(`Nivel global: ${data.nivel_global} · Tendencia: ${data.tendencia_global}`);
}

main().catch((e) => {
  console.error('ERROR no controlado:', e && e.stack ? e.stack : e);
  process.exit(1);
});
