<?php
require_once __DIR__ . '/backend/config.php';
$cssVersion = @filemtime(__DIR__ . '/frontend/css/style.css');
$jsVersion = @filemtime(__DIR__ . '/frontend/js/app.js');
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
    <header class="app-header">
      <h1><?php echo APP_NAME; ?></h1>
      <p>Modo oscuro futurista, transcripción en vivo y traducción fluida en arquitectura separada frontend/backend.</p>
      <span class="php-badge">PHP Edition <?php echo APP_VERSION; ?></span>
    </header>

    <section class="language-bar">
      <div class="lang-field">
        <label for="source-language">Idioma de origen</label>
        <select id="source-language"></select>
      </div>

      <button id="swap-languages" type="button" class="swap-btn" title="Intercambiar idiomas">Intercambiar</button>

      <div class="lang-field">
        <label for="target-language">Idioma de destino</label>
        <select id="target-language"></select>
      </div>

      <div class="lang-field">
        <label for="translation-provider">Modelo free en la nube</label>
        <select id="translation-provider">
          <option value="auto">Auto (recomendado)</option>
          <option value="google-free" selected>Google Free</option>
          <option value="mymemory-free">MyMemory Free</option>
        </select>
      </div>
    </section>

    <section class="controls">
      <button id="start-listening" type="button" class="primary">Iniciar escucha</button>
      <button id="stop-listening" type="button" disabled>Detener</button>
      <button id="clear-output" type="button">Limpiar</button>
      <button id="save-preferences" type="button">Guardar preferencias</button>
      <div class="typing-tuning" aria-label="Ajustes de escritura">
        <label for="typing-profile">Perfil</label>
        <select id="typing-profile" class="typing-profile">
          <option value="cinematic">Cinematic</option>
          <option value="normal" selected>Normal</option>
          <option value="turbo">Turbo</option>
        </select>
        <label for="typing-speed">Velocidad</label>
        <input id="typing-speed" type="range" min="1" max="100" value="62" step="1">
        <span id="typing-speed-value" class="typing-speed-value">62</span>
        <label class="stagger-toggle" for="typing-stagger">
          <input id="typing-stagger" type="checkbox" checked>
          <span>Stagger</span>
        </label>
      </div>
      <div class="live-mode-switch" aria-label="Modo traducción en vivo">
        <span class="live-mode-label">Vivo preciso</span>
        <label class="switch" for="live-translation-fast" title="Alternar modo rápido en vivo">
          <input id="live-translation-fast" type="checkbox">
          <span class="slider"></span>
        </label>
        <span class="live-mode-label">Vivo rápido</span>
      </div>
      <span id="status" class="status idle">Inactivo</span>
    </section>

    <section class="panes">
      <article class="pane">
        <div class="pane-head">
          <h2>Transcripción</h2>
          <div class="pane-actions">
            <button id="copy-transcript" type="button" class="action-btn">Copiar</button>
            <button id="speak-transcript" type="button" class="action-btn speaker-btn" title="Escuchar transcripción" aria-label="Escuchar transcripción">🔊</button>
          </div>
        </div>
        <textarea id="transcript-output" readonly placeholder="La transcripción aparecerá aquí..."></textarea>
      </article>

      <article class="pane">
        <div class="pane-head">
          <h2>Traducción</h2>
          <div class="pane-actions">
            <button id="copy-translation" type="button" class="action-btn">Copiar</button>
            <button id="speak-translation" type="button" class="action-btn speaker-btn" title="Escuchar traducción" aria-label="Escuchar traducción">🔊</button>
          </div>
        </div>
        <textarea id="translation-output" readonly placeholder="La traducción aparecerá aquí..."></textarea>
      </article>
    </section>

    <section class="manual-pane pane">
      <div class="pane-head">
        <h2>Traducción manual</h2>
        <button id="translate-manual" type="button" class="copy-btn">Traducir texto</button>
      </div>
      <textarea id="manual-input" placeholder="Escribe o pega texto para traducir..."></textarea>
    </section>

    <p id="error-box" class="error-box" hidden></p>

    <footer class="app-footer">
      <small>API PHP: <code>/api/health.php</code> y <code>/api/translate-text.php</code>.</small>
    </footer>
  </main>

  <script>
    window.PHP_APP_CONFIG = {
      apiBaseUrl: window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, ""),
      appVersion: <?php echo json_encode(APP_VERSION); ?>,
    };
  </script>
  <script src="./frontend/js/app.js?v=<?php echo (int)$jsVersion; ?>"></script>
</body>
</html>
