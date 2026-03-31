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
const savePreferencesBtn = document.getElementById("save-preferences");
const swapBtn = document.getElementById("swap-languages");
const transcriptOutput = document.getElementById("transcript-output");
const translationOutput = document.getElementById("translation-output");
const statusBox = document.getElementById("status");
const errorBox = document.getElementById("error-box");
const copyTranscriptBtn = document.getElementById("copy-transcript");
const copyTranslationBtn = document.getElementById("copy-translation");
const exportTranscriptBtn = document.getElementById("export-transcript");
const exportTranslationBtn = document.getElementById("export-translation");
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

let recognition = null;
let listening = false;
let listeningRequested = false;
let translateDebounceTimer = null;
let typedTranslateDebounceTimer = null;
let livePreviewDelayTimer = null;
let interimCommitTimer = null;
let transcriptCommittedText = "";
let transcriptDisplayText = "";
let transcriptForTranslation = "";
let transcriptHistoryText = "";
let recognitionSessionFinalText = "";
let recognitionSessionInterimText = "";
let recognitionResultsLedger = [];
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
let recognitionRestartTimer = null;
let recognitionWatchdogTimer = null;
let recognitionRestartAttempts = 0;
let recognitionLastResultAt = 0;
let recognitionLastEventAt = 0;
let recognitionLastSpeechActivityAt = 0;
let recognitionConsecutiveErrors = 0;
let recognitionLastRestartAt = 0;
let recognitionLastHardRecoveryAt = 0;
let recognitionActivityStream = null;
let recognitionActivityContext = null;
let recognitionActivitySource = null;
let recognitionActivityAnalyser = null;
let recognitionActivityTimer = null;
let lastLiveEnqueueTextNorm = "";
let lastLiveEnqueueAt = 0;
const typewriterStates = {
  transcript: { timer: null, target: "", running: false, raw: "", cursorOn: false, cursorTimer: null, textarea: null },
  translation: { timer: null, target: "", running: false, raw: "", cursorOn: false, cursorTimer: null, textarea: null },
};
const WATCHDOG_STALE_THRESHOLD_MS = 15000;
const WATCHDOG_POLL_INTERVAL_MS = 3000;
const WATCHDOG_ACTIVE_SPEECH_WINDOW_MS = 2200;
const WATCHDOG_ACTIVE_SPEECH_RESULT_GAP_MS = 4200;

