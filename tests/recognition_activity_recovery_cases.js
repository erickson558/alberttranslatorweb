/*
  Regresion de recuperacion por actividad de microfono.
  Si hay voz real entrando pero no llegan resultados de reconocimiento,
  debe forzarse una recuperacion antes que la de watchdog estancado.
*/

const WATCHDOG_ACTIVE_SPEECH_WINDOW_MS = 2200;
const WATCHDOG_ACTIVE_SPEECH_RESULT_GAP_MS = 4200;

function shouldRecoverFromSpeechActivity(resultGapMs, speechGapMs) {
  return resultGapMs >= WATCHDOG_ACTIVE_SPEECH_RESULT_GAP_MS
    && speechGapMs <= WATCHDOG_ACTIVE_SPEECH_WINDOW_MS;
}

const cases = [
  { resultGapMs: 1200, speechGapMs: 200, expected: false },
  { resultGapMs: 3000, speechGapMs: 500, expected: false },
  { resultGapMs: 4300, speechGapMs: 800, expected: true },
  { resultGapMs: 4300, speechGapMs: 2500, expected: false },
  { resultGapMs: 7000, speechGapMs: 1000, expected: true },
];

let failed = false;
for (let i = 0; i < cases.length; i += 1) {
  const current = cases[i];
  const got = shouldRecoverFromSpeechActivity(current.resultGapMs, current.speechGapMs);
  if (got !== current.expected) {
    failed = true;
    console.error("[FAIL]", { current, got });
  }
}

if (failed) {
  process.exit(1);
}

console.log("[OK] recognition activity recovery cases");
