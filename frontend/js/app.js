/**
 * =============================================================================
 * MÓDULO i18n — Internacionalización de la interfaz de usuario.
 * Soporta Español (es) e Inglés (en). La preferencia se guarda en localStorage.
 * Para agregar más idiomas: añadir entrada en UI_STRINGS y opción en el toggle.
 * =============================================================================
 */

/** Clave de preferencia de idioma de UI en localStorage. */
const UI_LANG_KEY = "albert_translator_ui_lang_v1";

/** Idioma de UI activo. Inicializado en restoreUiLanguage(). */
let currentUiLang = "es";

/**
 * Diccionario de traducciones de la UI.
 * Las rutas con punto (ej. "status.idle") se resuelven en la función i18n().
 */
const UI_STRINGS = {
  es: {
    startListening:    "Iniciar escucha",
    stopListening:     "Detener",
    clear:             "Limpiar",
    exportTxt:         "Exportar TXT",
    savePreferences:   "Guardar preferencias",
    swap:              "Intercambiar",
    translateManual:   "Traducir texto",
    copy:              "Copiar",
    sourceLanguage:    "Idioma de origen",
    targetLanguage:    "Idioma de destino",
    provider:          "Modelo free en la nube",
    profile:           "Perfil",
    speed:             "Velocidad",
    stagger:           "Stagger",
    preciseLive:       "Vivo preciso",
    fastLive:          "Vivo rápido",
    watchdogVoice:     "Watchdog voz",
    exportLegend:      "Exportar",
    exportBoth:        "Ambos",
    exportTranscript:  "Transcripción",
    exportTranslation: "Traducción",
    transcription:     "Transcripción",
    translation:       "Traducción",
    manualTranslation: "Traducción manual",
    shortcuts:         "Atajos: Ctrl+Enter iniciar/detener · Ctrl+Backspace limpiar",
    donate:            "Cómprame una cerveza 🍺",
    toggleLang:        "EN",
    status: {
      idle:       "Inactivo",
      listening:  "Escuchando en vivo",
      processing: "Reconectando escucha...",
      error:      "Error",
    },
    placeholders: {
      transcript:  "La transcripción aparecerá aquí...",
      translation: "La traducción aparecerá aquí...",
      manual:      "Escribe o pega texto para traducir...",
    },
    errors: {
      noSpeechApi:     "Tu navegador no soporta reconocimiento de voz Web Speech API.",
      noRecognition:   "No se pudo crear el motor de reconocimiento de voz.",
      initError:       "Error al inicializar",
      micDenied:       "Permiso de micrófono denegado. Habilítalo y vuelve a intentar.",
      micDeniedStatus: "Permiso de microfono denegado",
      noTranslation:   "No se obtuvo una traducción confiable. Cambia el proveedor a Auto o Google Free e intenta de nuevo.",
      noText:          "Escribe texto en traducción manual.",
      noTranscript:    "No hay transcripción para exportar.",
      noTranslationExp:"No hay traducción para exportar.",
      noContent:       "No hay contenido para exportar.",
      noCopy:          "No hay texto para copiar.",
      noCopyClipboard: "No se pudo copiar al portapapeles.",
      noSpeak:         "No hay texto para leer.",
      noTts:           "Tu navegador no soporta lectura por voz.",
      noSwap:          "No se puede intercambiar cuando origen esta en auto.",
      noHealth:        "No se pudo validar API PHP.",
      noConnection:    "No hay conexion con la API PHP.",
    },
    toasts: {
      prefsSaved:        "Preferencias guardadas",
      prefsRestored:     "Preferencias restauradas",
      copied:            "Texto copiado",
      copyFailed:        "No se pudo copiar",
      exported:          "TXT exportado",
      langChanged:       "Idioma de UI: English",
    },
  },
  en: {
    startListening:    "Start listening",
    stopListening:     "Stop",
    clear:             "Clear",
    exportTxt:         "Export TXT",
    savePreferences:   "Save preferences",
    swap:              "Swap",
    translateManual:   "Translate text",
    copy:              "Copy",
    sourceLanguage:    "Source language",
    targetLanguage:    "Target language",
    provider:          "Free cloud model",
    profile:           "Profile",
    speed:             "Speed",
    stagger:           "Stagger",
    preciseLive:       "Precise live",
    fastLive:          "Fast live",
    watchdogVoice:     "Voice watchdog",
    exportLegend:      "Export",
    exportBoth:        "Both",
    exportTranscript:  "Transcript",
    exportTranslation: "Translation",
    transcription:     "Transcription",
    translation:       "Translation",
    manualTranslation: "Manual translation",
    shortcuts:         "Shortcuts: Ctrl+Enter start/stop · Ctrl+Backspace clear",
    donate:            "Buy me a beer 🍺",
    toggleLang:        "ES",
    status: {
      idle:       "Idle",
      listening:  "Listening live",
      processing: "Reconnecting...",
      error:      "Error",
    },
    placeholders: {
      transcript:  "Transcription will appear here...",
      translation: "Translation will appear here...",
      manual:      "Type or paste text to translate...",
    },
    errors: {
      noSpeechApi:     "Your browser does not support Web Speech API.",
      noRecognition:   "Could not create speech recognition engine.",
      initError:       "Init error",
      micDenied:       "Microphone permission denied. Enable it and try again.",
      micDeniedStatus: "Microphone permission denied",
      noTranslation:   "No reliable translation found. Switch provider to Auto or Google Free and retry.",
      noText:          "Enter text in manual translation.",
      noTranscript:    "No transcription to export.",
      noTranslationExp:"No translation to export.",
      noContent:       "No content to export.",
      noCopy:          "No text to copy.",
      noCopyClipboard: "Could not copy to clipboard.",
      noSpeak:         "No text to read aloud.",
      noTts:           "Your browser does not support text-to-speech.",
      noSwap:          "Cannot swap when source is set to auto.",
      noHealth:        "Could not validate PHP API.",
      noConnection:    "No connection to PHP API.",
    },
    toasts: {
      prefsSaved:        "Preferences saved",
      prefsRestored:     "Preferences restored",
      copied:            "Text copied",
      copyFailed:        "Could not copy",
      exported:          "TXT exported",
      langChanged:       "UI language: Español",
    },
  },
};

/**
 * Obtiene la cadena traducida para la clave dada en el idioma de UI activo.
 * Soporta rutas con punto (ej. "status.idle", "errors.noCopy").
 * Si la clave no existe devuelve la clave misma para facilitar debugging.
 * @param {string} key - Clave del diccionario (con o sin puntos).
 * @returns {string}
 */
function i18n(key) {
  var dict = UI_STRINGS[currentUiLang] || UI_STRINGS.es;
  var parts = String(key || "").split(".");
  var val = dict;
  for (var idx = 0; idx < parts.length; idx += 1) {
    if (val && typeof val === "object") {
      val = val[parts[idx]];
    } else {
      return key;
    }
  }
  return typeof val === "string" ? val : key;
}

/**
 * Aplica el idioma de UI indicado actualizando el DOM.
 * Busca elementos con data-i18n (textContent), data-i18n-ph (placeholder)
 * y data-i18n-title (title) y sustituye sus valores con el diccionario.
 * @param {string} lang - "es" o "en".
 */
function applyUiLanguage(lang) {
  currentUiLang = (lang === "en") ? "en" : "es";

  // Actualiza elementos por data-i18n (textContent).
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    el.textContent = i18n(key);
  });

  // Actualiza placeholders de textareas e inputs.
  document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
    var key = el.getAttribute("data-i18n-ph");
    el.placeholder = i18n(key);
  });

  // Actualiza atributo title.
  document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
    var key = el.getAttribute("data-i18n-title");
    el.title = i18n(key);
  });

  // Persiste la preferencia.
  var ls = getSafeLocalStorage();
  if (ls) {
    try { ls.setItem(UI_LANG_KEY, currentUiLang); } catch (_e) {}
  }
}

/**
 * Lee la preferencia de idioma de UI guardada y la aplica.
 * Fallback: español si no hay preferencia guardada.
 */
function restoreUiLanguage() {
  var ls = getSafeLocalStorage();
  var saved = "";
  if (ls) {
    try { saved = String(ls.getItem(UI_LANG_KEY) || ""); } catch (_e) {}
  }
  applyUiLanguage(saved === "en" ? "en" : "es");
}

/**
 * Alterna el idioma de la UI entre "es" y "en" y muestra un toast de confirmación.
 */
function toggleUiLanguage() {
  var next = currentUiLang === "es" ? "en" : "es";
  applyUiLanguage(next);
  showToast(i18n("toasts.langChanged"), "ok");
}

// =============================================================================

const COMMON_LANGUAGES = [
  { name: "Español", code: "es" },
  { name: "Inglés", code: "en" },
  { name: "Francés", code: "fr" },
  { name: "Alemán", code: "de" },
  { name: "Italiano", code: "it" },
  { name: "Portugués", code: "pt" },
  { name: "Ruso", code: "ru" },
  { name: "Japonés", code: "ja" },
  { name: "Coreano", code: "ko" },
  { name: "Chino", code: "zh" },
  { name: "Árabe", code: "ar" },
  { name: "Hindi", code: "hi" },
  { name: "Neerlandés", code: "nl" },
  { name: "Turco", code: "tr" },
  { name: "Polaco", code: "pl" },
  { name: "Ucraniano", code: "uk" },
  { name: "Sueco", code: "sv" },
  { name: "Griego", code: "el" },
  { name: "Hebreo", code: "he" },
];

const SOURCE_LANGUAGES = [{ name: "Detectar automáticamente", code: "auto" }, ...COMMON_LANGUAGES];
const TARGET_LANGUAGES = [...COMMON_LANGUAGES];

const sourceSelect = document.getElementById("source-language");
const targetSelect = document.getElementById("target-language");
const startBtn = document.getElementById("start-listening");
const stopBtn = document.getElementById("stop-listening");
const clearBtn = document.getElementById("clear-output");
const exportTxtBtn = document.getElementById("export-txt");
const exportScopeRadios = document.querySelectorAll('input[name="export-scope"]');
const savePreferencesBtn = document.getElementById("save-preferences");
const swapBtn = document.getElementById("swap-languages");
const transcriptOutput = document.getElementById("transcript-output");
const translationOutput = document.getElementById("translation-output");
const statusBox = document.getElementById("status");
const errorBox = document.getElementById("error-box");
const copyTranscriptBtn = document.getElementById("copy-transcript");
const copyTranslationBtn = document.getElementById("copy-translation");
const speakTranscriptBtn = document.getElementById("speak-transcript");
const speakTranslationBtn = document.getElementById("speak-translation");
const manualInput = document.getElementById("manual-input");
const translateManualBtn = document.getElementById("translate-manual");
const translationProviderSelect = document.getElementById("translation-provider");
const typingProfileSelect = document.getElementById("typing-profile");
const typingSpeedDial = document.getElementById("typing-speed");
const typingSpeedValue = document.getElementById("typing-speed-value");
const typingStaggerToggle = document.getElementById("typing-stagger");
const liveTranslationFastToggle = document.getElementById("live-translation-fast");
const watchdogSilenceThresholdSelect = document.getElementById("watchdog-silence-threshold");
const runtimeMicState = document.getElementById("runtime-mic-state");
const runtimeIncrementalState = document.getElementById("runtime-incremental-state");
const runtimeSegmentsState = document.getElementById("runtime-segments-state");
const runtimeWordState = document.getElementById("runtime-word-state");
const runtimeWatchdogState = document.getElementById("runtime-watchdog-state");

