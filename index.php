<?php
/**
 * index.php — Punto de entrada principal de AlbertTranslator PHP.
 *
 * Responsabilidades:
 *  - Cargar configuración global (APP_NAME, APP_VERSION).
 *  - Emitir la cabecera HTTP de permisos de reconocimiento local.
 *  - Renderizar el HTML de la aplicación con cache-busting por mtime de assets.
 *  - Inyectar PHP_APP_CONFIG en window para que el JS pueda construir las URLs de API.
 *  - Exponer los atributos data-i18n que el motor i18n de app.js usa para
 *    internacionalizar la interfaz sin recargar la página (ES ↔ EN).
 */
require_once __DIR__ . '/backend/config.php';
if (!headers_sent()) {
  header('Permissions-Policy: on-device-speech-recognition=(self)');
}
$cssVersion = @filemtime(__DIR__ . '/frontend/css/style.css');
$jsVersion  = @filemtime(__DIR__ . '/frontend/js/app.js');
?><!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo APP_NAME; ?> <?php echo APP_VERSION; ?></title>
  <link rel="stylesheet" href="./frontend/css/style.css?v=<?php echo (int)$cssVersion; ?>">
</head>
<body>
  <main class="app-shell">

    <!-- ===== CABECERA ===== -->
    <header class="app-header">
      <div class="app-header-top">
        <div>
          <h1><?php echo APP_NAME; ?></h1>
          <p>Modo oscuro futurista, transcripción en vivo y traducción fluida en arquitectura separada frontend/backend.</p>
          <span class="php-badge">PHP Edition <?php echo APP_VERSION; ?></span>
        </div>
        <!-- Botón de alternancia de idioma de interfaz (ES ↔ EN).
             El JS lee este botón y llama a toggleUiLanguage().
             El data-i18n="toggleLang" se actualiza con el idioma contrario al activo. -->
        <button id="ui-lang-toggle" type="button" class="lang-toggle-btn" title="Switch UI language / Cambiar idioma de interfaz" data-i18n="toggleLang">EN</button>
      </div>
    </header>

    <!-- ===== SELECTOR DE IDIOMAS Y PROVEEDOR ===== -->
    <section class="language-bar">
      <div class="lang-field">
        <!-- data-i18n en labels: el JS reemplaza textContent según idioma activo -->
        <label for="source-language" data-i18n="sourceLanguage">Idioma de origen</label>
        <select id="source-language"></select>
      </div>

      <button id="swap-languages" type="button" class="swap-btn" data-i18n="swap" title="Intercambiar idiomas">Intercambiar</button>

      <div class="lang-field">
        <label for="target-language" data-i18n="targetLanguage">Idioma de destino</label>
        <select id="target-language"></select>
      </div>

      <div class="lang-field">
        <label for="translation-provider" data-i18n="provider">Modelo free en la nube</label>
        <select id="translation-provider">
          <option value="auto">Auto (recomendado)</option>
          <option value="google-free" selected>Google Free</option>
          <option value="libretranslate-free">LibreTranslate Free</option>
          <option value="mymemory-free">MyMemory Free</option>
        </select>
      </div>
    </section>

    <!-- ===== CONTROLES PRINCIPALES ===== -->
    <section class="controls">
      <button id="start-listening" type="button" class="primary" data-i18n="startListening">Iniciar escucha</button>
      <button id="stop-listening" type="button" disabled data-i18n="stopListening">Detener</button>
      <button id="clear-output" type="button" data-i18n="clear">Limpiar</button>
      <button id="export-txt" type="button" data-i18n="exportTxt">Exportar TXT</button>

      <!-- Alcance del export: "Ambos", "Transcripción" o "Traducción" -->
      <fieldset class="export-scope" aria-label="Qué exportar en TXT">
        <legend data-i18n="exportLegend">Exportar</legend>
        <label><input type="radio" name="export-scope" value="both" checked> <span data-i18n="exportBoth">Ambos</span></label>
        <label><input type="radio" name="export-scope" value="transcript"> <span data-i18n="exportTranscript">Transcripción</span></label>
        <label><input type="radio" name="export-scope" value="translation"> <span data-i18n="exportTranslation">Traducción</span></label>
      </fieldset>

      <button id="save-preferences" type="button" data-i18n="savePreferences">Guardar preferencias</button>

      <!-- Ajuste de perfil de escritura typewriter -->
      <div class="typing-tuning" aria-label="Ajustes de escritura">
        <label for="typing-profile" data-i18n="profile">Perfil</label>
        <select id="typing-profile" class="typing-profile">
          <option value="cinematic">Cinematic</option>
          <option value="normal" selected>Normal</option>
          <option value="turbo">Turbo</option>
        </select>
        <label for="typing-speed" data-i18n="speed">Velocidad</label>
        <input id="typing-speed" type="range" min="1" max="100" value="62" step="1">
        <span id="typing-speed-value" class="typing-speed-value">62</span>
        <label class="stagger-toggle" for="typing-stagger">
          <input id="typing-stagger" type="checkbox" checked>
          <span data-i18n="stagger">Stagger</span>
        </label>
      </div>

      <!-- Toggle de velocidad de traducción en vivo: Preciso ↔ Rápido -->
      <div class="live-mode-switch" aria-label="Modo traducción en vivo">
        <span class="live-mode-label" data-i18n="preciseLive">Vivo preciso</span>
        <label class="switch" for="live-translation-fast" title="Alternar modo rápido en vivo">
          <input id="live-translation-fast" type="checkbox">
          <span class="slider"></span>
        </label>
        <span class="live-mode-label" data-i18n="fastLive">Vivo rápido</span>
      </div>

      <!-- Sensibilidad del watchdog de recuperación de voz -->
      <div class="watchdog-tuning" aria-label="Sensibilidad del watchdog de voz">
        <label for="watchdog-silence-threshold" data-i18n="watchdogVoice">Watchdog voz</label>
        <select id="watchdog-silence-threshold">
          <option value="6">Muy sensible 6s</option>
          <option value="8">Rápido 8s</option>
          <option value="10" selected>Balanceado 10s</option>
          <option value="13">Tolerante 13s</option>
        </select>
      </div>

      <!-- Indicador de estado de operación en tiempo real -->
      <span id="status" class="status idle" data-i18n="status.idle">Inactivo</span>
    </section>

    <!-- ===== TIRA DE ESTADO EN TIEMPO REAL ===== -->
    <!-- Se actualiza cada HEARTBEAT_ACTIVE_MS (1s) cuando escucha, HEARTBEAT_IDLE_MS (4s) en reposo -->
    <section class="runtime-strip" aria-live="polite">
      <span id="runtime-mic-state" class="runtime-chip">Micrófono: detenido</span>
      <span id="runtime-incremental-state" class="runtime-chip">Incremental: en espera</span>
      <span id="runtime-segments-state" class="runtime-chip">Segmentos: 0</span>
      <span id="runtime-word-state" class="runtime-chip">Palabras: 0</span>
      <span id="runtime-watchdog-state" class="runtime-chip">Watchdog: 10s · pase 5s</span>
      <span class="runtime-shortcuts" data-i18n="shortcuts">Atajos: Ctrl+Enter iniciar/detener · Ctrl+Backspace limpiar</span>
    </section>

    <!-- ===== PANELES DE TRANSCRIPCIÓN Y TRADUCCIÓN ===== -->
    <section class="panes">
      <article class="pane">
        <div class="pane-head">
          <h2 data-i18n="transcription">Transcripción</h2>
          <div class="pane-actions">
            <button id="copy-transcript" type="button" class="action-btn" data-i18n="copy">Copiar</button>
            <button id="speak-transcript" type="button" class="action-btn speaker-btn" title="Escuchar transcripción" aria-label="Escuchar transcripción">🔊</button>
          </div>
        </div>
        <!-- data-i18n-ph: el JS actualiza placeholder según idioma -->
        <textarea id="transcript-output" readonly placeholder="La transcripción aparecerá aquí..." data-i18n-ph="placeholders.transcript"></textarea>
      </article>

      <article class="pane">
        <div class="pane-head">
          <h2 data-i18n="translation">Traducción</h2>
          <div class="pane-actions">
            <button id="copy-translation" type="button" class="action-btn" data-i18n="copy">Copiar</button>
            <button id="speak-translation" type="button" class="action-btn speaker-btn" title="Escuchar traducción" aria-label="Escuchar traducción">🔊</button>
          </div>
        </div>
        <textarea id="translation-output" readonly placeholder="La traducción aparecerá aquí..." data-i18n-ph="placeholders.translation"></textarea>
      </article>
    </section>

    <!-- ===== PANEL DE TRADUCCIÓN MANUAL ===== -->
    <section class="manual-pane pane">
      <div class="pane-head">
        <h2 data-i18n="manualTranslation">Traducción manual</h2>
        <button id="translate-manual" type="button" class="copy-btn" data-i18n="translateManual">Traducir texto</button>
      </div>
      <textarea id="manual-input" placeholder="Escribe o pega texto para traducir..." data-i18n-ph="placeholders.manual"></textarea>
    </section>

    <!-- ===== CAJA DE ERRORES (oculta por defecto) ===== -->
    <p id="error-box" class="error-box" hidden></p>

    <!-- ===== PIE DE PÁGINA ===== -->
    <footer class="app-footer">
      <div class="footer-content">
        <small>API PHP: <code>/api/health.php</code> y <code>/api/translate-text.php</code>.</small>

        <!-- Botón de donación "Cómprame una cerveza 🍺"
             Enlace directo a PayPal Donate. Se abre en pestaña nueva para no
             interrumpir la sesión de transcripción activa. -->
        <a
          id="donate-btn"
          href="https://www.paypal.com/donate/?hosted_button_id=ZABFRXC2P3JQN"
          target="_blank"
          rel="noopener noreferrer"
          class="donate-btn"
          data-i18n="donate"
          title="Apoya el desarrollo de AlbertTranslator"
        >Cómprame una cerveza 🍺</a>
      </div>
    </footer>
  </main>

  <!-- Configuración PHP → JS: URL base de la API y versión de la app. -->
  <script>
    window.PHP_APP_CONFIG = {
      apiBaseUrl: window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, ""),
      appVersion: <?php echo json_encode(APP_VERSION); ?>,
    };
  </script>

  <!-- Motores en orden de dependencia: transcription → translation → app (orquestador) -->
  <script src="./frontend/js/transcription-engine.js?v=<?php echo (int)$jsVersion; ?>"></script>
  <script src="./frontend/js/translation-engine.js?v=<?php echo (int)$jsVersion; ?>"></script>
  <script src="./frontend/js/app.js?v=<?php echo (int)$jsVersion; ?>"></script>
</body>
</html>
