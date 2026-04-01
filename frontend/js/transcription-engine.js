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

  function normalizeComparableText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^[\s.,;:!?¿¡"'`()\[\]{}-]+|[\s.,;:!?¿¡"'`()\[\]{}-]+$/g, "")
      .trim();
  }

  function tokenizeComparableWords(text) {
    var normalized = normalizeComparableText(text);
    return normalized ? normalized.split(" ") : [];
  }

  function findWordPrefixCount(leftText, rightText) {
    var leftWords = tokenizeComparableWords(leftText);
    var rightWords = tokenizeComparableWords(rightText);
    var max = Math.min(leftWords.length, rightWords.length);
    var count = 0;

    while (count < max && leftWords[count] === rightWords[count]) {
      count += 1;
    }

    return count;
  }

  function findWordOverlapCount(leftText, rightText) {
    var leftWords = tokenizeComparableWords(leftText);
    var rightWords = tokenizeComparableWords(rightText);
    var max = Math.min(leftWords.length, rightWords.length);

    for (var size = max; size > 0; size -= 1) {
      var overlap = true;
      for (var i = 0; i < size; i += 1) {
        if (leftWords[leftWords.length - size + i] !== rightWords[i]) {
          overlap = false;
          break;
        }
      }
      if (overlap) {
        return size;
      }
    }

    return 0;
  }

  function shouldMergeByOverlap(leftText, rightText, overlapCount) {
    var leftWords = tokenizeComparableWords(leftText);
    var rightWords = tokenizeComparableWords(rightText);
    if (!overlapCount || !leftWords.length || !rightWords.length) {
      return false;
    }

    var shortestSide = Math.min(leftWords.length, rightWords.length);
    return overlapCount >= shortestSide || overlapCount >= 4;
  }

  function shouldReplaceByPrefixRevision(leftText, rightText, prefixCount) {
    var leftWords = tokenizeComparableWords(leftText);
    var rightWords = tokenizeComparableWords(rightText);
    if (!prefixCount || !leftWords.length || !rightWords.length) {
      return false;
    }

    // Cuando Chromium corrige la cola de una frase, suele conservar un prefijo
    // largo y reescribir solo el final. En ese caso conviene reemplazar.
    var shortestSide = Math.min(leftWords.length, rightWords.length);
    if (shortestSide < 4) {
      return false;
    }

    return prefixCount >= 4 && prefixCount >= Math.ceil(shortestSide * 0.6);
  }

  function mergeWithLastCommittedLine(committedText, nextChunk) {
    var text = String(committedText || "");
    var incoming = String(nextChunk || "").trim();
    if (!incoming) {
      return text;
    }

    var lines = text
      ? text.split(/\r?\n+/).map(function (line) {
          return String(line || "").trim();
        }).filter(Boolean)
      : [];

    if (!lines.length) {
      return incoming;
    }

    var lastIndex = lines.length - 1;
    var lastLine = lines[lastIndex];
    var normalizedLast = normalizeComparableText(lastLine);
    var normalizedIncoming = normalizeComparableText(incoming);

    if (!normalizedIncoming) {
      return lines.join("\n");
    }

    if (normalizedIncoming === normalizedLast || normalizedLast.indexOf(normalizedIncoming) === 0) {
      return lines.join("\n");
    }

    if (normalizedIncoming.indexOf(normalizedLast) === 0) {
      lines[lastIndex] = incoming;
      return lines.join("\n");
    }

    var overlapCount = findWordOverlapCount(lastLine, incoming);
    if (shouldMergeByOverlap(lastLine, incoming, overlapCount)) {
      var incomingWords = String(incoming).trim().split(/\s+/);
      lines[lastIndex] = lastLine + " " + incomingWords.slice(overlapCount).join(" ");
      return lines.join("\n");
    }

    var prefixCount = findWordPrefixCount(lastLine, incoming);
    if (shouldReplaceByPrefixRevision(lastLine, incoming, prefixCount)) {
      lines[lastIndex] = incoming;
      return lines.join("\n");
    }

    lines.push(incoming);
    return lines.join("\n");
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

    committedText = mergeWithLastCommittedLine(committedText, normalizedChunk);
    forTranslation = committedText.replace(/\r?\n+/g, " ").replace(/\s+/g, " ").trim();

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
      text = mergeWithLastCommittedLine(base, normalizedInterim);
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
