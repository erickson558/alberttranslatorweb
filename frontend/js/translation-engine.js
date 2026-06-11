/**
 * AlbertTranslator — Motor de traducción por frases/segmentos.
 *
 * Responsabilidades:
 *  - Dividir el texto en segmentos (frases/oraciones) para traducción incremental.
 *  - Llamar al endpoint PHP /api/translate-text.php por cada segmento.
 *  - Mantener un caché LRU-simple para evitar repetir peticiones idénticas.
 *  - Exponer window.AlbertTranslationEngine para que app.js lo consuma.
 *
 * Rendimiento:
 *  - El caché tiene límite MAX_CACHE_SIZE (80 entradas). Cuando se supera,
 *    se elimina la entrada más antigua (FIFO según orden de inserción del Map).
 *    Sin este límite el Map crecía indefinidamente durante sesiones largas.
 */
(function () {
  "use strict";

  /** Tamaño máximo del caché de traducciones. Limita el uso de RAM. */
  var MAX_CACHE_SIZE = 80;

  /**
   * Caché de segmentos ya traducidos.
   * Clave: "source|target|provider|textoNormalizado"
   * Valor: texto traducido
   * Se usa Map porque mantiene orden de inserción (necesario para la purga FIFO).
   */
  var segmentCache = new Map();

  /**
   * Normaliza espacios y recorta el texto para comparación y como clave de caché.
   * @param {string} text
   * @returns {string}
   */
  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  /**
   * Divide un texto en segmentos por oraciones o frases.
   * Reconoce saltos de línea, puntos, signos de interrogación/exclamación y punto y coma.
   * @param {string} text - Texto completo a segmentar.
   * @returns {string[]} Array de segmentos no vacíos.
   */
  function splitByPhrasesOrSentences(text) {
    var raw = String(text || "").trim();
    if (!raw) {
      return [];
    }

    // Cada línea se segmenta por puntuación internamente.
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
      // Captura tokens completos (con su puntuación final si la tienen).
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

  /**
   * Llama al endpoint de traducción PHP para un segmento individual.
   * @param {string} baseUrl - URL base de la app (sin barra final).
   * @param {Object} payload - { transcript, source_language, target_language, translation_provider }
   * @param {AbortSignal|undefined} signal - Señal de cancelación de fetch.
   * @returns {Promise<string>} Texto traducido normalizado.
   * @throws Error si la respuesta HTTP no es 2xx o el servidor devuelve error.
   */
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

  /**
   * Construye la clave única de caché para un segmento dado.
   * Incluye source, target, provider y texto normalizado para evitar colisiones.
   * @param {string} source
   * @param {string} target
   * @param {string} provider
   * @param {string} text
   * @returns {string}
   */
  function makeCacheKey(source, target, provider, text) {
    return [
      String(source || "auto"),
      String(target || "es"),
      String(provider || "google-free"),
      normalizeText(text),
    ].join("|");
  }

  /**
   * Agrega una entrada al caché respetando el límite MAX_CACHE_SIZE.
   * Si el caché está lleno, elimina la entrada más antigua (FIFO).
   * Esto evita que el Map crezca indefinidamente en sesiones largas, lo que
   * causaba incremento progresivo de RAM sin que el GC pudiera reclamarla.
   * @param {string} key
   * @param {string} value
   */
  function setCacheEntry(key, value) {
    if (segmentCache.has(key)) {
      // Re-insertar al final para refrescar posición FIFO.
      segmentCache.delete(key);
    } else if (segmentCache.size >= MAX_CACHE_SIZE) {
      // Elimina la entrada más antigua (primer elemento del Map).
      var firstKey = segmentCache.keys().next().value;
      segmentCache.delete(firstKey);
    }
    segmentCache.set(key, value);
  }

  /**
   * Traduce un texto completo dividiéndolo en segmentos y procesándolos en serie.
   * Emite resultados parciales via onSegment para actualización progresiva de UI.
   *
   * @param {Object} options
   * @param {string}   options.baseUrl         - URL base de la app.
   * @param {string}   options.text            - Texto a traducir.
   * @param {string}   options.sourceLanguage  - Código de idioma origen (ej. "en", "auto").
   * @param {string}   options.targetLanguage  - Código de idioma destino (ej. "es").
   * @param {string}   options.provider        - Proveedor de traducción.
   * @param {AbortSignal} options.signal       - Señal de cancelación.
   * @param {Function} options.onSegment       - Callback(parcial, índice, total) para progreso.
   * @returns {Promise<string>} Texto completo traducido (segmentos unidos por \n).
   */
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
      // Respeta la señal de cancelación entre segmentos para liberar rápido.
      if (signal && signal.aborted) {
        var abortError = new Error("aborted");
        abortError.name = "AbortError";
        throw abortError;
      }

      var segment = segments[i];
      var cacheKey = makeCacheKey(source, target, provider, segment);
      var translated = "";

      if (segmentCache.has(cacheKey)) {
        // Acierto de caché: sin petición de red.
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
          // Fallo del proveedor seleccionado: reintenta con google-free como último recurso.
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
            translated = "";
          }
        }
        // Guarda en caché respetando el límite de tamaño.
        setCacheEntry(cacheKey, translated);
      }

      translatedSegments.push(translated || "");
      if (onSegment) {
        onSegment(translatedSegments.join("\n"), i + 1, segments.length);
      }
    }

    return translatedSegments.join("\n").trim();
  }

  /**
   * Limpia completamente el caché de segmentos traducidos.
   * Llamar al limpiar la sesión para liberar memoria.
   */
  function clearCache() {
    segmentCache.clear();
  }

  /**
   * Devuelve el número de entradas actualmente en el caché.
   * Útil para diagnóstico/debugging.
   * @returns {number}
   */
  function getCacheSize() {
    return segmentCache.size;
  }

  // Interfaz pública del motor de traducción.
  window.AlbertTranslationEngine = {
    translateByPhrases: translateByPhrases,
    clearCache: clearCache,
    getCacheSize: getCacheSize,
  };
})();