const TYPING_PROFILES = {
  cinematic: { speed: 30, stagger: true },
  normal: { speed: 62, stagger: true },
  turbo: { speed: 92, stagger: false },
};

const BASE = (window.PHP_APP_CONFIG && window.PHP_APP_CONFIG.apiBaseUrl
  ? window.PHP_APP_CONFIG.apiBaseUrl
  : window.location.origin).replace(/\/$/, "");
const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const UI_PREFS_KEY = "albert_translator_ui_prefs_v1";
const UI_PREFS_COOKIE = "albert_translator_ui_prefs";
const conversationStartedAt = new Date();

let recognition = null;
let listening = false;
let listeningRequested = false;
let translateDebounceTimer = null;
let typedTranslateDebounceTimer = null;
let livePreviewDelayTimer = null;
let transcriptCommittedText = "";
let transcriptForTranslation = "";
let translationCommittedText = "";
let liveTranslationPreviewText = "";
let lastInterimTranslateAt = 0;
let lastAcceptedTranslation = "";
let lastRenderedLiveSource = "";
let translateInFlight = false;
let activeTranslationController = null;
let activeTranslationMode = "replace";
let queuedTranslationText = "";
let queuedTranslationFromManual = false;
let queuedTranslationMode = "replace";
let lastInterimChunk = "";
let interimCommitTimer = null;
let toastTimer = null;
let toastEl = null;
let recognitionRestartTimer = null;
let recognitionWatchdogTimer = null;
let recognitionRestartAttempts = 0;
let recognitionLastResultAt = 0;
let recognitionLastEventAt = 0;
let recognitionConsecutiveErrors = 0;
let recognitionLastRestartAt = 0;
let recognitionLastHardRecoveryAt = 0;
let recognitionSessionStartedAt = 0;
let recognitionRestartPendingSince = 0;
let recognitionRestartPendingReason = "";
let recognitionUseLocalProcessing = false;
let recognitionLocalSupportCache = {};
let incrementalSourceSegments = [];
let incrementalTranslatedSegments = [];
let incrementalContextKey = "";
let runtimeHeartbeatTimer = null;
let lastIncrementalAddedCount = 0;
let prefersReducedMotion = false;
let lastLiveEnqueueTextNorm = "";
let lastLiveEnqueueAt = 0;
let uiPrefsWereRestored = false;
const WATCHDOG_POLL_INTERVAL_MS = 5000;
const WATCHDOG_ROLLING_REFRESH_MS = 45000;
const WATCHDOG_REFRESH_IDLE_MS = 1500;
const RECOGNITION_END_WAIT_MS = 1600;

/**
 * Intervalos del heartbeat de la tira de estado en tiempo real.
 * Cuando el micrófono está activo se usa el intervalo rápido (1 s) para que
 * el contador "última voz hace Xs" sea preciso. En reposo se reduce a 4 s para
 * ahorrar CPU (~75% menos ciclos que el intervalo fijo anterior de 1 s).
 */
const HEARTBEAT_IDLE_MS   = 4000;
const HEARTBEAT_ACTIVE_MS = 1000;
const typewriterStates = {
  transcript: { timer: null, target: "", running: false, raw: "", cursorOn: false, cursorTimer: null, textarea: null },
  translation: { timer: null, target: "", running: false, raw: "", cursorOn: false, cursorTimer: null, textarea: null },
};

const LOCAL_GLOSSARY_EN_ES = {
  hello: "hola", hi: "hola", how: "cómo", are: "estás", you: "tú", today: "hoy", tomorrow: "mañana", yesterday: "ayer",
  guys: "chicos", so: "así", but: "pero", have: "he", heard: "escuchado", some: "algunas", people: "personas",
  right: "aquí", here: "aquí", say: "decir", down: "abajo", get: "ponerse", well: "bien", do: "hacer", not: "no", know: "sé", okay: "bien", ok: "bien",
  good: "bueno", morning: "mañana", afternoon: "tarde", night: "noche",
  thanks: "gracias", thank: "gracias", please: "por favor", yes: "sí", no: "no",
  what: "qué", where: "dónde", when: "cuándo", why: "por qué", who: "quién",
  name: "nombre", my: "mi", your: "tu", is: "es", this: "esto", that: "eso", we: "nosotros",
  can: "puede", should: "debería", would: "gustaría", help: "ayudar", me: "me", need: "necesito", want: "quiero",
  buy: "comprar", send: "enviar", schedule: "programar", meeting: "reunion", next: "proxima", week: "semana",
  report: "reporte", ticket: "boleto", translation: "traducción", translations: "traducciones", one: "una", large: "grande", great: "genial", pizza: "pizza", pepperoni: "pepperoni",
  water: "agua", food: "comida", house: "casa", work: "trabajo", friend: "amigo",
  family: "familia", very: "muy", much: "mucho", time: "tiempo", now: "ahora", later: "luego"
};
const LOCAL_GLOSSARY_ES_EN = (function () {
  var reversed = {};
  for (var key in LOCAL_GLOSSARY_EN_ES) {
    if (!Object.prototype.hasOwnProperty.call(LOCAL_GLOSSARY_EN_ES, key)) {
      continue;
    }
    var es = String(LOCAL_GLOSSARY_EN_ES[key] || "").toLowerCase();
    if (es && !reversed[es]) {
      reversed[es] = key;
    }
  }
  return reversed;
})();

buildLanguageOptions();
restoreUiLanguage();    // Aplica idioma de UI antes de cargar otras prefs.
restoreUiPreferences();
wireEvents();
initSpeechUnloadGuards();
initRuntimeEnhancements();
checkHealth();

function initSpeechUnloadGuards() {
  // Evita que la voz siga al recargar/cerrar la pagina.
  window.addEventListener("beforeunload", forceStopSpeech, false);
  window.addEventListener("pagehide", forceStopSpeech, false);
  window.addEventListener("beforeunload", persistUiPreferences, false);

  // Si la pestana vuelve a estar visible y quedo "reconectando", intenta reanudar.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") {
      return;
    }
    if (!listeningRequested || listening) {
      return;
    }
    scheduleRecognitionRestart("visibility-resume", 180, true);
  });
}

/**
 * Reinicia el intervalo del heartbeat con la frecuencia correcta según el estado.
 * active=true  → 1 s (micrófono activo, contadores de tiempo críticos).
 * active=false → 4 s (reposo, reduce CPU un 75% frente al intervalo anterior).
 * Se pausa automáticamente cuando el tab está oculto (document.hidden) para no
 * consumir CPU cuando el usuario no está mirando la pantalla.
 * @param {boolean} active
 */
function restartHeartbeat(active) {
  if (runtimeHeartbeatTimer) {
    clearInterval(runtimeHeartbeatTimer);
    runtimeHeartbeatTimer = null;
  }
  var interval = active ? HEARTBEAT_ACTIVE_MS : HEARTBEAT_IDLE_MS;
  runtimeHeartbeatTimer = setInterval(function () {
    if (!document.hidden) {
      updateRuntimeStrip();
    }
  }, interval);
}

function initRuntimeEnhancements() {
  prefersReducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  updateRuntimeStrip();
  restartHeartbeat(false);

  // Pausa el heartbeat cuando el tab pasa a segundo plano y lo reanuda al volver.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      updateRuntimeStrip();
      restartHeartbeat(listeningRequested && listening);
    }
  });
}

function clearInterimCommitTimer() {
  if (interimCommitTimer) {
    clearTimeout(interimCommitTimer);
    interimCommitTimer = null;
  }
}

function getLastCommittedTranscriptNormalized() {
  var lines = String(transcriptCommittedText || "")
    .split(/\r?\n+/)
    .map(function (line) {
      return String(line || "").trim();
    })
    .filter(Boolean);
  if (!lines.length) {
    return "";
  }
  return normalizeFlatText(lines[lines.length - 1]);
}

function canCommitInterimChunk(chunk, reason) {
  var text = String(chunk || "").trim();
  if (!text) {
    return false;
  }

  var normalized = normalizeFlatText(text);
  if (!normalized) {
    return false;
  }

  // Evita duplicar la ultima frase ya confirmada.
  if (normalized === getLastCommittedTranscriptNormalized()) {
    return false;
  }

  var words = countWords(text);
  var finalizingReason = !!reason && reason !== "silence";

  // En silencio normal sigue filtrando ruido corto.
  if (!finalizingReason && words < 2 && text.length < 9) {
    return false;
  }

  // En onend/watchdog/stop permite conservar una cola corta real.
  if (finalizingReason && words < 2 && text.length < 5) {
    return false;
  }

  return true;
}

function commitPendingInterim(reason) {
  var pending = String(lastInterimChunk || "").trim();
  if (!canCommitInterimChunk(pending, reason)) {
    return false;
  }

  appendTranscriptChunk(pending);
  lastInterimChunk = "";

  var transcriptNow = String(transcriptForTranslation || "").trim();
  if (transcriptNow) {
    maybeEnqueueLiveTranslation(transcriptNow, reason !== "silence");
  }
  return true;
}

function scheduleInterimCommitBySilence() {
  clearInterimCommitTimer();
  if (!listeningRequested) {
    return;
  }

  var delay = getLiveTranslationMode() === "fast" ? 780 : 1180;
  interimCommitTimer = setTimeout(function () {
    if (!listeningRequested) {
      return;
    }
    commitPendingInterim("silence");
  }, delay);
}

function shouldInstantRenderTypewriter(target) {
  var text = String(target || "");
  if (prefersReducedMotion) {
    return true;
  }
  if (text.length > 2200) {
    return true;
  }
  return false;
}

function longestCommonPrefixLength(a, b) {
  var left = String(a || "");
  var right = String(b || "");
  var max = Math.min(left.length, right.length);
  var i = 0;
  while (i < max && left.charAt(i) === right.charAt(i)) {
    i += 1;
  }
  return i;
}

function setChipTone(el, tone) {
  if (!el) {
    return;
  }
  el.classList.remove("ok", "warn", "idle");
  el.classList.add(tone || "idle");
}

