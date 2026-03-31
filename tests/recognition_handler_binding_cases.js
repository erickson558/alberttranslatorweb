/*
  Regresion del wiring de handlers de reconocimiento.
  Cada nueva instancia creada para reconexion o recuperacion debe salir con
  onstart/onerror/onend/onresult conectados; si no, "escucha" pero no procesa.
*/

let recognition = null;

function initializeRecognitionInstance() {
  recognition = {
    continuous: false,
    interimResults: false,
    maxAlternatives: 0,
    lang: "",
    onstart: null,
    onerror: null,
    onend: null,
    onresult: null,
  };

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;
  recognition.lang = "en-US";
}

function bindRecognitionHandlers() {
  if (!recognition) {
    return;
  }

  recognition.onstart = function () {};
  recognition.onerror = function () {};
  recognition.onend = function () {};
  recognition.onresult = function () {};
}

function prepareRecognitionInstance() {
  initializeRecognitionInstance();
  bindRecognitionHandlers();
}

function hasBoundHandlers(instance) {
  return !!(
    instance
    && typeof instance.onstart === "function"
    && typeof instance.onerror === "function"
    && typeof instance.onend === "function"
    && typeof instance.onresult === "function"
  );
}

let failed = false;

prepareRecognitionInstance();
if (!hasBoundHandlers(recognition)) {
  failed = true;
  console.error("[FAIL] first instance missing handlers", recognition);
}

recognition = null;
prepareRecognitionInstance();
if (!hasBoundHandlers(recognition)) {
  failed = true;
  console.error("[FAIL] recreated instance missing handlers", recognition);
}

if (recognition.continuous !== true || recognition.interimResults !== true || recognition.maxAlternatives !== 5) {
  failed = true;
  console.error("[FAIL] recreated instance lost runtime config", recognition);
}

if (failed) {
  process.exit(1);
}

console.log("[OK] recognition handler binding cases");
