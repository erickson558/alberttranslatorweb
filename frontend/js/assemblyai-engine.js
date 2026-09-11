/**
 * =============================================================================
 * AlbertAssemblyAIEngine — alternativa de reconocimiento de voz vía streaming
 * de AssemblyAI, para cuando el motor nativo del navegador (Web Speech API)
 * no puede alcanzar el backend de voz de Google (redes corporativas que lo
 * bloquean: el micrófono arranca pero nunca llega ningún resultado).
 *
 * Expone createRecognition(), que devuelve un objeto con la MISMA forma que
 * una instancia nativa de SpeechRecognition (continuous, interimResults, lang,
 * onstart/onresult/onerror/onend, start()/stop()/abort()) para que app.js lo
 * use sin cambios en toda su lógica existente (watchdogs, botones, merge de
 * transcripción). Los eventos "onresult" se sintetizan con la misma forma que
 * espera AlbertTranscriptionEngine.parseRecognitionEvent().
 * =============================================================================
 */
(function () {
  "use strict";

  // Misma URL base que app.js, calculada de forma independiente (este archivo
  // no depende de app.js ni de un <script> inline compartido).
  var BASE_URL = (window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "")).replace(/\/$/, "");

  // Idiomas soportados por el streaming multilingüe de AssemblyAI (Universal-Streaming).
  var SUPPORTED_LANG_PREFIXES = ["en", "es", "fr", "de", "it", "pt"];
  var SAMPLE_RATE = 16000;
  var CHUNK_MS = 100;
  var WORKLET_MODULE_NAME = "pcm-audio-processor";

  // Captura el src de este script en tiempo de carga (document.currentScript
  // solo es válido de forma síncrona), para poder resolver la ruta del
  // AudioWorklet vecino sin importar desde dónde se sirva la app.
  var SELF_SCRIPT_URL = document.currentScript ? document.currentScript.src : "";

  function isSupported() {
    return !!(
      window.WebSocket
      && window.AudioContext
      && window.AudioWorkletNode
      && navigator.mediaDevices
      && navigator.mediaDevices.getUserMedia
    );
  }

  function isLanguageSupported(langCode) {
    var normalized = String(langCode || "").trim().toLowerCase();
    if (!normalized || normalized === "auto") {
      return false;
    }
    var prefix = normalized.split("-")[0];
    return SUPPORTED_LANG_PREFIXES.indexOf(prefix) !== -1;
  }

  function resolveWorkletUrl() {
    if (!SELF_SCRIPT_URL) {
      return "./frontend/js/pcm-audio-processor.js";
    }
    try {
      return new URL("pcm-audio-processor.js", SELF_SCRIPT_URL).href;
    } catch (_e) {
      return "./frontend/js/pcm-audio-processor.js";
    }
  }

  function mergeInt16(a, b) {
    var merged = new Int16Array(a.length + b.length);
    merged.set(a, 0);
    merged.set(b, a.length);
    return merged;
  }

  /** Captura el micrófono y entrega chunks de PCM16 crudo cada ~100ms. */
  function createMicrophoneCapture() {
    var stream = null;
    var audioContext = null;
    var source = null;
    var workletNode = null;
    var queued = new Int16Array(0);

    return {
      requestPermission: async function () {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      },
      start: async function (onChunk) {
        if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        audioContext = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: "balanced" });
        source = audioContext.createMediaStreamSource(stream);
        await audioContext.audioWorklet.addModule(resolveWorkletUrl());

        workletNode = new AudioWorkletNode(audioContext, WORKLET_MODULE_NAME);
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);

        workletNode.port.onmessage = function (event) {
          var incoming = new Int16Array(event.data.audio_data);
          queued = mergeInt16(queued, incoming);

          var durationMs = (queued.length / SAMPLE_RATE) * 1000;
          if (durationMs >= CHUNK_MS) {
            var samplesPerChunk = Math.floor(SAMPLE_RATE * (CHUNK_MS / 1000));
            var toSend = queued.subarray(0, samplesPerChunk);
            queued = queued.subarray(samplesPerChunk);
            onChunk(new Uint8Array(toSend.buffer, toSend.byteOffset, toSend.byteLength));
          }
        };
      },
      stop: function () {
        if (stream) {
          stream.getTracks().forEach(function (track) {
            track.stop();
          });
          stream = null;
        }
        if (audioContext) {
          try {
            audioContext.close();
          } catch (_e) {
            // Ignorado.
          }
          audioContext = null;
        }
        queued = new Int16Array(0);
      },
    };
  }

  /**
   * Crea un objeto "shape-compatible" con SpeechRecognition. app.js lo trata
   * exactamente igual que a `new webkitSpeechRecognition()`.
   */
  function createRecognition() {
    var self = {
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      lang: "en-US",
      onstart: null,
      onresult: null,
      onerror: null,
      onend: null,
    };

    var ws = null;
    var mic = null;
    var finished = false;

    function emitError(code) {
      if (typeof self.onerror === "function") {
        self.onerror({ error: code });
      }
    }

    function emitEnd() {
      if (finished) {
        return;
      }
      finished = true;
      if (typeof self.onend === "function") {
        self.onend();
      }
    }

    // Sintetiza el mismo shape que AlbertTranscriptionEngine.parseRecognitionEvent()
    // espera de un SpeechRecognitionEvent nativo: { resultIndex, results: [...] }.
    function emitResult(transcript, isFinal) {
      if (typeof self.onresult !== "function") {
        return;
      }
      var alt = { transcript: String(transcript || ""), confidence: 1 };
      var result = [alt];
      result.isFinal = !!isFinal;
      self.onresult({ resultIndex: 0, results: [result] });
    }

    function cleanup() {
      if (mic) {
        mic.stop();
        mic = null;
      }
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws = null;
      }
    }

    self.start = async function () {
      finished = false;
      try {
        var tokenResponse = await fetch(BASE_URL + "/api/stt-stream-token.php");
        var tokenData = await tokenResponse.json();
        if (finished) {
          return;
        }
        if (!tokenData || !tokenData.available || !tokenData.token) {
          emitError("assemblyai-unavailable");
          return;
        }

        mic = createMicrophoneCapture();
        await mic.requestPermission();
        if (finished) {
          cleanup();
          return;
        }

        var prefix = String(self.lang || "en").split("-")[0].toLowerCase();
        var params = "sample_rate=" + SAMPLE_RATE + "&format_turns=true&token=" + encodeURIComponent(tokenData.token);
        if (prefix && prefix !== "en") {
          params += "&speech_model=universal-streaming-multilingual&language_codes=" + encodeURIComponent(prefix);
        }

        ws = new WebSocket("wss://streaming.assemblyai.com/v3/ws?" + params);

        ws.onopen = function () {
          if (finished) {
            return;
          }
          mic.start(function (chunk) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(chunk);
            }
          }).catch(function () {
            emitError("audio-capture");
          });
          if (typeof self.onstart === "function") {
            self.onstart();
          }
        };

        ws.onmessage = function (event) {
          if (finished) {
            return;
          }
          var msg;
          try {
            msg = JSON.parse(event.data);
          } catch (_e) {
            return;
          }
          if (msg && msg.type === "Turn") {
            emitResult(msg.transcript, !!msg.end_of_turn);
          }
        };

        ws.onerror = function () {
          emitError("network");
        };

        ws.onclose = function () {
          cleanup();
          emitEnd();
        };
      } catch (err) {
        cleanup();
        emitError(err && err.name === "NotAllowedError" ? "not-allowed" : "audio-capture");
      }
    };

    self.stop = self.abort = function () {
      if (finished) {
        return;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "Terminate" }));
        } catch (_e) {
          // Ignorado.
        }
      }
      cleanup();
      emitEnd();
    };

    return self;
  }

  window.AlbertAssemblyAIEngine = {
    isSupported: isSupported,
    isLanguageSupported: isLanguageSupported,
    createRecognition: createRecognition,
  };
})();