function updateRuntimeStrip() {
  if (!runtimeMicState || !runtimeIncrementalState || !runtimeSegmentsState || !runtimeWordState || !runtimeWatchdogState) {
    return;
  }

  var micText = "Micrófono: detenido";
  var micTone = "idle";
  if (listeningRequested && recognitionRestartPendingSince) {
    var waitingSeconds = Math.max(0, Math.floor((Date.now() - recognitionRestartPendingSince) / 1000));
    micText = waitingSeconds > 0
      ? ("Micrófono: refrescando captura · espera " + waitingSeconds + "s")
      : "Micrófono: refrescando captura";
    micTone = "warn";
  } else if (listeningRequested && listening) {
    var idleSeconds = recognitionLastResultAt ? Math.floor((Date.now() - recognitionLastResultAt) / 1000) : 0;
    micText = idleSeconds > 0
      ? ("Micrófono: activo · última voz hace " + idleSeconds + "s")
      : "Micrófono: activo";
    micTone = idleSeconds >= 9 ? "warn" : "ok";
  } else if (listeningRequested && !listening) {
    micText = "Micrófono: reconectando";
    micTone = "warn";
  }
  runtimeMicState.textContent = micText;
  setChipTone(runtimeMicState, micTone);

  var incLabel = "Incremental: en espera";
  var incTone = "idle";
  if (listeningRequested) {
    if (lastIncrementalAddedCount > 0) {
      incLabel = "Incremental: +" + lastIncrementalAddedCount + " nuevas";
      incTone = "ok";
    } else {
      incLabel = "Incremental: sin cambios";
      incTone = "idle";
    }
  }
  runtimeIncrementalState.textContent = incLabel;
  setChipTone(runtimeIncrementalState, incTone);

  var segmentCount = splitTranscriptIntoSegments(transcriptForTranslation || getTranscriptFieldText()).length;
  runtimeSegmentsState.textContent = "Segmentos: " + segmentCount;
  setChipTone(runtimeSegmentsState, segmentCount > 0 ? "ok" : "idle");

  var wordCount = countWords(transcriptForTranslation || getTranscriptFieldText());
  runtimeWordState.textContent = "Palabras: " + wordCount;
  setChipTone(runtimeWordState, wordCount > 0 ? "ok" : "idle");

  var watchdogSeconds = Math.floor(getWatchdogSilenceThresholdMs() / 1000);
  var watchdogPollSeconds = Math.max(1, Math.floor(WATCHDOG_POLL_INTERVAL_MS / 1000));
  var watchdogText = "Watchdog: " + watchdogSeconds + "s · pase " + watchdogPollSeconds + "s";
  var watchdogTone = listeningRequested ? "ok" : "idle";
  if (listeningRequested && recognitionRestartPendingSince) {
    var restartWaitSeconds = Math.max(0, Math.floor((Date.now() - recognitionRestartPendingSince) / 1000));
    watchdogText = "Watchdog: recuperando" + (restartWaitSeconds > 0 ? (" · " + restartWaitSeconds + "s") : "");
    watchdogTone = "warn";
  } else if (listeningRequested && listening) {
    var watchdogIdleSeconds = recognitionLastResultAt ? Math.floor((Date.now() - recognitionLastResultAt) / 1000) : 0;
    if (watchdogIdleSeconds >= watchdogSeconds) {
      watchdogTone = "warn";
    }
  }
  runtimeWatchdogState.textContent = watchdogText;
  setChipTone(runtimeWatchdogState, watchdogTone);
}

function handleGlobalShortcuts(event) {
  var key = String(event && event.key ? event.key : "").toLowerCase();
  if (!event.ctrlKey) {
    return;
  }

  var activeEl = document.activeElement;
  var isTypingField = activeEl && (
    activeEl.tagName === "INPUT"
    || activeEl.tagName === "TEXTAREA"
    || activeEl.isContentEditable
  );

  if (key === "enter") {
    if (activeEl === manualInput) {
      event.preventDefault();
      var txt = String(manualInput.value || "").trim();
      if (txt) {
        runManualTranslation(txt);
      }
      return;
    }
    if (!isTypingField) {
      event.preventDefault();
      if (listeningRequested) {
        stopListening();
      } else {
        startListening();
      }
    }
    return;
  }

  if (key === "backspace" && !isTypingField) {
    event.preventDefault();
    clearOutputs();
  }
}

function forceStopSpeech() {
  if (!("speechSynthesis" in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
  } catch (_e) {
    // Ignorado: algunos navegadores pueden lanzar en unload.
  }
}

function buildLanguageOptions() {
  sourceSelect.innerHTML = "";
  SOURCE_LANGUAGES.forEach(function (language) {
    var option = document.createElement("option");
    option.value = language.code;
    option.textContent = language.name + " (" + language.code + ")";
    sourceSelect.appendChild(option);
  });

  targetSelect.innerHTML = "";
  TARGET_LANGUAGES.forEach(function (language) {
    var option = document.createElement("option");
    option.value = language.code;
    option.textContent = language.name + " (" + language.code + ")";
    targetSelect.appendChild(option);
  });

  // Requisito: por defecto origen Inglés, destino Español
  sourceSelect.value = "en";
  targetSelect.value = "es";
}

function wireEvents() {
  startBtn.addEventListener("click", startListening);
  stopBtn.addEventListener("click", stopListening);
  clearBtn.addEventListener("click", clearOutputs);
  if (exportTxtBtn) {
    exportTxtBtn.addEventListener("click", exportConversationToTxt);
  }

  // Botón de alternancia de idioma de UI (ES ↔ EN).
  var uiLangToggle = document.getElementById("ui-lang-toggle");
  if (uiLangToggle) {
    uiLangToggle.addEventListener("click", toggleUiLanguage);
  }
  if (exportScopeRadios && exportScopeRadios.length) {
    for (var exportIndex = 0; exportIndex < exportScopeRadios.length; exportIndex += 1) {
      exportScopeRadios[exportIndex].addEventListener("change", persistUiPreferences);
    }
  }
  swapBtn.addEventListener("click", swapLanguages);
  document.addEventListener("keydown", handleGlobalShortcuts);

  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener("click", function () {
      persistUiPreferences();
      showToast(i18n("toasts.prefsSaved"), "ok");
      setStatus("idle", i18n("toasts.prefsSaved"));
      setTimeout(function () {
        if (!listening) {
          setStatus("idle", i18n("status.idle"));
        }
      }, 1100);
    });
  }

  copyTranscriptBtn.addEventListener("click", function () {
    copyText(transcriptOutput.value);
  });
  copyTranslationBtn.addEventListener("click", function () {
    copyText(translationOutput.value);
  });

  speakTranscriptBtn.addEventListener("click", function () {
    speakText(transcriptOutput.value, resolveSpeechLang(sourceSelect.value));
  });
  speakTranslationBtn.addEventListener("click", function () {
    speakText(translationOutput.value, resolveSpeechLang(targetSelect.value));
  });

  sourceSelect.addEventListener("change", function () {
    resetIncrementalTranslationState();
    persistUiPreferences();
    recognitionUseLocalProcessing = false;
    if (recognition && listening) {
      if ("processLocally" in recognition) {
        recognition.processLocally = false;
      }
      recognition.lang = resolveRecognitionLang(sourceSelect.value);
    }
  });

  targetSelect.addEventListener("change", function () {
    resetIncrementalTranslationState();
    persistUiPreferences();
  });

  translateManualBtn.addEventListener("click", function () {
    var text = String(manualInput.value || "").trim();
    if (!text) {
      showError(i18n("errors.noText"));
      return;
    }
    runManualTranslation(text);
  });

  manualInput.addEventListener("input", function () {
    scheduleTypedTranslation(manualInput.value);
  });

  if (translationProviderSelect) {
    translationProviderSelect.addEventListener("change", function () {
      resetIncrementalTranslationState();
      persistUiPreferences();
      var txt = String(manualInput.value || "").trim();
      if (txt.length > 1) {
        scheduleTypedTranslation(txt);
      }
    });
  }

  if (typingSpeedDial && typingSpeedValue) {
    var syncSpeedLabel = function () {
      typingSpeedValue.textContent = String(typingSpeedDial.value || "62");
      syncProfileFromControls();
      persistUiPreferences();
    };
    typingSpeedDial.addEventListener("input", syncSpeedLabel);
    syncSpeedLabel();
  }

  if (typingStaggerToggle) {
    typingStaggerToggle.addEventListener("change", function () {
      syncProfileFromControls();
      persistUiPreferences();
    });
  }

  if (typingProfileSelect) {
    typingProfileSelect.addEventListener("change", function () {
      applyTypingProfile(typingProfileSelect.value);
      persistUiPreferences();
    });
    applyTypingProfile(typingProfileSelect.value || "normal");
  }

  if (liveTranslationFastToggle) {
    liveTranslationFastToggle.addEventListener("change", persistUiPreferences);
  }

  if (watchdogSilenceThresholdSelect) {
    watchdogSilenceThresholdSelect.addEventListener("change", function () {
      persistUiPreferences();
      updateRuntimeStrip();
      if (listeningRequested) {
        startRecognitionWatchdog();
      }
    });
  }
}

function getSafeLocalStorage() {
  try {
    return window.localStorage;
  } catch (_e) {
    return null;
  }
}

function persistUiPreferences() {
  var ls = getSafeLocalStorage();

  var prefs = {
    sourceLanguage: sourceSelect ? sourceSelect.value : "en",
    targetLanguage: targetSelect ? targetSelect.value : "es",
    exportScope: getSelectedExportScope(),
    provider: translationProviderSelect ? translationProviderSelect.value : "google-free",
    typingProfile: typingProfileSelect ? typingProfileSelect.value : "normal",
    typingSpeed: typingSpeedDial ? String(typingSpeedDial.value || "62") : "62",
    typingStagger: !!(typingStaggerToggle && typingStaggerToggle.checked),
    liveFast: !!(liveTranslationFastToggle && liveTranslationFastToggle.checked),
    watchdogSilenceThreshold: watchdogSilenceThresholdSelect ? String(watchdogSilenceThresholdSelect.value || "10") : "10",
  };

  if (ls) {
    try {
      ls.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
    } catch (_e2) {
      // Ignora errores de cuota o modo privado.
    }
  }

  // Respaldo para entornos donde localStorage puede estar restringido.
  try {
    var cookieValue = encodeURIComponent(JSON.stringify(prefs));
    document.cookie = UI_PREFS_COOKIE + "=" + cookieValue + "; Max-Age=31536000; Path=/; SameSite=Lax";
  } catch (_e3) {
    // Ignorado.
  }
}

function restoreUiPreferences() {
  var ls = getSafeLocalStorage();
  var raw = "";
  if (ls) {
    try {
      raw = String(ls.getItem(UI_PREFS_KEY) || "");
    } catch (_e) {
      raw = "";
    }
  }
  if (!raw) {
    raw = readPrefsCookie();
  }
  if (!raw) {
    applyDefaultUiPreferences();
    return;
  }

  var prefs = null;
  try {
    prefs = JSON.parse(raw);
  } catch (_e2) {
    prefs = null;
  }
  if (!prefs || typeof prefs !== "object") {
    return;
  }

  uiPrefsWereRestored = true;

  if (sourceSelect && typeof prefs.sourceLanguage === "string") {
    sourceSelect.value = prefs.sourceLanguage;
  }
  if (targetSelect && typeof prefs.targetLanguage === "string") {
    targetSelect.value = prefs.targetLanguage;
  }
  if (typeof prefs.exportScope === "string") {
    setSelectedExportScope(prefs.exportScope);
  }
  if (translationProviderSelect && typeof prefs.provider === "string") {
    translationProviderSelect.value = prefs.provider;
    if (!translationProviderSelect.value) {
      translationProviderSelect.value = "google-free";
    }
  }
  if (typingProfileSelect && typeof prefs.typingProfile === "string") {
    typingProfileSelect.value = prefs.typingProfile;
  }
  if (typingSpeedDial && typeof prefs.typingSpeed === "string") {
    typingSpeedDial.value = prefs.typingSpeed;
  }
  if (typingStaggerToggle && typeof prefs.typingStagger === "boolean") {
    typingStaggerToggle.checked = prefs.typingStagger;
  }
  if (liveTranslationFastToggle && typeof prefs.liveFast === "boolean") {
    liveTranslationFastToggle.checked = prefs.liveFast;
  }
  if (watchdogSilenceThresholdSelect && typeof prefs.watchdogSilenceThreshold === "string") {
    watchdogSilenceThresholdSelect.value = prefs.watchdogSilenceThreshold;
    if (!watchdogSilenceThresholdSelect.value) {
      watchdogSilenceThresholdSelect.value = "10";
    }
  }

  if (typingSpeedValue && typingSpeedDial) {
    typingSpeedValue.textContent = String(typingSpeedDial.value || "62");
  }
  syncProfileFromControls();

  window.setTimeout(function () {
    if (!uiPrefsWereRestored) {
      return;
    }
    showToast(i18n("toasts.prefsRestored"), "ok");
  }, 80);
}

