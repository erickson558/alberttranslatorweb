/*
  Regresion del ledger de resultados de reconocimiento.
  Conserva bloques previos por indice mientras Web Speech solo actualiza
  la cola modificada de la sesion actual.
*/

function joinTranscriptBlocks(parts) {
  return (Array.isArray(parts) ? parts : [])
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n");
}

function createMockResult(text, isFinal) {
  return {
    0: { transcript: text, confidence: 0.8 },
    length: 1,
    isFinal: !!isFinal,
  };
}

function pickBestSpeechAlternative(result) {
  if (!result || typeof result.length !== "number" || result.length < 1) {
    return "";
  }

  let bestText = "";
  let bestScore = -1;
  for (let i = 0; i < result.length; i += 1) {
    const alt = result[i];
    const t = String((alt && alt.transcript) || "").trim();
    if (!t) {
      continue;
    }
    const confidence = typeof alt.confidence === "number" ? alt.confidence : 0;
    const score = confidence * 2 + (t.length / 80);
    if (score > bestScore) {
      bestScore = score;
      bestText = t;
    }
  }

  return bestText;
}

function getRecognitionResultText(result) {
  let text = pickBestSpeechAlternative(result);
  if (!text) {
    text = String((result && result[0] && result[0].transcript) || "").trim();
  }
  return String(text || "").trim();
}

let recognitionResultsLedger = [];

function updateRecognitionResultsLedger(results, resultIndex) {
  if (!results || typeof results.length !== "number") {
    recognitionResultsLedger = [];
    return;
  }

  let startIndex = typeof resultIndex === "number" && resultIndex >= 0
    ? resultIndex
    : 0;

  if (!recognitionResultsLedger.length && startIndex > 0) {
    startIndex = 0;
  }

  for (let i = startIndex; i < results.length; i += 1) {
    const result = results[i];
    recognitionResultsLedger[i] = {
      text: getRecognitionResultText(result),
      isFinal: !!(result && result.isFinal),
    };
  }

  recognitionResultsLedger.length = results.length;
}

function buildRecognitionSnapshot(results, resultIndex) {
  updateRecognitionResultsLedger(results, resultIndex);

  const finalParts = [];
  const interimParts = [];
  for (let i = 0; i < recognitionResultsLedger.length; i += 1) {
    const entry = recognitionResultsLedger[i];
    const text = String((entry && entry.text) || "").trim();
    if (!text) {
      continue;
    }
    if (entry.isFinal) {
      finalParts.push(text);
    } else {
      interimParts.push(text);
    }
  }

  return {
    finalText: joinTranscriptBlocks(finalParts),
    interimText: joinTranscriptBlocks(interimParts),
  };
}

let failed = false;

let snapshot = buildRecognitionSnapshot([
  createMockResult("hi are you traveling", true),
  createMockResult("yes I am", false),
], 0);

if (snapshot.finalText !== "hi are you traveling" || snapshot.interimText !== "yes I am") {
  failed = true;
  console.error("[FAIL] initial snapshot", snapshot);
}

snapshot = buildRecognitionSnapshot([
  createMockResult("hi are you traveling", true),
  createMockResult("yes I am going on vacation", false),
], 1);

if (snapshot.finalText !== "hi are you traveling" || snapshot.interimText !== "yes I am going on vacation") {
  failed = true;
  console.error("[FAIL] tail update snapshot", snapshot);
}

snapshot = buildRecognitionSnapshot([
  createMockResult("hi are you traveling", true),
  createMockResult("yes I am going on vacation", true),
], 1);

if (snapshot.finalText !== "hi are you traveling\nyes I am going on vacation" || snapshot.interimText !== "") {
  failed = true;
  console.error("[FAIL] finalized tail snapshot", snapshot);
}

recognitionResultsLedger = [];
snapshot = buildRecognitionSnapshot([
  createMockResult("new session starts here", false),
], 0);

if (snapshot.finalText !== "" || snapshot.interimText !== "new session starts here") {
  failed = true;
  console.error("[FAIL] new session snapshot", snapshot);
}

if (failed) {
  process.exit(1);
}

console.log("[OK] recognition result ledger cases");
