(function () {
  "use strict";

  function normalizeQuestionPunctuation(text, langCode) {
    var raw = String(text || "").trim();
    if (!raw) {
      return "";
    }

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

    return compact + "?";
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

  function appendTranscriptChunk(state, chunk, sourceLanguage) {
    var normalizedChunk = normalizeQuestionPunctuation(String(chunk || "").trim(), sourceLanguage);
    if (!normalizedChunk) {
      return {
        committedText: String(state && state.committedText ? state.committedText : ""),
        forTranslation: String(state && state.forTranslation ? state.forTranslation : ""),
        displayText: String(state && state.committedText ? state.committedText : ""),
      };
    }

    var committedText = String(state && state.committedText ? state.committedText : "");
    var forTranslation = String(state && state.forTranslation ? state.forTranslation : "");

    if (committedText) {
      committedText += "\n";
    }
    committedText += normalizedChunk;

    forTranslation = forTranslation ? (forTranslation + " " + normalizedChunk) : normalizedChunk;

    return {
      committedText: committedText,
      forTranslation: forTranslation,
      displayText: committedText,
    };
  }

  function renderTranscriptLive(committedText, interimText, sourceLanguage) {
    var normalizedInterim = normalizeQuestionPunctuation(String(interimText || "").trim(), sourceLanguage);
    var base = String(committedText || "");
    var text = base;
    if (normalizedInterim) {
      text = base ? (base + "\n" + normalizedInterim) : normalizedInterim;
    }

    return {
      displayText: text,
      hasInterim: Boolean(normalizedInterim),
    };
  }

  function parseRecognitionEvent(event) {
    var finalChunk = "";
    var interimChunk = "";

    for (var i = event.resultIndex; i < event.results.length; i += 1) {
      var result = event.results[i];
      var text = pickBestSpeechAlternative(result);
      if (!text) {
        text = String((result[0] && result[0].transcript) || "").trim();
      }
      if (!text) {
        continue;
      }
      if (result.isFinal) {
        finalChunk += " " + text;
      }
    }

    for (var j = 0; j < event.results.length; j += 1) {
      var fullResult = event.results[j];
      if (fullResult.isFinal) {
        continue;
      }
      var interimText = pickBestSpeechAlternative(fullResult);
      if (!interimText) {
        interimText = String((fullResult[0] && fullResult[0].transcript) || "").trim();
      }
      if (!interimText) {
        continue;
      }
      interimChunk += " " + interimText;
    }

    return {
      finalChunk: finalChunk.trim(),
      interimChunk: interimChunk.trim(),
    };
  }

  window.AlbertTranscriptionEngine = {
    normalizeQuestionPunctuation: normalizeQuestionPunctuation,
    pickBestSpeechAlternative: pickBestSpeechAlternative,
    resolveRecognitionLang: resolveRecognitionLang,
    appendTranscriptChunk: appendTranscriptChunk,
    renderTranscriptLive: renderTranscriptLive,
    parseRecognitionEvent: parseRecognitionEvent,
  };
})();