function applyDefaultUiPreferences() {
  setSelectedExportScope("both");
  if (translationProviderSelect) {
    translationProviderSelect.value = "google-free";
  }
  if (watchdogSilenceThresholdSelect) {
    watchdogSilenceThresholdSelect.value = "10";
  }
}

function getWatchdogSilenceThresholdMs() {
  var raw = watchdogSilenceThresholdSelect ? Number(watchdogSilenceThresholdSelect.value || 10) : 10;
  var seconds = Math.max(5, Math.min(20, raw));
  return seconds * 1000;
}

function getWatchdogStaleThresholdMs() {
  return Math.max(getWatchdogSilenceThresholdMs() + 6000, 15000);
}

function shouldRecreateRecognitionForRestart(reason) {
  var tag = String(reason || "").toLowerCase();
  return /watchdog|rolling-refresh|aborted|stale|hard|visibility-resume/.test(tag);
}

function resetRecognitionRestartPending() {
  recognitionRestartPendingSince = 0;
  recognitionRestartPendingReason = "";
}

function isAwaitingRecognitionEnd(reason) {
  return /await-end/.test(String(reason || "").toLowerCase());
}

async function ensureLocalRecognitionReady(languageCode) {
  if (
    !SpeechRecognitionCtor
    || typeof SpeechRecognitionCtor.available !== "function"
    || typeof SpeechRecognitionCtor.install !== "function"
  ) {
    return false;
  }

  var lang = resolveRecognitionLang(languageCode);
  if (Object.prototype.hasOwnProperty.call(recognitionLocalSupportCache, lang)) {
    return recognitionLocalSupportCache[lang] === true;
  }

  try {
    var availability = await SpeechRecognitionCtor.available({
      langs: [lang],
      processLocally: true,
    });

    if (availability === "available") {
      recognitionLocalSupportCache[lang] = true;
      return true;
    }

    if (availability === "downloadable" || availability === "downloading") {
      setStatus("processing", "Preparando reconocimiento local...");
      var installed = await SpeechRecognitionCtor.install({
        langs: [lang],
        processLocally: true,
      });
      recognitionLocalSupportCache[lang] = installed === true;
      return recognitionLocalSupportCache[lang];
    }
  } catch (_e) {
    // Si el navegador no soporta o falla la instalacion, sigue con modo remoto.
  }

  recognitionLocalSupportCache[lang] = false;
  return false;
}

function readPrefsCookie() {
  var all = String(document.cookie || "");
  if (!all) {
    return "";
  }
  var pairs = all.split(";");
  for (var i = 0; i < pairs.length; i += 1) {
    var piece = String(pairs[i] || "").trim();
    if (piece.indexOf(UI_PREFS_COOKIE + "=") === 0) {
      var val = piece.substring((UI_PREFS_COOKIE + "=").length);
      try {
        return decodeURIComponent(val);
      } catch (_e) {
        return "";
      }
    }
  }
  return "";
}

function getLiveTranslationMode() {
  return liveTranslationFastToggle && liveTranslationFastToggle.checked ? "fast" : "precise";
}

function getLivePreviewIntervalMs() {
  return getLiveTranslationMode() === "fast" ? 90 : 200;
}

function getLivePreviewDebounceMs() {
  return getLiveTranslationMode() === "fast" ? 0 : 35;
}

function getLiveStabilityDelayMs() {
  // Pequeno delay para estabilizar idioma/frase antes de traducir interim.
  return getLiveTranslationMode() === "fast" ? 170 : 320;
}

function getLiveStableTranslationDelayMs() {
  // La traduccion no debe competir con la captura del microfono en cada evento.
  return getLiveTranslationMode() === "fast" ? 900 : 1350;
}

function scheduleLivePreviewTranslation(liveTranscript) {
  // Deshabilitado para evitar mezcla de idiomas por previsualizaciones parciales.
  return;
}

function scheduleStableLiveTranslation(text) {
  if (livePreviewDelayTimer) {
    clearTimeout(livePreviewDelayTimer);
    livePreviewDelayTimer = null;
  }

  var transcript = String(text || "").trim();
  if (!transcript || !listeningRequested) {
    return;
  }

  livePreviewDelayTimer = setTimeout(function () {
    livePreviewDelayTimer = null;
    if (!listeningRequested) {
      return;
    }
    maybeEnqueueLiveTranslation(transcript, false);
  }, getLiveStableTranslationDelayMs());
}

function localWordByWordTranslate(text, dictionary) {
  var parts = String(text || "").split(/(\s+|[.,!?;:])/g);
  var out = "";
  for (var i = 0; i < parts.length; i += 1) {
    var token = String(parts[i] || "");
    if (!token) {
      continue;
    }
    if (/^\s+$/.test(token) || /^[.,!?;:]$/.test(token)) {
      out += token;
      continue;
    }
    var lower = token.toLowerCase();
    var translated = dictionary[lower];
    if (!translated) {
      out += token;
      continue;
    }
    var keepCaps = token.length > 0 && token.charAt(0) === token.charAt(0).toUpperCase();
    out += keepCaps ? (translated.charAt(0).toUpperCase() + translated.slice(1)) : translated;
  }
  return String(out || "").trim();
}

function buildOptimisticPreview(text) {
  var src = String(sourceSelect ? sourceSelect.value : "auto").toLowerCase();
  var tgt = String(targetSelect ? targetSelect.value : "es").toLowerCase();
  var t = String(text || "").trim();
  if (!t) {
    return "";
  }

  if ((src === "en" || src === "auto") && tgt === "es") {
    var es = localWordByWordTranslate(t, LOCAL_GLOSSARY_EN_ES);
    return es || t;
  }
  if ((src === "es" || src === "auto") && tgt === "en") {
    var en = localWordByWordTranslate(t, LOCAL_GLOSSARY_ES_EN);
    return en || t;
  }

  return t;
}

function applyTypingProfile(profileName) {
  var key = String(profileName || "normal").toLowerCase();
  var profile = TYPING_PROFILES[key] || TYPING_PROFILES.normal;

  if (typingSpeedDial) {
    typingSpeedDial.value = String(profile.speed);
  }
  if (typingSpeedValue) {
    typingSpeedValue.textContent = String(profile.speed);
  }
  if (typingStaggerToggle) {
    typingStaggerToggle.checked = !!profile.stagger;
  }
}

function syncProfileFromControls() {
  if (!typingProfileSelect || !typingSpeedDial || !typingStaggerToggle) {
    return;
  }

  var speed = Number(typingSpeedDial.value || 62);
  var stagger = !!typingStaggerToggle.checked;

  var selected = "custom";
  if (speed === TYPING_PROFILES.cinematic.speed && stagger === TYPING_PROFILES.cinematic.stagger) {
    selected = "cinematic";
  } else if (speed === TYPING_PROFILES.normal.speed && stagger === TYPING_PROFILES.normal.stagger) {
    selected = "normal";
  } else if (speed === TYPING_PROFILES.turbo.speed && stagger === TYPING_PROFILES.turbo.stagger) {
    selected = "turbo";
  }

  // Mantiene UX clara: si no coincide con preset, vuelve a mostrar "Normal".
  typingProfileSelect.value = selected === "custom" ? "normal" : selected;
}

function setStatus(state, text) {
  statusBox.textContent = text;
  statusBox.classList.remove("idle", "listening", "processing", "error");
  statusBox.classList.add(state);
  updateRuntimeStrip();
}

function showError(message) {
  if (!message) {
    errorBox.hidden = true;
    errorBox.textContent = "";
    return;
  }

  errorBox.hidden = false;
  errorBox.textContent = message;
}

function ensureToastElement() {
  if (toastEl && document.body.contains(toastEl)) {
    return toastEl;
  }

  toastEl = document.createElement("div");
  toastEl.className = "copy-toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  toastEl.setAttribute("aria-atomic", "true");
  document.body.appendChild(toastEl);
  return toastEl;
}

function showToast(message, tone) {
  var el = ensureToastElement();
  el.textContent = String(message || "");
  el.classList.remove("ok", "warn", "show");
  el.classList.add(tone === "warn" ? "warn" : "ok");

  // Reinicia animacion para toasts consecutivos.
  void el.offsetWidth;
  el.classList.add("show");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(function () {
    if (!toastEl) {
      return;
    }
    toastEl.classList.remove("show");
  }, 1600);
}

function autoScrollToEnd(textarea) {
  textarea.scrollTop = textarea.scrollHeight;
}

function appendTranscriptChunk(chunk) {
  if (!(window.AlbertTranscriptionEngine && window.AlbertTranscriptionEngine.appendTranscriptChunk)) {
    return;
  }

  var next = window.AlbertTranscriptionEngine.appendTranscriptChunk(
    {
      committedText: transcriptCommittedText,
      forTranslation: transcriptForTranslation,
    },
    chunk,
    sourceSelect.value
  );

  transcriptCommittedText = String(next.committedText || "");
  transcriptForTranslation = String(next.forTranslation || "");
  animateTypeInto(transcriptOutput, transcriptCommittedText, "transcript");
  updateRuntimeStrip();
}

function renderTranscriptLive(interimText) {
  if (!(window.AlbertTranscriptionEngine && window.AlbertTranscriptionEngine.renderTranscriptLive)) {
    return;
  }

  var rendered = window.AlbertTranscriptionEngine.renderTranscriptLive(
    transcriptCommittedText,
    interimText,
    sourceSelect.value
  );

  var text = String(rendered.displayText || "");
  if (rendered.hasInterim) {
    transcriptOutput.classList.add("streaming");
  } else {
    transcriptOutput.classList.remove("streaming");
  }

  animateTypeInto(transcriptOutput, text, "transcript");
  updateRuntimeStrip();
}

function composeTranscriptForTranslation(interimText) {
  var base = transcriptForTranslation;
  var interim = String(interimText || "").trim();
  if (!interim) {
    return String(base || "").replace(/\s+/g, " ").trim();
  }
  if (window.AlbertTranscriptionEngine && window.AlbertTranscriptionEngine.appendTranscriptChunk) {
    var preview = window.AlbertTranscriptionEngine.appendTranscriptChunk(
      {
        committedText: transcriptCommittedText,
        forTranslation: transcriptForTranslation,
      },
      interim,
      sourceSelect.value
    );
    return String(preview && preview.forTranslation ? preview.forTranslation : "").replace(/\s+/g, " ").trim();
  }
  return String((base ? base + " " : "") + interim).replace(/\s+/g, " ").trim();
}

