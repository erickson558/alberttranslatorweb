import { env, pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber = null;
let activeKey = "";
let activeDevice = "wasm";

const WHISPER_LANGUAGE_HINTS = {
  ar: "arabic",
  de: "german",
  el: "greek",
  en: "english",
  es: "spanish",
  fr: "french",
  he: "hebrew",
  hi: "hindi",
  it: "italian",
  ja: "japanese",
  ko: "korean",
  nl: "dutch",
  pl: "polish",
  pt: "portuguese",
  ru: "russian",
  sv: "swedish",
  tr: "turkish",
  uk: "ukrainian",
  zh: "chinese",
};

function resolveLanguageHint(sourceLanguage) {
  const normalized = String(sourceLanguage || "").trim().toLowerCase();
  return WHISPER_LANGUAGE_HINTS[normalized] || null;
}

async function disposeTranscriber() {
  if (!transcriber) {
    return;
  }

  try {
    if (typeof transcriber.dispose === "function") {
      await transcriber.dispose();
    }
  } catch (_e) {
    // Ignorado.
  }

  transcriber = null;
}

async function buildTranscriber(model, device) {
  const options = {
    dtype: "q8",
  };
  if (device === "webgpu") {
    options.device = "webgpu";
  }
  return pipeline("automatic-speech-recognition", model, options);
}

async function ensureTranscriber(model, requestedDevice, key) {
  if (transcriber && activeKey === key) {
    return { key: activeKey, device: activeDevice };
  }

  await disposeTranscriber();

  try {
    transcriber = await buildTranscriber(model, requestedDevice);
    activeKey = key;
    activeDevice = requestedDevice === "webgpu" ? "webgpu" : "wasm";
    return { key: activeKey, device: activeDevice };
  } catch (error) {
    if (requestedDevice === "webgpu") {
      transcriber = await buildTranscriber(model, "wasm");
      activeKey = model + "|wasm";
      activeDevice = "wasm";
      return { key: activeKey, device: activeDevice };
    }
    throw error;
  }
}

async function transcribeAudio(audioBuffer, sourceLanguage) {
  if (!transcriber) {
    throw new Error("Whisper local no está inicializado.");
  }

  const audio = new Float32Array(audioBuffer);
  if (!audio.length) {
    return "";
  }

  const options = {
    task: "transcribe",
    force_full_sequences: true,
  };

  const languageHint = resolveLanguageHint(sourceLanguage);
  if (languageHint) {
    options.language = languageHint;
  }

  const result = await transcriber(audio, options);
  return String((result && result.text) || "").trim();
}

self.onmessage = async function (event) {
  const payload = event && event.data ? event.data : {};
  const type = String(payload.type || "");

  if (type === "init") {
    try {
      const status = await ensureTranscriber(
        String(payload.model || ""),
        String(payload.device || "wasm"),
        String(payload.key || "")
      );

      self.postMessage({
        type: "ready",
        key: status.key,
        device: status.device,
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        scope: "init",
        message: String(error && error.message ? error.message : error),
      });
    }
    return;
  }

  if (type === "transcribe") {
    try {
      const text = await transcribeAudio(payload.audioBuffer, payload.sourceLanguage);
      self.postMessage({
        type: "result",
        id: payload.id,
        sessionId: payload.sessionId,
        text,
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        scope: "transcribe",
        id: payload.id,
        sessionId: payload.sessionId,
        message: String(error && error.message ? error.message : error),
      });
    }
  }
};
