const fs = require("fs");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const source = fs.readFileSync("frontend/js/transcription-engine.js", "utf8");
const context = {
  window: {},
  console,
};

vm.createContext(context);
vm.runInContext(source, context);

const engine = context.window.AlbertTranscriptionEngine;
assert(engine, "AlbertTranscriptionEngine no quedó cargado");

const original = "Hi how are you enjoying your meal I'm loving it the flavors are Amazing Spider-Man";
const revised = "Hi how are you enjoying your meal I'm loving it the flavors are amazing that's great";

const merged = engine.appendTranscriptChunk(
  {
    committedText: original,
    forTranslation: original,
  },
  revised,
  "en"
);

assert(
  merged.committedText === revised,
  "La corrección larga debe reemplazar la última línea, no duplicarla"
);

const preview = engine.renderTranscriptLive(original, revised, "en");
assert(
  preview.displayText === revised,
  "El preview interim debe mostrar la versión corregida sin repetir la frase previa"
);

const extended = engine.appendTranscriptChunk(
  {
    committedText: "I ordered the grilled fish with mash",
    forTranslation: "I ordered the grilled fish with mash",
  },
  "I ordered the grilled fish with mashed potatoes that sounds tasty too",
  "en"
);

assert(
  extended.committedText === "I ordered the grilled fish with mashed potatoes that sounds tasty too",
  "La cola corregida debe sustituir la frase parcial anterior"
);

console.log("transcription engine merge cases ok");