function getTranscriptFieldText() {
  return stripVisualCursor(transcriptOutput ? transcriptOutput.value : "");
}

function computeTypeDelayMs(ch, mode) {
  var base = mode === "transcript" ? 10 : 13;
  var dial = typingSpeedDial ? Number(typingSpeedDial.value || 62) : 62;
  var factor = 2.3 - ((dial - 1) / 99) * 2.0;
  if (factor < 0.28) {
    factor = 0.28;
  }
  if (factor > 2.5) {
    factor = 2.5;
  }
  var delay = base * factor;
  if (ch === " ") {
    return Math.max(4, Math.floor(delay * 0.5));
  }
  if (/[,.!?;:]/.test(ch)) {
    return Math.floor(delay + 60);
  }
  if (ch === "\n") {
    return Math.floor(delay + 34);
  }
  return Math.floor(delay + Math.random() * 7);
}

function shouldUseStagger() {
  return !!(typingStaggerToggle && typingStaggerToggle.checked);
}

function nextTypedIndex(target, startIndex) {
  if (!shouldUseStagger()) {
    return startIndex + 1;
  }

  var i = startIndex;
  var n = target.length;
  while (i < n && /\s/.test(target.charAt(i))) {
    i += 1;
  }
  while (i < n && !/\s/.test(target.charAt(i))) {
    i += 1;
  }
  while (i < n && /\s/.test(target.charAt(i))) {
    i += 1;
  }

  return i > startIndex ? i : (startIndex + 1);
}

function renderWithCursor(mode) {
  var state = typewriterStates[mode];
  if (!state || !state.textarea) {
    return;
  }
  var suffix = state.running && state.cursorOn ? "|" : "";
  state.textarea.value = String(state.raw || "") + suffix;
  autoScrollToEnd(state.textarea);
}

function startBlinkingCursor(mode, textarea) {
  var state = typewriterStates[mode];
  if (!state) {
    return;
  }
  state.textarea = textarea;
  if (state.cursorTimer) {
    return;
  }
  state.cursorOn = true;
  renderWithCursor(mode);
  state.cursorTimer = setInterval(function () {
    state.cursorOn = !state.cursorOn;
    renderWithCursor(mode);
  }, 430);
}

function stopTypewriter(mode) {
  var state = typewriterStates[mode];
  if (!state) {
    return;
  }
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  if (state.cursorTimer) {
    clearInterval(state.cursorTimer);
    state.cursorTimer = null;
  }
  if (state.textarea) {
    state.textarea.value = String(state.raw || "");
    autoScrollToEnd(state.textarea);
  }
  state.cursorOn = false;
  state.running = false;
}

function animateTypeInto(textarea, finalText, mode) {
  var state = typewriterStates[mode || "translation"];
  if (!state) {
    textarea.value = String(finalText || "");
    autoScrollToEnd(textarea);
    return;
  }

  if (shouldInstantRenderTypewriter(finalText)) {
    stopTypewriter(mode || "translation");
    state.raw = String(finalText || "");
    textarea.value = state.raw;
    textarea.classList.remove("typing");
    autoScrollToEnd(textarea);
    return;
  }

  state.target = String(finalText || "");

  if (state.running) {
    return;
  }

  function typeStep() {
    var current = String(state.raw || "");
    var target = String(state.target || "");

    if (current === target) {
      stopTypewriter(mode);
      textarea.classList.remove("typing");
      return;
    }

    // Si el target cambia bruscamente, preserva prefijo comun para que se vea natural.
    if (target.indexOf(current) !== 0) {
      var prefixLen = longestCommonPrefixLength(current, target);
      state.raw = target.substring(0, prefixLen);
      if (state.raw === target) {
        stopTypewriter(mode);
        textarea.classList.remove("typing");
        return;
      }
    }

    var nextIndex = nextTypedIndex(target, current.length);
    var nextChar = target.charAt(Math.max(nextIndex - 1, 0));
    state.raw = target.substring(0, nextIndex);
    renderWithCursor(mode);
    textarea.classList.add("typing");

    state.timer = setTimeout(typeStep, computeTypeDelayMs(nextChar, mode));
  }

  state.textarea = textarea;
  startBlinkingCursor(mode, textarea);
  state.running = true;
  typeStep();
}

function enqueueTranslation(text, fromManual, priorityMs, mode) {
  if (translateDebounceTimer) {
    clearTimeout(translateDebounceTimer);
  }

  var waitMs = typeof priorityMs === "number" ? priorityMs : (fromManual ? 0 : 10);
  var queueMode = "replace";

  if (!fromManual && translateInFlight) {
    if (activeTranslationController) {
      try {
        activeTranslationController.abort();
      } catch (_eAbortLatest) {
        // Ignorado.
      }
    }
  }

  translateDebounceTimer = setTimeout(function () {
    var incomingText = String(text || "").trim();
    var incomingManual = fromManual === true;

    if (!incomingText) {
      return;
    }

    queuedTranslationText = incomingText;
    queuedTranslationFromManual = incomingManual;
    queuedTranslationMode = queueMode;
    drainTranslationQueue();
  }, waitMs);
}

async function runManualTranslation(text) {
  var manualText = String(text || "").trim();
  if (!manualText) {
    return;
  }

  if (translateDebounceTimer) {
    clearTimeout(translateDebounceTimer);
    translateDebounceTimer = null;
  }

  queuedTranslationText = "";
  queuedTranslationFromManual = false;
  queuedTranslationMode = "replace";

  if (activeTranslationController) {
    try {
      activeTranslationController.abort();
    } catch (_e) {
      // Ignorado.
    }
  }

  try {
    await processTranscript(manualText, true, "replace");
  } catch (_e2) {
    // processTranscript ya reporta errores.
  }
}

function scheduleTypedTranslation(text) {
  if (typedTranslateDebounceTimer) {
    clearTimeout(typedTranslateDebounceTimer);
    typedTranslateDebounceTimer = null;
  }

  var sourceText = String(text || "").trim();
  if (!sourceText) {
    translationCommittedText = "";
    liveTranslationPreviewText = "";
    animateTypeInto(translationOutput, "", "translation");
    return;
  }

  typedTranslateDebounceTimer = setTimeout(function () {
    runManualTranslation(sourceText);
  }, 65);
}

async function drainTranslationQueue() {
  if (translateInFlight) {
    return;
  }

  var nextText = String(queuedTranslationText || "").trim();
  if (!nextText) {
    return;
  }

  var nextFromManual = queuedTranslationFromManual === true;
  var nextMode = String(queuedTranslationMode || "replace");
  queuedTranslationText = "";
  queuedTranslationFromManual = false;
  queuedTranslationMode = "replace";
  translateInFlight = true;
  activeTranslationMode = nextMode;

  try {
    await processTranscript(nextText, nextFromManual, nextMode);
  } finally {
    translateInFlight = false;
    activeTranslationMode = "replace";
    if (queuedTranslationText) {
      drainTranslationQueue();
    }
  }
}

