/*
  Regresion de politica del watchdog de reconocimiento.
  Silencio normal: no reinicia escucha.
  Interim pendiente: no debe comprometer la sesion por silencio.
  Motor estancado: fuerza recuperacion.
*/

const WATCHDOG_STALE_THRESHOLD_MS = 15000;

function getRecognitionWatchdogAction(staleMs) {
  if (staleMs >= WATCHDOG_STALE_THRESHOLD_MS) {
    return "hard-recovery";
  }
  return "none";
}

const cases = [
  { idleMs: 4000, staleMs: 4000, hasPendingInterim: false, expected: "none" },
  { idleMs: 12000, staleMs: 12000, hasPendingInterim: false, expected: "none" },
  { idleMs: 12000, staleMs: 12000, hasPendingInterim: true, expected: "none" },
  { idleMs: 14000, staleMs: 14000, hasPendingInterim: false, expected: "none" },
  { idleMs: 15000, staleMs: 15000, hasPendingInterim: false, expected: "hard-recovery" },
  { idleMs: 17000, staleMs: 17000, hasPendingInterim: true, expected: "hard-recovery" },
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

console.log("[OK] recognition watchdog policy cases");
