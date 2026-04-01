/*
  Regresion de helpers para Whisper local.
  Verifica seleccion de modelo y downsampling basico de audio.
*/

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

function resolveLocalWhisperProfile(languageCode) {
  const normalized = String(languageCode || "").trim().toLowerCase();
  if (normalized === "en") {
    return {
      model: "Xenova/whisper-tiny.en",
      language: "english",
    };
  }

  return {
    model: "Xenova/whisper-tiny",
    language: WHISPER_LANGUAGE_HINTS[normalized] || null,
  };
}

function getPreferredLocalTranscriptionDevice() {
  return "wasm";
}

function downsampleAudioBuffer(input, inputSampleRate, outputSampleRate) {
  if (!input || !input.length) {
    return new Float32Array(0);
  }

  const sourceRate = Math.max(1, Number(inputSampleRate || outputSampleRate || 16000));
  const targetRate = Math.max(1, Number(outputSampleRate || sourceRate));
  if (sourceRate === targetRate) {
    return new Float32Array(input);
  }

  const ratio = sourceRate / targetRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  let offset = 0;
  for (let i = 0; i < outputLength; i += 1) {
    const nextOffset = Math.min(input.length, Math.round((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    while (offset < nextOffset && offset < input.length) {
      sum += input[offset];
      count += 1;
      offset += 1;
    }
    output[i] = count ? (sum / count) : 0;
  }

  return output;
}

let failed = false;

const english = resolveLocalWhisperProfile("en");
if (english.model !== "Xenova/whisper-tiny.en" || english.language !== "english") {
  failed = true;
  console.error("[FAIL] english profile", english);
}

const device = getPreferredLocalTranscriptionDevice();
if (device !== "wasm") {
  failed = true;
  console.error("[FAIL] preferred device", device);
}

const auto = resolveLocalWhisperProfile("auto");
if (auto.model !== "Xenova/whisper-tiny" || auto.language !== null) {
  failed = true;
  console.error("[FAIL] auto profile", auto);
}

const spanish = resolveLocalWhisperProfile("es");
if (spanish.model !== "Xenova/whisper-tiny" || spanish.language !== "spanish") {
  failed = true;
  console.error("[FAIL] spanish profile", spanish);
}

const raw = new Float32Array(4800).fill(0.5);
const downsampled = downsampleAudioBuffer(raw, 48000, 16000);
if (downsampled.length !== 1600) {
  failed = true;
  console.error("[FAIL] downsample size", downsampled.length);
}

if (Math.abs(downsampled[0] - 0.5) > 0.001) {
  failed = true;
  console.error("[FAIL] downsample content", downsampled[0]);
}

if (failed) {
  process.exit(1);
}

console.log("[OK] local whisper helpers cases");
