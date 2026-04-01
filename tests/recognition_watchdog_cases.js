/*
  Regresion de politica del watchdog de reconocimiento.
  Silencio normal o pausas largas: no reinicia escucha.
  Motor estancado durante demasiado tiempo: fuerza recuperacion.
*/

const WATCHDOG_STALE_THRESHOLD_MS = 45000;

function getRecognitionWatchdogAction(staleMs) {
  if (staleMs >= WATCHDOG_STALE_THRESHOLD_MS) {
    return "hard-recovery";
  }
  return "none";
}

const cases = [
  { staleMs: 4000, expected: "none" },
  { staleMs: 15000, expected: "none" },
  { staleMs: 30000, expected: "none" },
  { staleMs: 44999, expected: "none" },
  { staleMs: 45000, expected: "hard-recovery" },
  { staleMs: 60000, expected: "hard-recovery" },
];

let failed = false;
for (let i = 0; i < cases.length; i += 1) {
  const current = cases[i];
  const got = getRecognitionWatchdogAction(current.staleMs);
  if (got !== current.expected) {
    failed = true;
    console.error("[FAIL]", { current, got });
  }
}

if (failed) {
  process.exit(1);
}

console.log("[OK] recognition watchdog fallback cases");