function normalizeFlatText(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function resetLiveEnqueueState() {
  lastLiveEnqueueTextNorm = "";
  lastLiveEnqueueAt = 0;
}

function maybeEnqueueLiveTranslation(text, force) {
  var value = String(text || "").trim();
  if (!value) {
    return;
  }

  var normalized = normalizeFlatText(value);
  if (!normalized) {
    return;
  }

  var now = Date.now();
  var minGap = getLiveTranslationMode() === "fast" ? 280 : 420;
  if (!force && normalized === lastLiveEnqueueTextNorm && (now - lastLiveEnqueueAt) < 1500) {
    return;
  }
  if (!force && (now - lastLiveEnqueueAt) < minGap) {
    return;
  }

  lastLiveEnqueueTextNorm = normalized;
  lastLiveEnqueueAt = now;
  enqueueTranslation(value, false, 0, "replace");
}

function splitTranscriptIntoSegments(text) {
  var raw = String(text || "").trim();
  if (!raw) {
    return [];
  }

  var lines = raw.split(/\r?\n+/);
  var out = [];
  for (var i = 0; i < lines.length; i += 1) {
    var line = String(lines[i] || "").trim();
    if (!line) {
      continue;
    }

    var parts = [];
    var regex = /[^.!?;:]+[.!?;:]?|[.!?;:]+/g;
    var match = null;
    while ((match = regex.exec(line)) !== null) {
      var piece = String(match[0] || "").trim();
      if (piece) {
        parts.push(piece);
      }
    }

    if (!parts.length) {
      out.push(line);
      continue;
    }

    for (var j = 0; j < parts.length; j += 1) {
      out.push(parts[j]);
    }
  }

  return out;
}

function makeIncrementalContextKey() {
  var src = sourceSelect ? String(sourceSelect.value || "auto").toLowerCase() : "auto";
  var tgt = targetSelect ? String(targetSelect.value || "es").toLowerCase() : "es";
  var provider = translationProviderSelect ? String(translationProviderSelect.value || "auto").toLowerCase() : "auto";
  return [src, tgt, provider].join("|");
}

function resetIncrementalTranslationState() {
  incrementalSourceSegments = [];
  incrementalTranslatedSegments = [];
  incrementalContextKey = "";
  lastIncrementalAddedCount = 0;
  resetLiveEnqueueState();
  updateRuntimeStrip();
}

function findCommonPrefixCount(left, right) {
  var max = Math.min(left.length, right.length);
  var count = 0;
  while (count < max && normalizeFlatText(left[count]) === normalizeFlatText(right[count])) {
    count += 1;
  }
  return count;
}

function splitTranslatedSegmentsText(text, expectedCount) {
  var trimmed = String(text || "").trim();
  if (!trimmed) {
    return [];
  }

  var lines = trimmed
    .split(/\r?\n+/)
    .map(function (line) {
      return String(line || "").trim();
    })
    .filter(Boolean);

  if (expectedCount <= 1) {
    return [trimmed];
  }

  if (lines.length >= expectedCount) {
    return lines.slice(0, expectedCount);
  }

  // Si el proveedor no devolvio saltos por segmento, conserva en un solo bloque.
  return [trimmed];
}

function isEffectiveClientTranslation(original, translated, source, target) {
  if (!translated) {
    return false;
  }
  if (String(source || "").toLowerCase() === String(target || "").toLowerCase()) {
    return true;
  }
  return normalizeFlatText(original) !== normalizeFlatText(translated);
}

function looksMixedForTarget(translated, target) {
  var tgt = String(target || "").toLowerCase();
  if (tgt !== "es") {
    return false;
  }

  var txt = String(translated || "").toLowerCase();
  var englishMarkers = [" the ", " and ", " would ", " should ", " can ", " buy ", " report ", " meeting ", " week ", " ticket ", " tomorrow "];
  var spanishMarkers = [" el ", " la ", " y ", " de ", " para ", " por ", " que ", " una ", " hoy ", " manana ", "reunion", "reporte", "boleto"];

  var hasEn = false;
  var hasEs = false;
  for (var i = 0; i < englishMarkers.length; i += 1) {
    if (txt.indexOf(englishMarkers[i]) !== -1) {
      hasEn = true;
      break;
    }
  }
  for (var j = 0; j < spanishMarkers.length; j += 1) {
    if (txt.indexOf(spanishMarkers[j]) !== -1) {
      hasEs = true;
      break;
    }
  }

  return hasEn && hasEs;
}

function shouldAcceptTranslation(original, translated, source, target) {
  if (!isEffectiveClientTranslation(original, translated, source, target)) {
    return false;
  }
  if (looksMixedForTarget(translated, target)) {
    return false;
  }

  var src = String(source || "").toLowerCase();
  var tgt = String(target || "").toLowerCase();
  if (src === "en" && tgt === "es") {
    var originalWords = countWords(original);
    var translatedWords = countWords(translated);
    if (originalWords >= 4 && translatedWords >= 3) {
      var coverage = estimateEsCoverage(translated);
      if (coverage < 0.22) {
        return false;
      }
    }
  }

  return true;
}

function shouldAcceptPreviewTranslation(original, translated, source, target) {
  if (!translated) {
    return false;
  }
  if (!isEffectiveClientTranslation(original, translated, source, target)) {
    return false;
  }
  if (looksMixedForTarget(translated, target)) {
    return false;
  }

  if (getLiveTranslationMode() === "precise") {
    var src = String(source || "").toLowerCase();
    var tgt = String(target || "").toLowerCase();
    if (src === "en" && tgt === "es") {
      var originalWords = countWords(original);
      var translatedWords = countWords(translated);
      if (originalWords >= 5 && translatedWords >= 4 && estimateEsCoverage(translated) < 0.16) {
        return false;
      }
    }
  }

  return true;
}

function normalizeQuestionPunctuation(text, langCode) {
  if (window.AlbertTranscriptionEngine && window.AlbertTranscriptionEngine.normalizeQuestionPunctuation) {
    return window.AlbertTranscriptionEngine.normalizeQuestionPunctuation(text, langCode);
  }
  return String(text || "").trim();
}

function renderTranslationPreview(translatedPreview) {
  var preview = String(translatedPreview || "").trim();
  liveTranslationPreviewText = preview;
  if (!preview) {
    animateTypeInto(translationOutput, translationCommittedText, "translation");
    return;
  }

  var combined = translationCommittedText
    ? (translationCommittedText + "\n" + preview)
    : preview;
  animateTypeInto(translationOutput, combined, "translation");
}

function estimateEsCoverage(text) {
  var t = String(text || "").toLowerCase();
  if (!t) {
    return 0;
  }

  var tokens = t.match(/[a-záéíóúñü]+/gi) || [];
  if (!tokens.length) {
    return 0;
  }

  var englishHints = {
    the: 1, and: 1, would: 1, should: 1, can: 1, buy: 1, report: 1, meeting: 1,
    week: 1, ticket: 1, tomorrow: 1, guys: 1, know: 1, heard: 1, right: 1, translations: 1
  };
  var spanishHints = {
    el: 1, la: 1, los: 1, las: 1, y: 1, de: 1, para: 1, por: 1, qué: 1, que: 1,
    una: 1, hoy: 1, mañana: 1, reunion: 1, reunión: 1, reporte: 1, boleto: 1,
    está: 1, esta: 1, cómo: 1, como: 1, porqué: 1, porque: 1, nosotros: 1, te: 1,
    gustaria: 1, gustaría: 1, enviar: 1, programar: 1, semana: 1
  };

  var es = 0;
  var en = 0;
  for (var i = 0; i < tokens.length; i += 1) {
    var token = tokens[i];
    if (spanishHints[token]) {
      es += 1;
    }
    if (englishHints[token]) {
      en += 1;
    }
  }

  if (es === 0 && en === 0) {
    return 0.5;
  }
  return es / (es + en);
}

function countWords(text) {
  var t = String(text || "").trim();
  if (!t) {
    return 0;
  }
  var tokens = t.match(/[a-záéíóúñü]+/gi) || [];
  return tokens.length;
}

function appendTranslationChunk(chunk) {
  var normalizedChunk = String(chunk || "").trim();
  if (!normalizedChunk) {
    return;
  }

  if (translationCommittedText) {
    translationCommittedText += "\n";
  }
  translationCommittedText += normalizedChunk;
  animateTypeInto(translationOutput, translationCommittedText, "translation");
}

function pickBestSpeechAlternative(result) {
  if (window.AlbertTranscriptionEngine && window.AlbertTranscriptionEngine.pickBestSpeechAlternative) {
    return window.AlbertTranscriptionEngine.pickBestSpeechAlternative(result);
  }
  return "";
}

async function processTranscript(text, fromManual, mode) {
  var translationMode = "replace";

  if (fromManual) {
    setStatus("processing", i18n("status.processing"));
  }
  showError("");

  var requestTimeoutMs = fromManual ? 14000 : 9000;
  var requestController = new AbortController();
  activeTranslationController = requestController;
  var requestTimeout = setTimeout(function () {
    requestController.abort();
  }, requestTimeoutMs);

  try {
    var translatedText = "";
    if (window.AlbertTranslationEngine && typeof window.AlbertTranslationEngine.translateByPhrases === "function") {
      var isLiveIncremental = !fromManual && listeningRequested;
      var sourceCode = sourceSelect ? sourceSelect.value : "auto";
      var targetCode = targetSelect ? targetSelect.value : "es";
      var providerCode = translationProviderSelect ? translationProviderSelect.value : "google-free";

      if (isLiveIncremental) {
        var segmentsNow = splitTranscriptIntoSegments(text);
        var contextNow = makeIncrementalContextKey();

        if (incrementalContextKey !== contextNow) {
          resetIncrementalTranslationState();
          incrementalContextKey = contextNow;
        }

        var prefixCount = findCommonPrefixCount(incrementalSourceSegments, segmentsNow);
        if (prefixCount < incrementalSourceSegments.length) {
          incrementalSourceSegments = incrementalSourceSegments.slice(0, prefixCount);
          incrementalTranslatedSegments = incrementalTranslatedSegments.slice(0, prefixCount);
        }

        var pendingSegments = segmentsNow.slice(prefixCount);
        var existingTranslatedText = incrementalTranslatedSegments.join("\n").trim();
        lastIncrementalAddedCount = pendingSegments.length;

        if (!pendingSegments.length) {
          translatedText = existingTranslatedText;
        } else {
          var pendingText = pendingSegments.join("\n");
          var pendingTranslatedText = await window.AlbertTranslationEngine.translateByPhrases({
            baseUrl: BASE,
            text: pendingText,
            sourceLanguage: sourceCode,
            targetLanguage: targetCode,
            provider: providerCode,
            signal: requestController.signal,
            onSegment: function (partialTranslation) {
              var stablePrefix = incrementalTranslatedSegments.join("\n").trim();
              var partialTail = String(partialTranslation || "").trim();
              var progressive = stablePrefix && partialTail
                ? (stablePrefix + "\n" + partialTail)
                : (stablePrefix || partialTail);
              if (progressive) {
                animateTypeInto(translationOutput, progressive, "translation");
              }
            },
          });

          var pendingTranslatedSegments = splitTranslatedSegmentsText(pendingTranslatedText, pendingSegments.length);
          for (var i = 0; i < pendingSegments.length; i += 1) {
            var srcSeg = String(pendingSegments[i] || "").trim();
            var trSeg = String(pendingTranslatedSegments[i] || "").trim();
            if (!trSeg && i === 0 && pendingTranslatedSegments.length === 1) {
              trSeg = String(pendingTranslatedSegments[0] || "").trim();
            }
            incrementalSourceSegments.push(srcSeg);
            incrementalTranslatedSegments.push(trSeg);
          }

          translatedText = incrementalTranslatedSegments.join("\n").trim();
        }

        incrementalSourceSegments = segmentsNow.slice();
      } else {
        resetIncrementalTranslationState();
        lastIncrementalAddedCount = splitTranscriptIntoSegments(text).length;
        translatedText = await window.AlbertTranslationEngine.translateByPhrases({
          baseUrl: BASE,
          text: text,
          sourceLanguage: sourceCode,
          targetLanguage: targetCode,
          provider: providerCode,
          signal: requestController.signal,
          onSegment: function (partialTranslation) {
            if (!fromManual && listeningRequested) {
              animateTypeInto(translationOutput, String(partialTranslation || ""), "translation");
            }
          },
        });
      }
    } else {
      var response = await fetch(BASE + "/api/translate-text.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          source_language: sourceSelect.value,
          target_language: targetSelect.value,
          translation_provider: translationProviderSelect ? translationProviderSelect.value : "google-free",
        }),
        signal: requestController.signal,
      });

      var payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || ("HTTP " + response.status));
      }
      translatedText = String(payload.translation || "").trim();
    }

    clearTimeout(requestTimeout);

    var srcCode = sourceSelect ? sourceSelect.value : "auto";
    var tgtCode = targetSelect ? targetSelect.value : "es";

    if (!shouldAcceptTranslation(text, translatedText, srcCode, tgtCode)) {
      var providerFallback = await translateClientSideFallback(text, srcCode, tgtCode);
      if (shouldAcceptTranslation(text, providerFallback, srcCode, tgtCode)) {
        translatedText = providerFallback;
      }
    }

    if (!shouldAcceptTranslation(text, translatedText, srcCode, tgtCode)) {
      var optimistic = buildOptimisticPreview(text);
      if (shouldAcceptTranslation(text, optimistic, srcCode, tgtCode)) {
        translatedText = optimistic;
      }
    }

    if (!translatedText && !fromManual) {
      setStatus(listening ? "listening" : "idle", listening ? "Escuchando en vivo" : "Listo");
      return;
    }

    if (!shouldAcceptTranslation(text, translatedText, srcCode, tgtCode)) {
      if (fromManual) {
        throw new Error(i18n("errors.noTranslation"));
      }
      setStatus(listening ? "listening" : "idle", listening ? "Escuchando en vivo" : "Listo");
      return;
    }

    if (fromManual) {
      resetIncrementalTranslationState();
      var transcriptState = typewriterStates.transcript;
      stopTypewriter("transcript");
      transcriptState.raw = text;
      transcriptOutput.value = text;
      autoScrollToEnd(transcriptOutput);
      transcriptForTranslation = text;
    }

    if (listeningRequested && !fromManual) {
      translationOutput.classList.add("streaming");
    } else {
      translationOutput.classList.remove("streaming");
      if (!fromManual) {
        lastIncrementalAddedCount = 0;
      }
    }

    translationCommittedText = translatedText;
    liveTranslationPreviewText = "";
    animateTypeInto(translationOutput, translatedText, "translation");

    if (translatedText) {
      lastAcceptedTranslation = translatedText;
    }
    updateRuntimeStrip();
    setStatus(listening ? "listening" : "idle", listening ? "Escuchando en vivo" : "Listo");
  } catch (error) {
    if (error && error.name === "AbortError") {
      setStatus(listening ? "listening" : "idle", listening ? "Escuchando en vivo" : "Listo");
      return;
    }
    setStatus("error", "Error");
    showError(String(error && error.message ? error.message : error));
  } finally {
    clearTimeout(requestTimeout);
    if (activeTranslationController === requestController) {
      activeTranslationController = null;
    }
  }
}

