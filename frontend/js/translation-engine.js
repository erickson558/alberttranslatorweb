(function () {
  "use strict";

  var segmentCache = new Map();

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function splitByPhrasesOrSentences(text) {
    var raw = String(text || "").trim();
    if (!raw) {
      return [];
    }

    var lines = raw
      .split(/\r?\n+/)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean);

    var segments = [];
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
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
        segments.push(line);
        continue;
      }

      for (var j = 0; j < parts.length; j += 1) {
        segments.push(parts[j]);
      }
    }

    return segments;
  }

  async function translateSegment(baseUrl, payload, signal) {
    var response = await fetch(baseUrl + "/api/translate-text.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: signal,
    });

    var body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || ("HTTP " + response.status));
    }

    return normalizeText(body.translation || "");
  }

  function makeCacheKey(source, target, provider, text) {
    return [String(source || "auto"), String(target || "es"), String(provider || "google-free"), normalizeText(text)].join("|");
  }

  async function translateByPhrases(options) {
    var text = String(options && options.text ? options.text : "").trim();
    if (!text) {
      return "";
    }

    var baseUrl = String(options.baseUrl || "").replace(/\/$/, "");
    var source = String(options.sourceLanguage || "auto").toLowerCase();
    var target = String(options.targetLanguage || "es").toLowerCase();
    var provider = String(options.provider || "google-free").toLowerCase();
    var signal = options.signal;
    var onSegment = typeof options.onSegment === "function" ? options.onSegment : null;

    var segments = splitByPhrasesOrSentences(text);
    if (!segments.length) {
      return "";
    }

    var translatedSegments = [];
    for (var i = 0; i < segments.length; i += 1) {
      if (signal && signal.aborted) {
        var abortError = new Error("aborted");
        abortError.name = "AbortError";
        throw abortError;
      }

      var segment = segments[i];
      var cacheKey = makeCacheKey(source, target, provider, segment);
      var translated = "";

      if (segmentCache.has(cacheKey)) {
        translated = segmentCache.get(cacheKey);
      } else {
        try {
          translated = await translateSegment(
            baseUrl,
            {
              transcript: segment,
              source_language: source,
              target_language: target,
              translation_provider: provider,
            },
            signal
          );
        } catch (_segmentError) {
          // Fallback puntual por segmento para mantener flujo incremental.
          try {
            translated = await translateSegment(
              baseUrl,
              {
                transcript: segment,
                source_language: source,
                target_language: target,
                translation_provider: "google-free",
              },
              signal
            );
          } catch (_fallbackError) {
            translated = segment;
          }
        }
        segmentCache.set(cacheKey, translated);
      }

      translatedSegments.push(translated || segment);
      if (onSegment) {
        onSegment(translatedSegments.join("\n"), i + 1, segments.length);
      }
    }

    return translatedSegments.join("\n").trim();
  }

  function clearCache() {
    segmentCache.clear();
  }

  window.AlbertTranslationEngine = {
    translateByPhrases: translateByPhrases,
    clearCache: clearCache,
  };
})();
