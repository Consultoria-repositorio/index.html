/*
 * Configuración del sistema de reportes semanales de FUNDESTA.
 * Edita los valores de abajo siguiendo FUNDESTA-SETUP.md — no hay que tocar
 * ningún otro archivo del sitio para ponerlo en marcha.
 */
window.FUNDESTA_CONFIG = {
  // URL de "insertar" del Google Form (Enviar → <> → copiar el src del iframe).
  FORM_EMBED_URL: 'https://docs.google.com/forms/d/e/REEMPLAZAR_CON_TU_FORM_ID/viewform?embedded=true',

  // URL directa al formulario, para quien prefiera abrirlo en una pestaña aparte.
  FORM_DIRECT_URL: 'https://docs.google.com/forms/d/e/REEMPLAZAR_CON_TU_FORM_ID/viewform',

  // URL del Google Sheet de respuestas publicado como CSV
  // (Archivo → Compartir → Publicar en la Web → CSV).
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/REEMPLAZAR_CON_TU_SHEET_ID/pub?output=csv',

  // Enlace a la hoja de cálculo real, para quien tenga permiso de editarla directamente.
  SHEET_EDIT_URL: 'https://docs.google.com/spreadsheets/d/REEMPLAZAR_CON_TU_SHEET_ID/edit',

  // Hash SHA-256 (hex) de la contraseña del dashboard. Ver FUNDESTA-SETUP.md
  // para generarlo. Déjalo vacío ('') para desactivar el candado (no recomendado).
  DASHBOARD_PASSWORD_HASH: '',

  // Nombres del equipo, tal como se escriben en el formulario. Se usa para
  // mostrar quién NO ha reportado en la semana en curso. Déjalo como []
  // para desactivar ese indicador.
  EQUIPO: [
    // 'María Pérez',
    // 'Juan Rodríguez',
  ],
};