function shouldTryClientFallback(original, translated, source, target) {
  if (!original) {
    return false;
  }
  if (String(source || "").toLowerCase() === String(target || "").toLowerCase()) {
    return false;
  }
  var a = String(original).trim().toLowerCase();
  var b = String(translated).trim().toLowerCase();
  return !b || a === b;
}

async function translateClientSideFallback(text, source, target) {
  var src = String(source || "auto").toLowerCase();
  var sl = src === "auto" ? "auto" : src;

  // Primer intento: endpoint publico de Google (resultado mas cercano a Google Translate).
  try {
    var googleUrl = "https://translate.googleapis.com/translate_a/single?client=gtx"
      + "&sl=" + encodeURIComponent(sl)
      + "&tl=" + encodeURIComponent(target)
      + "&dt=t&q=" + encodeURIComponent(text);
    var googleRes = await fetch(googleUrl, { cache: "no-store" });
    if (googleRes.ok) {
      var googleData = await googleRes.json();
      var translated = "";
      if (Array.isArray(googleData) && Array.isArray(googleData[0])) {
        for (var i = 0; i < googleData[0].length; i += 1) {
          var seg = googleData[0][i];
          if (Array.isArray(seg) && typeof seg[0] === "string") {
            translated += seg[0];
          }
        }
      }
      translated = String(translated || "").trim();
      if (translated) {
        return translated;
      }
    }
  } catch (_eGoogle) {
    // Continua con fallback secundario.
  }

  // Segundo intento: MyMemory.
  try {
    var url = "https://api.mymemory.translated.net/get?q="
      + encodeURIComponent(text)
      + "&langpair=" + encodeURIComponent(sl + "|" + target);
    var response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return "";
    }
    var data = await response.json();
    if (data && data.responseData && typeof data.responseData.translatedText === "string") {
      return data.responseData.translatedText.trim();
    }
  } catch (_e) {
    return "";
  }
  return "";
}

async function checkHealth() {
  try {
    var response = await fetch(BASE + "/api/health.php", { cache: "no-store" });
    if (!response.ok) {
      showError(i18n("errors.noHealth"));
      return;
    }
    setStatus("idle", i18n("status.idle"));
  } catch (_e) {
    showError(i18n("errors.noConnection"));
  }
}

function bindRecognitionHandlers(recognitionInstance) {
  if (!recognitionInstance) {
    return;
  }

  recognitionInstance.onstart = function () {
    clearRecognitionRestartTimer();
    resetRecognitionRestartPending();
    if (livePreviewDelayTimer) {
      clearTimeout(livePreviewDelayTimer);
      livePreviewDelayTimer = null;
    }
    recognitionRestartAttempts = 0;
    recognitionConsecutiveErrors = 0;
    recognitionLastResultAt = Date.now();
    recognitionLastEventAt = Date.now();
    recognitionLastRestartAt = Date.now();
    recognitionSessionStartedAt = Date.now();
    startRecognitionWatchdog();
    listening = true;
    // Acelera el heartbeat a 1 s para que los contadores de tiempo sean precisos.
    restartHeartbeat(true);
    startBtn.disabled = true;
    stopBtn.disabled = false;
    showError("");
    setStatus("listening", i18n("status.listening"));
  };

  recognitionInstance.onerror = function (event) {
    recognitionLastEventAt = Date.now();
    var code = String(event && event.error ? event.error : "desconocido");

    if (code === "aborted") {
      if (!listeningRequested) {
        return;
      }
      scheduleRecognitionRestart("error-aborted", 200);
      return;
    }

    if (code === "no-speech") {
      recognitionConsecutiveErrors = 0;
      showError("");
      return;
    }

    if (code === "not-allowed" || code === "service-not-allowed") {
      listeningRequested = false;
      stopRecognitionWatchdog();
      clearRecognitionRestartTimer();
      resetRecognitionRestartPending();
      listening = false;
      restartHeartbeat(false);
      startBtn.disabled = false;
      stopBtn.disabled = true;
      setStatus("error", i18n("errors.micDeniedStatus"));
      showError(i18n("errors.micDenied"));
      return;
    }

    if (!listeningRequested) {
      return;
    }

    recognitionConsecutiveErrors += 1;
    showError("Error de reconocimiento: " + code + ". Reintentando...");
    var extraDelay = recognitionConsecutiveErrors >= 3 ? 520 : 260;
    scheduleRecognitionRestart("error-" + code, extraDelay);
  };

  recognitionInstance.onend = function () {
    recognitionLastEventAt = Date.now();
    clearInterimCommitTimer();
    commitPendingInterim("onend");

    var transcriptNow = String(transcriptForTranslation || "").trim();
    if (transcriptNow) {
      maybeEnqueueLiveTranslation(transcriptNow, true);
    }

    listening = false;
    stopRecognitionWatchdog();
    if (!listeningRequested) {
      // Vuelve al heartbeat lento al detenerse para ahorrar CPU.
      restartHeartbeat(false);
      startBtn.disabled = false;
      stopBtn.disabled = true;
      transcriptOutput.classList.remove("streaming");
      resetRecognitionRestartPending();
      setStatus("idle", i18n("status.idle"));
      return;
    }

    // Si ya hay un reinicio planificado, evita duplicar timers y carreras.
    if (recognitionRestartTimer) {
      return;
    }

    scheduleRecognitionRestart("onend", 140);
  };

  recognitionInstance.onresult = function (event) {
    recognitionLastEventAt = Date.now();
    showError("");
    var parsed = null;
    if (window.AlbertTranscriptionEngine && window.AlbertTranscriptionEngine.parseRecognitionEvent) {
      parsed = window.AlbertTranscriptionEngine.parseRecognitionEvent(event);
    }

    var finalChunk = String(parsed && parsed.finalChunk ? parsed.finalChunk : "").trim();
    var interimChunk = String(parsed && parsed.interimChunk ? parsed.interimChunk : "").trim();
    lastInterimChunk = interimChunk;

    if (finalChunk) {
      clearInterimCommitTimer();
      appendTranscriptChunk(finalChunk);
      lastInterimChunk = "";
      recognitionLastResultAt = Date.now();
      var stableTranscriptNow = String(transcriptForTranslation || "").trim();
      if (stableTranscriptNow) {
        maybeEnqueueLiveTranslation(stableTranscriptNow, true);
      }
      if (livePreviewDelayTimer) {
        clearTimeout(livePreviewDelayTimer);
        livePreviewDelayTimer = null;
      }
    }

    renderTranscriptLive(interimChunk);

    if (interimChunk) {
      scheduleInterimCommitBySilence();
    } else {
      clearInterimCommitTimer();
      if (livePreviewDelayTimer) {
        clearTimeout(livePreviewDelayTimer);
        livePreviewDelayTimer = null;
      }
    }

    var transcriptNow = composeTranscriptForTranslation(interimChunk);
    if (!transcriptNow || transcriptNow.length < 2) {
      return;
    }

    if (interimChunk) {
      scheduleStableLiveTranslation(transcriptNow);
    }

    lastInterimTranslateAt = Date.now();
    recognitionLastResultAt = Date.now();
  };
}

async function startListening() {
  showError("");
  if (!SpeechRecognitionCtor) {
    showError(i18n("errors.noSpeechApi"));
    return;
  }

  if (listening) {
    return;
  }

  listeningRequested = true;
  recognitionLastEventAt = Date.now();
  recognitionUseLocalProcessing = false;
  setStatus("processing", "Iniciando escucha...");

  try {
    recognitionUseLocalProcessing = await ensureLocalRecognitionReady(sourceSelect.value);
  } catch (_e) {
    recognitionUseLocalProcessing = false;
  }

  initializeRecognitionInstance();
  // BUG FIX: guarda null antes de .start() por si el constructor de SpeechRecognition
  // lanzó excepción interna (edge case en algunos navegadores), evitando un TypeError.
  if (!recognition) {
    showError(i18n("errors.noRecognition"));
    listeningRequested = false;
    setStatus("error", i18n("errors.initError"));
    return;
  }
  bindRecognitionHandlers(recognition);
  recognition.start();
}

function initializeRecognitionInstance() {
  if (!SpeechRecognitionCtor) {
    return;
  }
  if (recognition) {
    try {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    } catch (_e) {
      // Ignorado.
    }
  }

  recognition = new SpeechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;
  recognition.lang = resolveRecognitionLang(sourceSelect.value);
  if (recognitionUseLocalProcessing && "processLocally" in recognition) {
    recognition.processLocally = true;
  }
}

function clearRecognitionRestartTimer() {
  if (recognitionRestartTimer) {
    clearTimeout(recognitionRestartTimer);
    recognitionRestartTimer = null;
  }
}

function stopRecognitionWatchdog() {
  if (recognitionWatchdogTimer) {
    clearInterval(recognitionWatchdogTimer);
    recognitionWatchdogTimer = null;
  }
}

function startRecognitionWatchdog() {
  stopRecognitionWatchdog();
  var idleThresholdMs = getWatchdogSilenceThresholdMs();
  var staleThresholdMs = getWatchdogStaleThresholdMs();
  recognitionWatchdogTimer = setInterval(function () {
    if (!listeningRequested || !listening) {
      return;
    }
    var now = Date.now();
    var idleMs = now - Number(recognitionLastResultAt || 0);
    var staleMs = now - Number(recognitionLastEventAt || 0);

    // Si no hay eventos del motor por demasiado tiempo, recrea la instancia completa.
    if (staleMs >= staleThresholdMs) {
      forceRecognitionRecovery("watchdog-stale");
      return;
    }

    // Chromium suele degradarse tras un rato aunque al inicio capture bien.
    // Refresca la instancia en una ventana de calma para volver al estado "fresco".
    var sessionAgeMs = now - Number(recognitionSessionStartedAt || 0);
    var hasPendingInterim = String(lastInterimChunk || "").trim().length > 0;
    if (
      recognitionSessionStartedAt
      && sessionAgeMs >= WATCHDOG_ROLLING_REFRESH_MS
      && idleMs >= WATCHDOG_REFRESH_IDLE_MS
      && !hasPendingInterim
      && (Date.now() - recognitionLastRestartAt) >= 850
    ) {
      try {
        if (recognition) {
          recognition.stop();
        }
      } catch (_eRefresh) {
        // Ignorado.
      }
      scheduleRecognitionRestart("rolling-refresh", 180);
      return;
    }

    if (idleMs < idleThresholdMs) {
      return;
    }

    // Intenta guardar interim antes de forzar reconexion.
    commitPendingInterim("watchdog");

    if ((Date.now() - recognitionLastRestartAt) < 850) {
      return;
    }

    try {
      if (recognition) {
        recognition.stop();
      }
    } catch (_e) {
      // Ignorado.
    }
    scheduleRecognitionRestart("watchdog", 220);
  }, WATCHDOG_POLL_INTERVAL_MS);
}