const LOCAL_GLOSSARY_EN_ES = {
  hello: "hola", hi: "hola", how: "cómo", are: "estás", you: "tú", today: "hoy", tomorrow: "mañana", yesterday: "ayer",
  guys: "chicos", so: "así", but: "pero", have: "he", heard: "escuchado", some: "algunas", people: "personas",
  right: "aquí", here: "aquí", say: "decir", down: "abajo", get: "ponerse", well: "bien", do: "hacer", not: "no", know: "sé", okay: "bien", ok: "bien",
  good: "bueno", morning: "manana", afternoon: "tarde", night: "noche",
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
restoreUiPreferences();
wireEvents();
initSpeechUnloadGuards();
checkHealth();

function initSpeechUnloadGuards() {
  // Evita que la voz siga al recargar/cerrar la pagina.
  window.addEventListener("beforeunload", forceStopSpeech, false);
  window.addEventListener("pagehide", forceStopSpeech, false);
  window.addEventListener("beforeunload", stopRecognitionActivityMonitor, false);
  window.addEventListener("pagehide", stopRecognitionActivityMonitor, false);
  window.addEventListener("beforeunload", persistUiPreferences, false);
  // Si la pestaña regresa a primer plano, intenta retomar la escucha caída.
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
  swapBtn.addEventListener("click", swapLanguages);

  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener("click", function () {
      persistUiPreferences();
      setStatus("idle", "Preferencias guardadas");
      setTimeout(function () {
        if (!listening) {
          setStatus("idle", "Listo");
        }
      }, 1100);
    });
  }

  copyTranscriptBtn.addEventListener("click", function () {
    copyText(getTranscriptFieldText());
  });
  copyTranslationBtn.addEventListener("click", function () {
    copyText(translationOutput.value);
  });
  if (exportTranscriptBtn) {
    exportTranscriptBtn.addEventListener("click", function () {
      exportText(getTranscriptFieldText(), "transcripcion");
    });
  }
  if (exportTranslationBtn) {
    exportTranslationBtn.addEventListener("click", function () {
      exportText(translationOutput.value, "traduccion");
    });
  }

  speakTranscriptBtn.addEventListener("click", function () {
    speakText(getTranscriptFieldText(), resolveSpeechLang(sourceSelect.value));
  });
  speakTranslationBtn.addEventListener("click", function () {
    speakText(translationOutput.value, resolveSpeechLang(targetSelect.value));
  });

  sourceSelect.addEventListener("change", function () {
    persistUiPreferences();
    resetLiveEnqueueState();
    if (recognition && listening) {
      recognition.lang = resolveRecognitionLang(sourceSelect.value);
    }
    var transcriptText = getTranscriptFieldText();
    if (transcriptText) {
      enqueueTranslation(transcriptText, false, 0, "replace");
    }
  });

  targetSelect.addEventListener("change", function () {
    persistUiPreferences();
    resetLiveEnqueueState();
    var transcriptText = getTranscriptFieldText();
    if (transcriptText) {
      enqueueTranslation(transcriptText, false, 0, "replace");
    }
  });

  translateManualBtn.addEventListener("click", function () {
    var text = String(manualInput.value || "").trim();
    if (!text) {
      showError("Escribe texto en traducción manual.");
      return;
    }
    runManualTranslation(text);
  });

  manualInput.addEventListener("input", function () {
    scheduleTypedTranslation(manualInput.value);
  });

  if (translationProviderSelect) {
    translationProviderSelect.addEventListener("change", function () {
      persistUiPreferences();
      resetLiveEnqueueState();
      var txt = String(manualInput.value || "").trim();
      if (txt.length > 1) {
        scheduleTypedTranslation(txt);
        return;
      }
      var transcriptText = getTranscriptFieldText();
      if (transcriptText) {
        enqueueTranslation(transcriptText, false, 0, "replace");
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
    provider: translationProviderSelect ? translationProviderSelect.value : "google-free",
    typingProfile: typingProfileSelect ? typingProfileSelect.value : "normal",
    typingSpeed: typingSpeedDial ? String(typingSpeedDial.value || "62") : "62",
    typingStagger: !!(typingStaggerToggle && typingStaggerToggle.checked),
    liveFast: !!(liveTranslationFastToggle && liveTranslationFastToggle.checked),
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

  if (sourceSelect && typeof prefs.sourceLanguage === "string") {
    sourceSelect.value = prefs.sourceLanguage;
  }
  if (targetSelect && typeof prefs.targetLanguage === "string") {
    targetSelect.value = prefs.targetLanguage;
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

  if (typingSpeedValue && typingSpeedDial) {
    typingSpeedValue.textContent = String(typingSpeedDial.value || "62");
  }
  syncProfileFromControls();
}

function applyDefaultUiPreferences() {
  if (translationProviderSelect) {
    translationProviderSelect.value = "google-free";
  }
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

function scheduleLivePreviewTranslation(liveTranscript) {
  // Se desactiva el preview parcial para no degradar la traducción final.
  return;
}

function buildLocalWordByWordPreview(text, dictionary) {
  var parts = String(text || "").split(/(\s+|[.,!?;:])/g);
  var out = "";
  var wordCount = 0;
  var translatedWords = 0;
  for (var i = 0; i < parts.length; i += 1) {
    var token = String(parts[i] || "");
    if (!token) {
      continue;
    }
    if (/^\s+$/.test(token) || /^[.,!?;:]$/.test(token)) {
      out += token;
      continue;
    }
    if (/^[a-záéíóúñü]+$/i.test(token)) {
      wordCount += 1;
    }
    var lower = token.toLowerCase();
    var translated = dictionary[lower];
    if (!translated) {
      out += token;
      continue;
    }
    var keepCaps = token.length > 0 && token.charAt(0) === token.charAt(0).toUpperCase();
    out += keepCaps ? (translated.charAt(0).toUpperCase() + translated.slice(1)) : translated;
    if (/^[a-záéíóúñü]+$/i.test(token)) {
      translatedWords += 1;
    }
  }
  return {
    text: String(out || "").trim(),
    wordCount: wordCount,
    translatedWords: translatedWords,
  };
}

function shouldUseOptimisticPreview(originalText, previewInfo, source, target) {
  if (!previewInfo || !previewInfo.text) {
    return false;
  }
  if (!shouldAcceptPreviewTranslation(originalText, previewInfo.text, source, target)) {
    return false;
  }

  var ratio = previewInfo.wordCount > 0
    ? (previewInfo.translatedWords / previewInfo.wordCount)
    : 0;
  var minRatio = previewInfo.wordCount >= 4 ? 0.78 : 1;
  if (ratio < minRatio) {
    return false;
  }

  // Evita previews locales demasiado literales para frases largas o mixtas.
  if (String(target || "").toLowerCase() === "es" && previewInfo.wordCount >= 4) {
    if (estimateEsCoverage(previewInfo.text) < 0.42) {
      return false;
    }
  }

  return normalizeFlatText(previewInfo.text) !== normalizeFlatText(originalText);
}

function buildOptimisticPreview(text) {
  var src = String(sourceSelect ? sourceSelect.value : "auto").toLowerCase();
  var tgt = String(targetSelect ? targetSelect.value : "es").toLowerCase();
  var t = String(text || "").trim();
  if (!t) {
    return "";
  }

  if ((src === "en" || src === "auto") && tgt === "es") {
    var esPreview = buildLocalWordByWordPreview(t, LOCAL_GLOSSARY_EN_ES);
    return shouldUseOptimisticPreview(t, esPreview, src, tgt) ? esPreview.text : "";
  }
  if ((src === "es" || src === "auto") && tgt === "en") {
    var enPreview = buildLocalWordByWordPreview(t, LOCAL_GLOSSARY_ES_EN);
    return shouldUseOptimisticPreview(t, enPreview, src, tgt) ? enPreview.text : "";
  }

  return "";
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

function autoScrollToEnd(textarea) {
  textarea.scrollTop = textarea.scrollHeight;
}

function splitTranscriptCommittedLines(text) {
  return String(text || "")
    .split(/\r?\n+/)
    .map(function (line) {
      return String(line || "").trim();
    })
    .filter(Boolean);
}

function joinTranscriptBlocks(parts) {
  return (Array.isArray(parts) ? parts : [])
    .map(function (part) {
      return String(part || "").trim();
    })
    .filter(Boolean)
    .join("\n");
}

function rebuildTranscriptForTranslation() {
  transcriptForTranslation = splitTranscriptCommittedLines(transcriptCommittedText)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeTranscriptBlockIntoText(baseText, chunkText) {
  var merged = String(baseText || "");
  var chunkLines = splitTranscriptCommittedLines(chunkText);
  var changed = false;

  if (!chunkLines.length) {
    return {
      text: merged,
      changed: false,
      hasLiveChange: false,
    };
  }

  for (var i = 0; i < chunkLines.length; i += 1) {
    var lineMerge = mergeTranscriptChunkIntoText(merged, chunkLines[i]);
    if (lineMerge.changed) {
      merged = lineMerge.text;
      changed = true;
    }
  }

  return {
    text: merged,
    changed: changed,
    hasLiveChange: changed,
  };
}

function syncTranscriptModelState() {
  // Mantiene separado el historial confirmado del texto provisional de la sesion actual.
  transcriptCommittedText = joinTranscriptBlocks([transcriptHistoryText, recognitionSessionFinalText]);
  rebuildTranscriptForTranslation();

  if (recognitionSessionInterimText) {
    transcriptDisplayText = mergeTranscriptBlockIntoText(transcriptCommittedText, recognitionSessionInterimText).text;
  } else {
    transcriptDisplayText = transcriptCommittedText;
  }

  return transcriptDisplayText;
}

function renderTranscriptFromModel() {
  var displayText = syncTranscriptModelState();
  if (
    recognitionSessionInterimText
    && normalizeFlatText(displayText) !== normalizeFlatText(transcriptCommittedText)
  ) {
    transcriptOutput.classList.add("streaming");
  } else {
    transcriptOutput.classList.remove("streaming");
  }

  animateTypeInto(transcriptOutput, displayText, "transcript");
}

function resetRecognitionSessionState() {
  recognitionSessionFinalText = "";
  recognitionSessionInterimText = "";
  lastInterimChunk = "";
  recognitionResultsLedger = [];
}

function getRecognitionWatchdogAction(staleMs) {
  if (staleMs >= WATCHDOG_STALE_THRESHOLD_MS) {
    return "hard-recovery";
  }

  return "none";
}

function shouldRecoverFromSpeechActivity(resultGapMs, speechGapMs) {
  return resultGapMs >= WATCHDOG_ACTIVE_SPEECH_RESULT_GAP_MS
    && speechGapMs <= WATCHDOG_ACTIVE_SPEECH_WINDOW_MS;
}

function replaceTranscriptTail(lines, lineCount, text) {
  var preserved = lines.slice(0, Math.max(0, lines.length - lineCount));
  preserved.push(String(text || "").trim());
  return preserved.filter(Boolean);
}

function buildTranscriptTailCandidates(lines, maxLines) {
  var limit = Math.min(lines.length, Math.max(1, Number(maxLines || 1)));
  var candidates = [];
  for (var lineCount = limit; lineCount >= 1; lineCount -= 1) {
    candidates.push({
      lineCount: lineCount,
      text: lines.slice(lines.length - lineCount).join(" "),
    });
  }
  return candidates;
}

function normalizeSpeechMergeToken(token) {
  return String(token || "")
    .toLowerCase()
    .replace(/^[^a-z0-9áéíóúñü]+|[^a-z0-9áéíóúñü]+$/gi, "");
}

function splitSpeechMergeTokens(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .map(function (token) {
      return {
        raw: String(token || ""),
        norm: normalizeSpeechMergeToken(token),
      };
    })
    .filter(function (token) {
      return token.raw && token.norm;
    });
}

function speechTokensMatch(textA, textB) {
  var tokensA = splitSpeechMergeTokens(textA);
  var tokensB = splitSpeechMergeTokens(textB);
  if (tokensA.length !== tokensB.length) {
    return false;
  }

  for (var i = 0; i < tokensA.length; i += 1) {
    if (tokensA[i].norm !== tokensB[i].norm) {
      return false;
    }
  }

  return tokensA.length > 0;
}

function isSpeechTokenPrefix(prefixText, fullText) {
  var prefixTokens = splitSpeechMergeTokens(prefixText);
  var fullTokens = splitSpeechMergeTokens(fullText);
  if (!prefixTokens.length || prefixTokens.length > fullTokens.length) {
    return false;
  }

  for (var i = 0; i < prefixTokens.length; i += 1) {
    if (prefixTokens[i].norm !== fullTokens[i].norm) {
      return false;
    }
  }

  return true;
}

function isSpeechTokenSuffix(suffixText, fullText) {
  var suffixTokens = splitSpeechMergeTokens(suffixText);
  var fullTokens = splitSpeechMergeTokens(fullText);
  if (!suffixTokens.length || suffixTokens.length > fullTokens.length) {
    return false;
  }

  var offset = fullTokens.length - suffixTokens.length;
  for (var i = 0; i < suffixTokens.length; i += 1) {
    if (suffixTokens[i].norm !== fullTokens[offset + i].norm) {
      return false;
    }
  }

  return true;
}

function findSpeechOverlapWordCount(previousText, incomingText) {
  var previousTokens = splitSpeechMergeTokens(previousText);
  var incomingTokens = splitSpeechMergeTokens(incomingText);
  if (!previousTokens.length || !incomingTokens.length) {
    return 0;
  }

  var maxOverlap = Math.min(previousTokens.length, incomingTokens.length);
  for (var overlap = maxOverlap; overlap >= 1; overlap -= 1) {
    var matches = true;
    for (var i = 0; i < overlap; i += 1) {
      if (previousTokens[previousTokens.length - overlap + i].norm !== incomingTokens[i].norm) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return overlap;
    }
  }

  return 0;
}

function isReliableSpeechOverlap(previousText, incomingText, overlapWordCount) {
  if (overlapWordCount <= 0) {
    return false;
  }

  var previousTokens = splitSpeechMergeTokens(previousText);
  var incomingTokens = splitSpeechMergeTokens(incomingText);
  if (overlapWordCount > previousTokens.length || overlapWordCount > incomingTokens.length) {
    return false;
  }

  var overlapText = incomingTokens
    .slice(0, overlapWordCount)
    .map(function (token) {
      return token.norm;
    })
    .join(" ");

  if (overlapWordCount >= 3) {
    return true;
  }
  if (overlapWordCount === 2) {
    return overlapText.length >= 8;
  }
  return overlapText.length >= 6;
}

function mergeSpeechChunks(previousText, incomingText, overlapWordCount) {
  var previousTokens = String(previousText || "").trim().split(/\s+/).filter(Boolean);
  var incomingTokens = String(incomingText || "").trim().split(/\s+/).filter(Boolean);
  if (!previousTokens.length) {
    return normalizeQuestionPunctuation(String(incomingText || "").trim(), sourceSelect.value);
  }
  if (!incomingTokens.length) {
    return normalizeQuestionPunctuation(String(previousText || "").trim(), sourceSelect.value);
  }

  var overlap = Math.max(0, Math.min(Number(overlapWordCount || 0), incomingTokens.length));
  return normalizeQuestionPunctuation(
    previousTokens.concat(incomingTokens.slice(overlap)).join(" "),
    sourceSelect.value
  );
}

function mergeTranscriptChunkIntoText(baseText, chunk) {
  var normalizedChunk = normalizeQuestionPunctuation(String(chunk || "").trim(), sourceSelect.value);
  var lines = splitTranscriptCommittedLines(baseText);
  if (!normalizedChunk) {
    return {
      text: lines.join("\n"),
      changed: false,
      hasLiveChange: false,
    };
  }

  if (!lines.length) {
    return {
      text: normalizedChunk,
      changed: true,
      hasLiveChange: true,
    };
  }

  var lastLineIndex = lines.length - 1;
  var lastLine = lines[lastLineIndex];
  var lastNormalized = normalizeFlatText(lastLine);
  var incomingNormalized = normalizeFlatText(normalizedChunk);

  if (!incomingNormalized) {
    return {
      text: lines.join("\n"),
      changed: false,
      hasLiveChange: false,
    };
  }

  // Si el motor recicla una frase ya comprometida, no la vuelve a anexar.
  if (
    speechTokensMatch(normalizedChunk, lastLine)
    || isSpeechTokenPrefix(normalizedChunk, lastLine)
    || isSpeechTokenSuffix(normalizedChunk, lastLine)
  ) {
    return {
      text: lines.join("\n"),
      changed: false,
      hasLiveChange: false,
    };
  }

  // Algunos navegadores promueven un bloque final que combina varias frases ya comprometidas.
  // Revisa la cola reciente completa para fusionar o ignorar sin duplicar lineas.
  var tailCandidates = buildTranscriptTailCandidates(lines, 4);
  for (var candidateIndex = 0; candidateIndex < tailCandidates.length; candidateIndex += 1) {
    var tailCandidate = tailCandidates[candidateIndex];
    var tailText = String(tailCandidate.text || "").trim();
    if (!tailText) {
      continue;
    }

    if (
      speechTokensMatch(normalizedChunk, tailText)
      || isSpeechTokenPrefix(normalizedChunk, tailText)
      || isSpeechTokenSuffix(normalizedChunk, tailText)
    ) {
      return {
        text: lines.join("\n"),
        changed: false,
        hasLiveChange: false,
      };
    }

    // Si el nuevo resultado extiende una cola ya comprometida, sustituye esa cola completa.
    if (isSpeechTokenPrefix(tailText, normalizedChunk)) {
      var replacedPrefixLines = replaceTranscriptTail(lines, tailCandidate.lineCount, normalizedChunk);
      return {
        text: replacedPrefixLines.join("\n"),
        changed: normalizeFlatText(replacedPrefixLines.join("\n")) !== normalizeFlatText(lines.join("\n")),
        hasLiveChange: true,
      };
    }

    var overlapWordCount = findSpeechOverlapWordCount(tailText, normalizedChunk);
    if (isReliableSpeechOverlap(tailText, normalizedChunk, overlapWordCount)) {
      var mergedTail = mergeSpeechChunks(tailText, normalizedChunk, overlapWordCount);
      var replacedOverlapLines = replaceTranscriptTail(lines, tailCandidate.lineCount, mergedTail);
      return {
        text: replacedOverlapLines.join("\n"),
        changed: normalizeFlatText(replacedOverlapLines.join("\n")) !== normalizeFlatText(lines.join("\n")),
        hasLiveChange: true,
      };
    }
  }

  lines.push(normalizedChunk);
  return {
    text: lines.join("\n"),
    changed: true,
    hasLiveChange: true,
  };
}

function appendTranscriptChunk(chunk) {
  // Promueve el texto al historial estable para que no dependa del render visual.
  var merged = mergeTranscriptBlockIntoText(transcriptCommittedText, chunk);
  if (!merged.changed) {
    return false;
  }

  transcriptHistoryText = merged.text;
  resetRecognitionSessionState();
  syncTranscriptModelState();
  transcriptOutput.classList.remove("streaming");
  animateTypeInto(transcriptOutput, transcriptDisplayText, "transcript");
  return true;
}

function renderTranscriptLive(interimText) {
  recognitionSessionInterimText = normalizeQuestionPunctuation(String(interimText || "").trim(), sourceSelect.value);
  lastInterimChunk = recognitionSessionInterimText;
  renderTranscriptFromModel();
}

function composeTranscriptForTranslation(interimText) {
  var base = transcriptForTranslation;
  var interim = String(interimText || "").trim();
  if (!interim) {
    return String(base || "").replace(/\s+/g, " ").trim();
  }
  return String((base ? base + " " : "") + interim).replace(/\s+/g, " ").trim();
}

function getTranscriptFieldText() {
  // La traduccion, copia y exportacion deben leer el modelo canonico, no el textarea animado.
  return String(transcriptDisplayText || transcriptCommittedText || "").trim();
}

function stopRecognitionActivityMonitor() {
  if (recognitionActivityTimer) {
    clearInterval(recognitionActivityTimer);
    recognitionActivityTimer = null;
  }

  if (recognitionActivitySource) {
    try {
      recognitionActivitySource.disconnect();
    } catch (_eSource) {
      // Ignorado.
    }
    recognitionActivitySource = null;
  }

  recognitionActivityAnalyser = null;

  if (recognitionActivityStream) {
    try {
      var tracks = recognitionActivityStream.getTracks ? recognitionActivityStream.getTracks() : [];
      for (var i = 0; i < tracks.length; i += 1) {
        tracks[i].stop();
      }
    } catch (_eStream) {
      // Ignorado.
    }
    recognitionActivityStream = null;
  }

  if (recognitionActivityContext) {
    try {
      if (typeof recognitionActivityContext.close === "function") {
        recognitionActivityContext.close();
      }
    } catch (_eContext) {
      // Ignorado.
    }
    recognitionActivityContext = null;
  }

  recognitionLastSpeechActivityAt = 0;
}

function startRecognitionActivityMonitor() {
  if (
    recognitionActivityTimer
    || !listeningRequested
    || !navigator.mediaDevices
    || typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    return;
  }

  var AudioContextCtor = window.AudioContext || window.webkitAudioContext || null;
  if (!AudioContextCtor) {
    return;
  }

  navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }).then(function (stream) {
    if (!listeningRequested) {
      var pendingTracks = stream.getTracks ? stream.getTracks() : [];
      for (var i = 0; i < pendingTracks.length; i += 1) {
        pendingTracks[i].stop();
      }
      return;
    }

    recognitionActivityStream = stream;
    recognitionActivityContext = new AudioContextCtor();
    recognitionActivityAnalyser = recognitionActivityContext.createAnalyser();
    recognitionActivityAnalyser.fftSize = 1024;
    recognitionActivityAnalyser.smoothingTimeConstant = 0.2;
    recognitionActivitySource = recognitionActivityContext.createMediaStreamSource(stream);
    recognitionActivitySource.connect(recognitionActivityAnalyser);

    var buffer = new Uint8Array(recognitionActivityAnalyser.fftSize);
    recognitionActivityTimer = setInterval(function () {
      if (!recognitionActivityAnalyser) {
        return;
      }

      recognitionActivityAnalyser.getByteTimeDomainData(buffer);
      var energy = 0;
      for (var j = 0; j < buffer.length; j += 1) {
        var sample = (buffer[j] - 128) / 128;
        energy += sample * sample;
      }

      var rms = Math.sqrt(energy / buffer.length);
      if (rms >= 0.045) {
        recognitionLastSpeechActivityAt = Date.now();
      }
    }, 140);
  }).catch(function () {
    // Best effort: si el monitor no puede abrir audio, la escucha sigue funcionando igual.
  });
}

function clearInterimCommitTimer() {
  if (interimCommitTimer) {
    clearTimeout(interimCommitTimer);
    interimCommitTimer = null;
  }
}

function getLastCommittedTranscriptNormalized() {
  var lines = splitTranscriptCommittedLines(transcriptCommittedText);
  if (!lines.length) {
    return "";
  }
  return normalizeFlatText(lines[lines.length - 1]);
}

function canCommitInterimChunk(chunk) {
  var text = String(chunk || "").trim();
  if (!text) {
    return false;
  }

  var normalized = normalizeFlatText(text);
  if (!normalized) {
    return false;
  }

  // Evita duplicar la última frase ya confirmada.
  if (normalized === getLastCommittedTranscriptNormalized()) {
    return false;
  }

  // Solo descarta ruido sin contenido alfanumérico; prioriza no perder frases cortas.
  if (!/[a-z0-9áéíóúñü]/i.test(text)) {
    return false;
  }

  return true;
}

function commitPendingInterim(reason) {
  var pending = String(recognitionSessionInterimText || lastInterimChunk || "").trim();
  if (!canCommitInterimChunk(pending)) {
    return false;
  }

  return commitRecognitionSession(true, reason);
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

    // En pausa breve estabiliza la traduccion, pero no parte la sesion de voz.
    var transcriptNow = getTranscriptFieldText();
    if (transcriptNow) {
      maybeEnqueueLiveTranslation(transcriptNow, true);
    }
  }, delay);
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
    return Math.floor(delay + 50);
  }
  if (ch === "\n") {
    return Math.floor(delay + 24);
  }
  return Math.floor(delay + Math.random() * 9);
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

function shouldInstantRenderTypewriter(mode, target) {
  var text = String(target || "");
  // Mantiene el efecto typewriter en transcripcion salvo cuando el buffer ya es muy grande.
  if (mode === "transcript" && text.length > 3200) {
    return true;
  }
  if (mode !== "transcript" && text.length > 2200) {
    return true;
  }
  return false;
}

function animateTypeInto(textarea, finalText, mode) {
  var state = typewriterStates[mode || "translation"];
  if (!state) {
    textarea.value = String(finalText || "");
    autoScrollToEnd(textarea);
    return;
  }

  state.target = String(finalText || "");

  if (shouldInstantRenderTypewriter(mode, finalText)) {
    stopTypewriter(mode || "translation");
    state.raw = String(finalText || "");
    textarea.value = state.raw;
    textarea.classList.remove("typing");
    autoScrollToEnd(textarea);
    return;
  }

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

    // Si el target cambia bruscamente, sincroniza sin parpadeo.
    if (target.indexOf(current) !== 0) {
      state.raw = target;
      stopTypewriter(mode);
      textarea.classList.remove("typing");
      return;
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
  var queueMode = String(mode || "replace").toLowerCase();

  // El preview optimista en vivo generaba baja calidad; se conserva solo para manual.
  if (fromManual && (queueMode === "replace" || queueMode === "preview")) {
    var optimistic = buildOptimisticPreview(text);
    if (optimistic) {
      renderTranslationPreview(optimistic);
    }
  }

  if (!fromManual && (queueMode === "replace" || queueMode === "preview") && translateInFlight) {
    if (activeTranslationController) {
      try {
        activeTranslationController.abort();
      } catch (_eAbortLatest) {
        // Ignorado.
      }
    }
  }

  // Mientras transcribe, cancela preview viejo y deja pasar el preview nuevo.
  if (!fromManual && queueMode === "preview" && translateInFlight && activeTranslationMode === "preview") {
    if (activeTranslationController) {
      try {
        activeTranslationController.abort();
      } catch (_eAbort) {
        // Ignorado.
      }
    }
  }

  translateDebounceTimer = setTimeout(function () {
    var incomingText = String(text || "").trim();
    var incomingManual = fromManual === true;
    var incomingMode = queueMode;

    if (!incomingText) {
      return;
    }

    var currentMode = String(queuedTranslationMode || "replace");
    var currentHasText = String(queuedTranslationText || "").trim().length > 0;

    // Prioridad: manual > append > replace > preview
    var score = function (isManual, m) {
      if (isManual) {
        return 4;
      }
      if (m === "append") {
        return 3;
      }
      if (m === "replace") {
        return 2;
      }
      return 1;
    };

    var incomingScore = score(incomingManual, incomingMode);
    var currentScore = score(queuedTranslationFromManual === true, currentMode);

    // Evita que previews pisen traducciones finales/manuales ya en cola.
    if (currentHasText && incomingScore < currentScore) {
      return;
    }

    queuedTranslationText = incomingText;
    queuedTranslationFromManual = incomingManual;
    queuedTranslationMode = incomingMode;
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

  var optimistic = buildOptimisticPreview(sourceText);
  if (optimistic) {
    renderTranslationPreview(optimistic);
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
  var minGap = getLiveTranslationMode() === "fast" ? 180 : 260;
  if (!force && normalized === lastLiveEnqueueTextNorm && (now - lastLiveEnqueueAt) < 1500) {
    return;
  }
  if (!force && (now - lastLiveEnqueueAt) < minGap) {
    return;
  }

  // En vivo prioriza exactitud: solo se actualiza con la traduccion validada del backend/fallback real.

  lastLiveEnqueueTextNorm = normalized;
  lastLiveEnqueueAt = now;
  enqueueTranslation(value, false, 0, "replace");
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
  var raw = String(text || "").trim();
  if (!raw) {
    return "";
  }

  // Respeta puntuacion ya existente.
  if (/[?？]$/.test(raw) || /[.!]$/.test(raw)) {
    return raw;
  }

  var compact = raw.replace(/\s+/g, " ").trim();
  var normalizedLang = String(langCode || "").toLowerCase();
  var lower = compact.toLowerCase();

  var englishQuestion = /^(who|what|when|where|why|how|is|are|am|do|does|did|can|could|would|should|will|have|has|had|may)\b/.test(lower);
  var spanishQuestion = /^(que|qué|como|cómo|cuando|cuándo|donde|dónde|por que|por qué|quien|quién|cual|cuál|cuanto|cuánto|puedes|puede|podrias|podrías|deberia|debería|es|son|esta|está|hay|tienes|tiene|vamos|podemos)\b/.test(lower);

  if (!englishQuestion && !spanishQuestion) {
    return compact;
  }

  if (normalizedLang === "es") {
    return "¿" + compact.replace(/^¿+/, "").replace(/\?+$/, "") + "?";
  }

  // Para origen auto o ingles, usa signo final.
  return compact + "?";
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

  return es / Math.max(1, (es + en));
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
  if (!result || typeof result.length !== "number" || result.length < 1) {
    return "";
  }

  var bestText = "";
  var bestScore = -1;
  for (var i = 0; i < result.length; i += 1) {
    var alt = result[i];
    var t = String((alt && alt.transcript) || "").trim();
    if (!t) {
      continue;
    }
    var confidence = typeof alt.confidence === "number" ? alt.confidence : 0;
    var score = confidence * 2 + (t.length / 80);
    if (score > bestScore) {
      bestScore = score;
      bestText = t;
    }
  }

  return bestText;
}

function getRecognitionResultText(result) {
  var text = pickBestSpeechAlternative(result);
  if (!text) {
    text = String((result && result[0] && result[0].transcript) || "").trim();
  }
  return normalizeQuestionPunctuation(String(text || "").trim(), sourceSelect.value);
}

function updateRecognitionResultsLedger(results, resultIndex) {
  if (!results || typeof results.length !== "number") {
    recognitionResultsLedger = [];
    return;
  }

  var startIndex = typeof resultIndex === "number" && resultIndex >= 0
    ? resultIndex
    : 0;

  if (!recognitionResultsLedger.length && startIndex > 0) {
    startIndex = 0;
  }

  for (var i = startIndex; i < results.length; i += 1) {
    var result = results[i];
    var text = getRecognitionResultText(result);
    recognitionResultsLedger[i] = {
      text: text,
      isFinal: !!(result && result.isFinal),
    };
  }

  // Mantiene la cola previa si solo cambio un rango final, pero descarta residuos
  // cuando el motor reduce la lista al iniciar una sesion nueva.
  recognitionResultsLedger.length = results.length;
}

function buildRecognitionSnapshot(results, resultIndex) {
  updateRecognitionResultsLedger(results, resultIndex);

  var finalParts = [];
  var interimParts = [];
  if (!recognitionResultsLedger.length) {
    return {
      finalText: "",
      interimText: "",
    };
  }

  for (var i = 0; i < recognitionResultsLedger.length; i += 1) {
    var entry = recognitionResultsLedger[i];
    var text = String((entry && entry.text) || "").trim();
    if (!text) {
      continue;
    }

    if (entry.isFinal) {
      finalParts.push(text);
    } else {
      interimParts.push(text);
    }
  }

  return {
    finalText: joinTranscriptBlocks(finalParts),
    interimText: joinTranscriptBlocks(interimParts),
  };
}

function commitRecognitionSession(includeInterim, reason) {
  var mergedHistory = transcriptHistoryText;

  if (recognitionSessionFinalText) {
    mergedHistory = mergeTranscriptBlockIntoText(mergedHistory, recognitionSessionFinalText).text;
  }

  var pendingInterim = String(recognitionSessionInterimText || lastInterimChunk || "").trim();
  if (includeInterim && canCommitInterimChunk(pendingInterim)) {
    mergedHistory = mergeTranscriptBlockIntoText(mergedHistory, pendingInterim).text;
  }

  var changed = normalizeFlatText(mergedHistory) !== normalizeFlatText(transcriptHistoryText)
    || recognitionSessionFinalText
    || recognitionSessionInterimText;

  transcriptHistoryText = mergedHistory;
  resetRecognitionSessionState();
  syncTranscriptModelState();
  transcriptOutput.classList.remove("streaming");
  animateTypeInto(transcriptOutput, transcriptDisplayText, "transcript");

  if (changed) {
    var transcriptNow = getTranscriptFieldText();
    if (transcriptNow) {
      maybeEnqueueLiveTranslation(transcriptNow, reason !== "silence");
    }
  }

  return changed;
}

async function processTranscript(text, fromManual, mode) {
  var translationMode = String(mode || "replace").toLowerCase();

  if (fromManual) {
    setStatus("processing", "Traduciendo...");
  }
  showError("");

  var requestTimeoutMs = fromManual ? 14000 : (translationMode === "preview" ? 4500 : 9000);
  var requestController = new AbortController();
  activeTranslationController = requestController;
  var requestTimeout = setTimeout(function () {
    requestController.abort();
  }, requestTimeoutMs);

  try {
    var isPreviewMode = translationMode === "preview";
    var acceptTranslation = function (originalText, candidateText) {
      return isPreviewMode
        ? shouldAcceptPreviewTranslation(originalText, candidateText, sourceSelect.value, targetSelect.value)
        : shouldAcceptTranslation(originalText, candidateText, sourceSelect.value, targetSelect.value);
    };

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

    clearTimeout(requestTimeout);

    var payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || ("HTTP " + response.status));
    }

    var apiTranslation = String(payload.translation || "");
    var translatedText = apiTranslation;
    if (!acceptTranslation(text, translatedText)) {
      var fallback = await translateClientSideFallback(text, sourceSelect.value, targetSelect.value);
      if (acceptTranslation(text, fallback)) {
        translatedText = fallback;
      }
    }

    if (!acceptTranslation(text, translatedText)) {
      var fallbackAuto = await translateClientSideFallback(text, "auto", targetSelect.value);
      if (acceptTranslation(text, fallbackAuto)) {
        translatedText = fallbackAuto;
      }
    }

    if (!acceptTranslation(text, translatedText)) {
      if (translationMode === "append" && !fromManual) {
        // En vivo prioriza no quedarse en blanco: usa API si al menos cambio algo.
        translatedText = isEffectiveClientTranslation(text, apiTranslation, sourceSelect.value, targetSelect.value)
          ? apiTranslation
          : "";
      } else {
        if (fromManual) {
          translatedText = String(apiTranslation || "").trim() || String(text || "").trim();
        } else {
          translatedText = lastAcceptedTranslation || "";
        }
      }
    }

    if (!translatedText && !fromManual) {
      if (translationMode === "preview") {
        translatedText = String(apiTranslation || "").trim() || String(text || "").trim();
      }
    }

    if (!translatedText && !fromManual) {
      setStatus(listening ? "listening" : "idle", listening ? "Escuchando en vivo" : "Listo");
      return;
    }

    if (fromManual) {
      var transcriptState = typewriterStates.transcript;
      stopTypewriter("transcript");
      transcriptHistoryText = String(text || "").trim();
      resetRecognitionSessionState();
      syncTranscriptModelState();
      transcriptState.raw = transcriptDisplayText;
      transcriptOutput.value = transcriptDisplayText;
      transcriptOutput.classList.remove("streaming");
      autoScrollToEnd(transcriptOutput);
      rebuildTranscriptForTranslation();
      translationCommittedText = "";
      liveTranslationPreviewText = "";
    }

    if (listeningRequested && !fromManual && translationMode !== "append") {
      translationOutput.classList.add("streaming");
    } else {
      translationOutput.classList.remove("streaming");
    }

    if (translationMode === "append" && !fromManual) {
      liveTranslationPreviewText = "";
      appendTranslationChunk(translatedText);
    } else if (translationMode === "preview" && !fromManual) {
      renderTranslationPreview(translatedText);
    } else {
      // Mantiene el buffer comprometido sincronizado con la salida visible.
      translationCommittedText = translatedText;
      liveTranslationPreviewText = "";
      animateTypeInto(translationOutput, translatedText, "translation");
    }

    if (translatedText) {
      lastAcceptedTranslation = translatedText;
    }
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
      showError("No se pudo validar API PHP.");
      return;
    }
    setStatus("idle", "Listo");
  } catch (_e) {
    showError("No hay conexion con la API PHP.");
  }
}

function bindRecognitionHandlers() {
  if (!recognition) {
    return;
  }

  recognition.onstart = function () {
    clearRecognitionRestartTimer();
    recognitionRestartAttempts = 0;
    recognitionConsecutiveErrors = 0;
    resetRecognitionSessionState();
    recognitionLastResultAt = Date.now();
    recognitionLastEventAt = Date.now();
    recognitionLastRestartAt = Date.now();
    startRecognitionWatchdog();
    listening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    showError("");
    setStatus("listening", "Escuchando en vivo");
  };

  recognition.onerror = function (event) {
    recognitionLastEventAt = Date.now();
    var code = String(event && event.error ? event.error : "desconocido");

    if (code === "aborted") {
      if (!listeningRequested) {
        return;
      }
      commitRecognitionSession(true, "error-aborted");
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
      stopRecognitionActivityMonitor();
      stopRecognitionWatchdog();
      clearRecognitionRestartTimer();
      listening = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      setStatus("error", "Permiso de microfono denegado");
      showError("Permiso de micrófono denegado. Habilítalo y vuelve a intentar.");
      return;
    }

    if (!listeningRequested) {
      return;
    }

    recognitionConsecutiveErrors += 1;
    commitRecognitionSession(true, "error-" + code);
    showError("Error de reconocimiento: " + code + ". Reintentando...");
    scheduleRecognitionRestart("error-" + code, recognitionConsecutiveErrors >= 3 ? 520 : 260);
  };

  recognition.onend = function () {
    recognitionLastEventAt = Date.now();
    clearInterimCommitTimer();
    if (livePreviewDelayTimer) {
      clearTimeout(livePreviewDelayTimer);
      livePreviewDelayTimer = null;
    }
    lastRenderedLiveSource = "";
    liveTranslationPreviewText = "";
    animateTypeInto(translationOutput, translationCommittedText, "translation");

    commitRecognitionSession(true, "onend");

    listening = false;
    stopRecognitionWatchdog();
    if (!listeningRequested) {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      transcriptOutput.classList.remove("streaming");
      setStatus("idle", "Inactivo");
      return;
    }

    scheduleRecognitionRestart("onend", 140);
  };

  recognition.onresult = function (event) {
    recognitionLastEventAt = Date.now();
    showError("");
    // Mantiene un ledger por indice para no perder bloques previos si el navegador
    // solo actualiza la cola cambiada o reescribe una parte de la sesion.
    var snapshot = buildRecognitionSnapshot(event.results, event.resultIndex);
    recognitionSessionFinalText = snapshot.finalText;
    recognitionSessionInterimText = snapshot.interimText;
    lastInterimChunk = recognitionSessionInterimText;

    renderTranscriptFromModel();

    if (recognitionSessionFinalText) {
      recognitionLastResultAt = Date.now();
      if (livePreviewDelayTimer) {
        clearTimeout(livePreviewDelayTimer);
        livePreviewDelayTimer = null;
      }
    }

    if (recognitionSessionInterimText) {
      scheduleInterimCommitBySilence();
    } else {
      clearInterimCommitTimer();
    }

    var transcriptNow = getTranscriptFieldText();
    if (!transcriptNow || transcriptNow.length < 2) {
      return;
    }

    // Traduce siempre el contenido actual del modelo de transcripción, no del textarea animado.
    maybeEnqueueLiveTranslation(transcriptNow, false);
    lastInterimTranslateAt = Date.now();
    recognitionLastResultAt = Date.now();
  };
}

function prepareRecognitionInstance() {
  initializeRecognitionInstance();
  bindRecognitionHandlers();
}

function startListening() {
  showError("");
  if (!SpeechRecognitionCtor) {
    showError("Tu navegador no soporta reconocimiento de voz Web Speech API.");
    return;
  }

  if (listening) {
    return;
  }

  listeningRequested = true;
  recognitionLastSpeechActivityAt = 0;
  recognitionLastEventAt = Date.now();
  startRecognitionActivityMonitor();
  prepareRecognitionInstance();

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
  recognitionWatchdogTimer = setInterval(function () {
    if (!listeningRequested || !listening) {
      return;
    }

    var now = Date.now();
    var staleMs = now - Number(recognitionLastEventAt || 0);
    var resultGapMs = now - Number(recognitionLastResultAt || 0);
    var speechGapMs = now - Number(recognitionLastSpeechActivityAt || 0);
    var action = getRecognitionWatchdogAction(staleMs);

    // Si el motor deja de emitir eventos por demasiado tiempo, rehace la instancia completa.
    if (action === "hard-recovery") {
      forceRecognitionRecovery("watchdog-stale");
      return;
    }

    // Si hay actividad de voz real sin resultados recientes, el motor quedo "sordo".
    if (shouldRecoverFromSpeechActivity(resultGapMs, speechGapMs)) {
      forceRecognitionRecovery("watchdog-audio-activity");
    }
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
  commitRecognitionSession(true, reason);

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

  if (!skipThrottle && (Date.now() - recognitionLastRestartAt) < 250) {
    return;
  }

  clearRecognitionRestartTimer();
  stopRecognitionWatchdog();
  showError("");
  setStatus("processing", "Reconectando escucha...");

  recognitionRestartAttempts += 1;
  if (recognitionRestartAttempts > 14) {
    recognitionRestartAttempts = 0;
    showError("Motor de voz saturado, aplicando recuperación profunda...");
    forceRecognitionRecovery(reason + "-max-attempts");
    return;
  }

  var backoff = Math.min(1800, Math.max(120, Number(delayMs || 180)) + (recognitionRestartAttempts - 1) * 120);
  recognitionRestartTimer = setTimeout(function () {
    if (!listeningRequested) {
      return;
    }

    recognitionLastRestartAt = Date.now();
    try {
      if (!recognition) {
        prepareRecognitionInstance();
      }
      if (recognition) {
        recognition.lang = resolveRecognitionLang(sourceSelect.value);
        recognition.start();
        return;
      }
    } catch (_e) {
      // Reintenta con nueva instancia en el siguiente bloque.
    }

    try {
      prepareRecognitionInstance();
      if (recognition) {
        recognition.start();
        return;
      }
    } catch (_e2) {
      // Sigue al siguiente intento.
    }

    scheduleRecognitionRestart(reason + "-retry", backoff + 140);
  }, backoff);
}

function stopListening() {
  listeningRequested = false;
  recognitionConsecutiveErrors = 0;
  recognitionLastEventAt = 0;
  recognitionLastSpeechActivityAt = 0;
  stopRecognitionActivityMonitor();
  clearInterimCommitTimer();
  stopRecognitionWatchdog();
  clearRecognitionRestartTimer();
  recognitionRestartAttempts = 0;
  resetLiveEnqueueState();
  if (livePreviewDelayTimer) {
    clearTimeout(livePreviewDelayTimer);
    livePreviewDelayTimer = null;
  }
  lastRenderedLiveSource = "";
  liveTranslationPreviewText = "";
  animateTypeInto(translationOutput, translationCommittedText, "translation");
  commitRecognitionSession(true, "stop");

  if (recognition) {
    try {
      recognition.stop();
    } catch (_e) {
      // Ignorado.
    }
  }
}

function clearOutputs() {
  stopRecognitionActivityMonitor();
  clearInterimCommitTimer();
  stopRecognitionWatchdog();
  clearRecognitionRestartTimer();
  recognitionRestartAttempts = 0;
  recognitionLastResultAt = 0;
  recognitionLastEventAt = 0;
  recognitionLastSpeechActivityAt = 0;
  recognitionConsecutiveErrors = 0;
  recognitionLastRestartAt = 0;
  recognitionLastHardRecoveryAt = 0;
  resetLiveEnqueueState();
  if (translateDebounceTimer) {
    clearTimeout(translateDebounceTimer);
    translateDebounceTimer = null;
  }
  if (typedTranslateDebounceTimer) {
    clearTimeout(typedTranslateDebounceTimer);
    typedTranslateDebounceTimer = null;
  }
  if (livePreviewDelayTimer) {
    clearTimeout(livePreviewDelayTimer);
    livePreviewDelayTimer = null;
  }
  if (activeTranslationController) {
    try {
      activeTranslationController.abort();
    } catch (_eAbortActive) {
      // Ignorado.
    }
    activeTranslationController = null;
  }
  stopTypewriter("transcript");
  stopTypewriter("translation");
  transcriptCommittedText = "";
  transcriptDisplayText = "";
  transcriptForTranslation = "";
  transcriptHistoryText = "";
  recognitionSessionFinalText = "";
  recognitionSessionInterimText = "";
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
  queuedTranslationMode = "replace";
  translateInFlight = false;
  lastInterimChunk = "";
  manualInput.value = "";
  showError("");
  setStatus("idle", "Inactivo");
}

function swapLanguages() {
  if (sourceSelect.value === "auto") {
    showError("No se puede intercambiar cuando origen esta en auto.");
    return;
  }

  var source = sourceSelect.value;
  sourceSelect.value = targetSelect.value;
  targetSelect.value = source;

  if (recognition && listening) {
    recognition.lang = resolveRecognitionLang(sourceSelect.value);
  }

  resetLiveEnqueueState();
  persistUiPreferences();

  var transcriptText = getTranscriptFieldText();
  if (transcriptText) {
    enqueueTranslation(transcriptText, false, 0, "replace");
  }
}

function resolveRecognitionLang(code) {
  var aliases = {
    ar: "ar-SA",
    de: "de-DE",
    el: "el-GR",
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    he: "he-IL",
    hi: "hi-IN",
    it: "it-IT",
    ja: "ja-JP",
    ko: "ko-KR",
    nl: "nl-NL",
    pl: "pl-PL",
    pt: "pt-PT",
    ru: "ru-RU",
    sv: "sv-SE",
    tr: "tr-TR",
    uk: "uk-UA",
    zh: "zh-CN",
  };

  var normalized = String(code || "").trim().toLowerCase();
  if (!normalized || normalized === "auto") {
    return "en-US";
  }
  return aliases[normalized] || (normalized + "-" + normalized.toUpperCase());
}

function resolveSpeechLang(code) {
  return resolveRecognitionLang(code);
}

function stripVisualCursor(value) {
  return String(value || "").replace(/\|\s*$/, "").trim();
}

function speakText(value, lang) {
  var text = stripVisualCursor(value);
  if (!text) {
    showError("No hay texto para leer.");
    return;
  }

  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    showError("Tu navegador no soporta lectura por voz.");
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
    showError("No hay texto para copiar.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch (_e) {
    showError("No se pudo copiar al portapapeles.");
  }
}

function exportText(value, prefix) {
  var text = stripVisualCursor(value);
  if (!text) {
    showError("No hay texto para exportar.");
    return;
  }

  var safePrefix = String(prefix || "export").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  var stamp = new Date().toISOString().replace(/[:.]/g, "-");
  var filename = safePrefix + "-" + stamp + ".txt";
  var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 0);
}