function forceRecognitionRecovery(reason) {
  if (!listeningRequested) {
    return;
  }

  var now = Date.now();
  if ((now - recognitionLastHardRecoveryAt) < 4500) {
    return;
  }
  recognitionLastHardRecoveryAt = now;

  clearInterimCommitTimer();
  stopRecognitionWatchdog();
  clearRecognitionRestartTimer();
  resetRecognitionRestartPending();

  try {
    if (recognition) {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      if (typeof recognition.abort === "function") {
        recognition.abort();
      } else {
        recognition.stop();
      }
    }
  } catch (_e) {
    // Ignorado.
  }

  recognition = null;
  listening = false;
  showError("");
  scheduleRecognitionRestart(reason + "-hard", 280, true);
}

function scheduleRecognitionRestart(reason, delayMs, skipThrottle) {
  if (!listeningRequested) {
    return;
  }

  var normalizedReason = String(reason || "restart");
  if (!recognitionRestartPendingSince) {
    recognitionRestartPendingSince = Date.now();
  }
  if (!recognitionRestartPendingReason || !isAwaitingRecognitionEnd(normalizedReason)) {
    recognitionRestartPendingReason = normalizedReason;
  }

  if (!skipThrottle && (Date.now() - recognitionLastRestartAt) < 250) {
    return;
  }

  clearRecognitionRestartTimer();
  stopRecognitionWatchdog();
  showError("");
  setStatus("processing", i18n("status.processing"));

  var maxAttempts = 14;
  var backoff = Math.min(1800, Math.max(120, Number(delayMs || 180)) + (recognitionRestartAttempts - 1) * 120);
  recognitionRestartTimer = setTimeout(function () {
    if (!listeningRequested) {
      resetRecognitionRestartPending();
      return;
    }

    // Espera a que el ciclo anterior cierre del todo para reiniciar como un start "limpio".
    if (listening) {
      var waitingForEndMs = Date.now() - Number(recognitionRestartPendingSince || Date.now());
      if (waitingForEndMs >= RECOGNITION_END_WAIT_MS) {
        forceRecognitionRecovery((recognitionRestartPendingReason || normalizedReason) + "-stuck");
        return;
      }
      scheduleRecognitionRestart((recognitionRestartPendingReason || normalizedReason) + "-await-end", 140, true);
      return;
    }

    recognitionRestartAttempts += 1;
    if (recognitionRestartAttempts > maxAttempts) {
      recognitionRestartAttempts = 0;
      showError("Motor de voz saturado, aplicando recuperacion profunda...");
      forceRecognitionRecovery((recognitionRestartPendingReason || normalizedReason) + "-max-attempts");
      return;
    }

    recognitionLastRestartAt = Date.now();
    var restartReason = recognitionRestartPendingReason || normalizedReason;
    var recreateInstance = shouldRecreateRecognitionForRestart(restartReason);
    try {
      if (!recognition || recreateInstance) {
        initializeRecognitionInstance();
      }
      if (recognition) {
        bindRecognitionHandlers(recognition);
        recognition.lang = resolveRecognitionLang(sourceSelect.value);
        recognition.start();
        return;
      }
    } catch (_e) {
      // Intenta recrear la instancia y arrancar una vez mas.
    }

    try {
      initializeRecognitionInstance();
      if (recognition) {
        bindRecognitionHandlers(recognition);
        recognition.start();
        return;
      }
    } catch (_e2) {
      // Sigue al siguiente intento.
    }

    scheduleRecognitionRestart(restartReason + "-retry", backoff + 140);
  }, backoff);
}

function stopListening() {
  listeningRequested = false;
  lastIncrementalAddedCount = 0;
  recognitionConsecutiveErrors = 0;
  recognitionLastEventAt = 0;
  recognitionSessionStartedAt = 0;
  resetRecognitionRestartPending();
  clearInterimCommitTimer();
  stopRecognitionWatchdog();
  clearRecognitionRestartTimer();
  restartHeartbeat(false);
  recognitionRestartAttempts = 0;
  resetLiveEnqueueState();
  if (livePreviewDelayTimer) {
    clearTimeout(livePreviewDelayTimer);
    livePreviewDelayTimer = null;
  }
  lastRenderedLiveSource = "";
  liveTranslationPreviewText = "";
  animateTypeInto(translationOutput, translationCommittedText, "translation");
  commitPendingInterim("stop");

  var transcriptNow = getTranscriptFieldText();
  if (transcriptNow) {
    maybeEnqueueLiveTranslation(transcriptNow, true);
  }

  if (recognition) {
    try {
      recognition.stop();
    } catch (_e) {
      // Ignorado.
    }
  }
}

function clearOutputs() {
  // BUG FIX: aborta la traducción HTTP activa para que no sobreescriba los outputs
  // ya limpiados cuando la respuesta llega unos ms después del clear.
  if (activeTranslationController) {
    try { activeTranslationController.abort(); } catch (_eClear) { /* ignorado */ }
    activeTranslationController = null;
  }
  // BUG FIX: cancela los timers de debounce pendientes para evitar que peticiones
  // encoladas con texto stale se disparen tras el clear.
  if (translateDebounceTimer) {
    clearTimeout(translateDebounceTimer);
    translateDebounceTimer = null;
  }
  if (typedTranslateDebounceTimer) {
    clearTimeout(typedTranslateDebounceTimer);
    typedTranslateDebounceTimer = null;
  }
  stopTypewriter("transcript");
  stopTypewriter("translation");
  clearInterimCommitTimer();
  stopRecognitionWatchdog();
  clearRecognitionRestartTimer();
  recognitionRestartAttempts = 0;
  recognitionLastResultAt = 0;
  recognitionLastEventAt = 0;
  recognitionSessionStartedAt = 0;
  resetRecognitionRestartPending();
  recognitionConsecutiveErrors = 0;
  lastIncrementalAddedCount = 0;
  resetLiveEnqueueState();
  resetIncrementalTranslationState();
  transcriptCommittedText = "";
  transcriptForTranslation = "";
  typewriterStates.transcript.raw = "";
  typewriterStates.translation.raw = "";
  transcriptOutput.value = "";
  transcriptOutput.classList.remove("streaming");
  translationOutput.value = "";
  translationCommittedText = "";
  liveTranslationPreviewText = "";
  lastAcceptedTranslation = "";
  lastRenderedLiveSource = "";
  queuedTranslationText = "";
  queuedTranslationFromManual = false;
  translateInFlight = false;
  lastInterimChunk = "";
  if (window.AlbertTranslationEngine && typeof window.AlbertTranslationEngine.clearCache === "function") {
    window.AlbertTranslationEngine.clearCache();
  }
  manualInput.value = "";
  showError("");
  setStatus("idle", i18n("status.idle"));
}

function swapLanguages() {
  if (sourceSelect.value === "auto") {
    showError(i18n("errors.noSwap"));
    return;
  }

  var source = sourceSelect.value;
  sourceSelect.value = targetSelect.value;
  targetSelect.value = source;
  resetIncrementalTranslationState();

  if (recognition && listening) {
    recognition.lang = resolveRecognitionLang(sourceSelect.value);
  }

  persistUiPreferences();
}

function resolveRecognitionLang(code) {
  if (window.AlbertTranscriptionEngine && window.AlbertTranscriptionEngine.resolveRecognitionLang) {
    return window.AlbertTranscriptionEngine.resolveRecognitionLang(code);
  }
  return "en-US";
}

function resolveSpeechLang(code) {
  return resolveRecognitionLang(code);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function getSelectedExportScope() {
  if (!exportScopeRadios || !exportScopeRadios.length) {
    return "both";
  }
  for (var i = 0; i < exportScopeRadios.length; i += 1) {
    if (exportScopeRadios[i].checked) {
      return String(exportScopeRadios[i].value || "both");
    }
  }
  return "both";
}

function setSelectedExportScope(scope) {
  var normalized = String(scope || "both").toLowerCase();
  var found = false;

  if (!exportScopeRadios || !exportScopeRadios.length) {
    return;
  }

  for (var i = 0; i < exportScopeRadios.length; i += 1) {
    var isMatch = String(exportScopeRadios[i].value || "both").toLowerCase() === normalized;
    exportScopeRadios[i].checked = isMatch;
    found = found || isMatch;
  }

  if (!found) {
    exportScopeRadios[0].checked = true;
  }
}

function buildConversationDefaultFilename(scope) {
  var selected = String(scope || "both").toLowerCase();
  var suffix = "ambos";
  if (selected === "transcript") {
    suffix = "transcripcion";
  } else if (selected === "translation") {
    suffix = "traduccion";
  }

  var d = conversationStartedAt instanceof Date ? conversationStartedAt : new Date();
  var y = d.getFullYear();
  var m = pad2(d.getMonth() + 1);
  var day = pad2(d.getDate());
  var h = pad2(d.getHours());
  var min = pad2(d.getMinutes());
  var s = pad2(d.getSeconds());
  return "conversacion_" + suffix + "_" + y + "-" + m + "-" + day + "_" + h + "-" + min + "-" + s + ".txt";
}

function exportConversationToTxt() {
  var scope = getSelectedExportScope();
  var transcript = stripVisualCursor(transcriptOutput ? transcriptOutput.value : "");
  var translation = stripVisualCursor(translationOutput ? translationOutput.value : "");

  if (scope === "transcript" && !transcript) {
    showError(i18n("errors.noTranscript"));
    showToast(i18n("errors.noTranscript"), "warn");
    return;
  }

  if (scope === "translation" && !translation) {
    showError(i18n("errors.noTranslationExp"));
    showToast(i18n("errors.noTranslationExp"), "warn");
    return;
  }

  if (scope === "both" && !transcript && !translation) {
    showError(i18n("errors.noContent"));
    showToast(i18n("errors.noContent"), "warn");
    return;
  }

  var started = conversationStartedAt instanceof Date ? conversationStartedAt : new Date();
  var lines = [
    "Albert Translator - Exportacion",
    "Inicio conversacion: " + started.toLocaleString(),
    "",
  ];

  if (scope === "both" || scope === "transcript") {
    lines.push("=== TRANSCRIPCION ===");
    lines.push(transcript || "(sin transcripcion)");
    lines.push("");
  }

  if (scope === "both" || scope === "translation") {
    lines.push("=== TRADUCCION ===");
    lines.push(translation || "(sin traduccion)");
    lines.push("");
  }

  var content = lines.join("\n");

  var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildConversationDefaultFilename(scope);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  showError("");
  showToast(i18n("toasts.exported"), "ok");
}

function stripVisualCursor(value) {
  return String(value || "").replace(/\|\s*$/, "").trim();
}

function speakText(value, lang) {
  var text = stripVisualCursor(value);
  if (!text) {
    showError(i18n("errors.noSpeak"));
    return;
  }

  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    showError(i18n("errors.noTts"));
    return;
  }

  forceStopSpeech();
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

async function copyText(value) {
  var text = stripVisualCursor(value);
  if (!text) {
    showError(i18n("errors.noCopy"));
    showToast(i18n("errors.noCopy"), "warn");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast(i18n("toasts.copied"), "ok");
  } catch (_e) {
    showError(i18n("errors.noCopyClipboard"));
    showToast(i18n("toasts.copyFailed"), "warn");
  }
}
