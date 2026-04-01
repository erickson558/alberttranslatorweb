/*
  Regresion de consolidacion en vivo de reconocimiento.
  Los bloques final deben promoverse al historial tan pronto llegan,
  y un interim previo no debe desaparecer si el motor lo reemplaza
  por otro texto sin solapamiento claro.
*/

const sourceSelect = { value: "en" };

function normalizeFlatText(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeQuestionPunctuation(text, langCode) {
  const raw = String(text || "").trim();
  if (!raw) {
    return "";
  }
  if (/[?？]$/.test(raw) || /[.!]$/.test(raw)) {
    return raw;
  }

  const compact = raw.replace(/\s+/g, " ").trim();
  const normalizedLang = String(langCode || "").toLowerCase();
  const lower = compact.toLowerCase();

  const englishQuestion = /^(who|what|when|where|why|how|is|are|am|do|does|did|can|could|would|should|will|have|has|had|may)\b/.test(lower);
  const spanishQuestion = /^(que|qué|como|cómo|cuando|cuándo|donde|dónde|por que|por qué|quien|quién|cual|cuál|cuanto|cuánto|puedes|puede|podrias|podrías|deberia|debería|es|son|esta|está|hay|tienes|tiene|vamos|podemos)\b/.test(lower);

  if (!englishQuestion && !spanishQuestion) {
    return compact;
  }
  if (normalizedLang === "es") {
    return "¿" + compact.replace(/^¿+/, "").replace(/\?+$/, "") + "?";
  }
  return compact + "?";
}

function splitTranscriptCommittedLines(text) {
  return String(text || "")
    .split(/\r?\n+/)
    .map((line) => String(line || "").trim())
    .filter(Boolean);
}

function joinTranscriptBlocks(parts) {
  return (Array.isArray(parts) ? parts : [])
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n");
}

function replaceTranscriptTail(lines, lineCount, text) {
  const preserved = lines.slice(0, Math.max(0, lines.length - lineCount));
  preserved.push(String(text || "").trim());
  return preserved.filter(Boolean);
}

function buildTranscriptTailCandidates(lines, maxLines) {
  const limit = Math.min(lines.length, Math.max(1, Number(maxLines || 1)));
  const candidates = [];
  for (let lineCount = limit; lineCount >= 1; lineCount -= 1) {
    candidates.push({
      lineCount,
      text: lines.slice(lines.length - lineCount).join(" "),
    });
  }
  return candidates;
}

function normalizeSpeechMergeToken(token) {
  return String(token || "")
    .toLowerCase()
    .replace(/^[^a-z0-9áéíóúñü]+|[^a-z0-9áéíóúñü]+$/gi, "");
}

function splitSpeechMergeTokens(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .map((token) => ({
      raw: String(token || ""),
      norm: normalizeSpeechMergeToken(token),
    }))
    .filter((token) => token.raw && token.norm);
}

function speechTokensMatch(textA, textB) {
  const tokensA = splitSpeechMergeTokens(textA);
  const tokensB = splitSpeechMergeTokens(textB);
  if (tokensA.length !== tokensB.length) {
    return false;
  }

  for (let i = 0; i < tokensA.length; i += 1) {
    if (tokensA[i].norm !== tokensB[i].norm) {
      return false;
    }
  }

  return tokensA.length > 0;
}

function isSpeechTokenPrefix(prefixText, fullText) {
  const prefixTokens = splitSpeechMergeTokens(prefixText);
  const fullTokens = splitSpeechMergeTokens(fullText);
  if (!prefixTokens.length || prefixTokens.length > fullTokens.length) {
    return false;
  }

  for (let i = 0; i < prefixTokens.length; i += 1) {
    if (prefixTokens[i].norm !== fullTokens[i].norm) {
      return false;
    }
  }

  return true;
}

function isSpeechTokenSuffix(suffixText, fullText) {
  const suffixTokens = splitSpeechMergeTokens(suffixText);
  const fullTokens = splitSpeechMergeTokens(fullText);
  if (!suffixTokens.length || suffixTokens.length > fullTokens.length) {
    return false;
  }

  const offset = fullTokens.length - suffixTokens.length;
  for (let i = 0; i < suffixTokens.length; i += 1) {
    if (suffixTokens[i].norm !== fullTokens[offset + i].norm) {
      return false;
    }
  }

  return true;
}

function findSpeechOverlapWordCount(previousText, incomingText) {
  const previousTokens = splitSpeechMergeTokens(previousText);
  const incomingTokens = splitSpeechMergeTokens(incomingText);
  if (!previousTokens.length || !incomingTokens.length) {
    return 0;
  }

  const maxOverlap = Math.min(previousTokens.length, incomingTokens.length);
  for (let overlap = maxOverlap; overlap >= 1; overlap -= 1) {
    let matches = true;
    for (let i = 0; i < overlap; i += 1) {
      if (previousTokens[previousTokens.length - overlap + i].norm !== incomingTokens[i].norm) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return overlap;
    }
  }

  return 0;
}

function isReliableSpeechOverlap(previousText, incomingText, overlapWordCount) {
  if (overlapWordCount <= 0) {
    return false;
  }

  const previousTokens = splitSpeechMergeTokens(previousText);
  const incomingTokens = splitSpeechMergeTokens(incomingText);
  if (overlapWordCount > previousTokens.length || overlapWordCount > incomingTokens.length) {
    return false;
  }

  const overlapText = incomingTokens
    .slice(0, overlapWordCount)
    .map((token) => token.norm)
    .join(" ");

  if (overlapWordCount >= 3) {
    return true;
  }
  if (overlapWordCount === 2) {
    return overlapText.length >= 8;
  }
  return overlapText.length >= 6;
}

function mergeSpeechChunks(previousText, incomingText, overlapWordCount) {
  const previousTokens = String(previousText || "").trim().split(/\s+/).filter(Boolean);
  const incomingTokens = String(incomingText || "").trim().split(/\s+/).filter(Boolean);
  if (!previousTokens.length) {
    return normalizeQuestionPunctuation(String(incomingText || "").trim(), sourceSelect.value);
  }
  if (!incomingTokens.length) {
    return normalizeQuestionPunctuation(String(previousText || "").trim(), sourceSelect.value);
  }

  const overlap = Math.max(0, Math.min(Number(overlapWordCount || 0), incomingTokens.length));
  return normalizeQuestionPunctuation(
    previousTokens.concat(incomingTokens.slice(overlap)).join(" "),
    sourceSelect.value
  );
}

function mergeTranscriptChunkIntoText(baseText, chunk) {
  const normalizedChunk = normalizeQuestionPunctuation(String(chunk || "").trim(), sourceSelect.value);
  const lines = splitTranscriptCommittedLines(baseText);
  if (!normalizedChunk) {
    return { text: lines.join("\n"), changed: false };
  }

  if (!lines.length) {
    return { text: normalizedChunk, changed: true };
  }

  const lastLine = lines[lines.length - 1];
  if (
    speechTokensMatch(normalizedChunk, lastLine)
    || isSpeechTokenPrefix(normalizedChunk, lastLine)
    || isSpeechTokenSuffix(normalizedChunk, lastLine)
  ) {
    return { text: lines.join("\n"), changed: false };
  }

  const tailCandidates = buildTranscriptTailCandidates(lines, 4);
  for (let i = 0; i < tailCandidates.length; i += 1) {
    const candidate = tailCandidates[i];
    const tailText = String(candidate.text || "").trim();
    if (!tailText) {
      continue;
    }

    if (
      speechTokensMatch(normalizedChunk, tailText)
      || isSpeechTokenPrefix(normalizedChunk, tailText)
      || isSpeechTokenSuffix(normalizedChunk, tailText)
    ) {
      return { text: lines.join("\n"), changed: false };
    }

    if (isSpeechTokenPrefix(tailText, normalizedChunk)) {
      return {
        text: replaceTranscriptTail(lines, candidate.lineCount, normalizedChunk).join("\n"),
        changed: normalizeFlatText(replaceTranscriptTail(lines, candidate.lineCount, normalizedChunk).join("\n")) !== normalizeFlatText(lines.join("\n")),
      };
    }

    const overlapWordCount = findSpeechOverlapWordCount(tailText, normalizedChunk);
    if (isReliableSpeechOverlap(tailText, normalizedChunk, overlapWordCount)) {
      return {
        text: replaceTranscriptTail(
          lines,
          candidate.lineCount,
          mergeSpeechChunks(tailText, normalizedChunk, overlapWordCount)
        ).join("\n"),
        changed: true,
      };
    }
  }

  return {
    text: lines.concat([normalizedChunk]).join("\n"),
    changed: true,
  };
}

function mergeTranscriptBlockIntoText(baseText, chunkText) {
  let merged = String(baseText || "");
  const chunkLines = splitTranscriptCommittedLines(chunkText);
  let changed = false;

  for (let i = 0; i < chunkLines.length; i += 1) {
    const lineMerge = mergeTranscriptChunkIntoText(merged, chunkLines[i]);
    if (lineMerge.changed) {
      merged = lineMerge.text;
      changed = true;
    }
  }

  return { text: merged, changed };
}

function countWords(text) {
  const t = String(text || "").trim();
  if (!t) {
    return 0;
  }
  const tokens = t.match(/[a-záéíóúñü]+/gi) || [];
  return tokens.length;
}

let transcriptHistoryText = "";
let recognitionSessionFinalText = "";

function promoteTranscriptChunkToHistory(chunkText) {
  const normalizedChunk = String(chunkText || "").trim();
  if (!normalizedChunk) {
    return false;
  }

  const merged = mergeTranscriptBlockIntoText(transcriptHistoryText, normalizedChunk);
  if (!merged.changed) {
    return false;
  }

  transcriptHistoryText = merged.text;
  return true;
}

function promoteRecognitionFinalTextToHistory() {
  const changed = promoteTranscriptChunkToHistory(recognitionSessionFinalText);
  recognitionSessionFinalText = "";
  return changed;
}

function shouldPreserveDroppedRecognitionInterim(previousInterim, nextFinalText, nextInterimText) {
  const previous = normalizeQuestionPunctuation(String(previousInterim || "").trim(), sourceSelect.value);
  if (!previous) {
    return false;
  }

  if (!/[a-z0-9áéíóúñü]/i.test(previous)) {
    return false;
  }

  if (countWords(previous) < 3 && previous.length < 16) {
    return false;
  }

  const nextCombined = joinTranscriptBlocks([nextFinalText, nextInterimText])
    .replace(/\s+/g, " ")
    .trim();

  if (!nextCombined) {
    return true;
  }

  if (
    speechTokensMatch(previous, nextCombined)
    || isSpeechTokenPrefix(previous, nextCombined)
    || isSpeechTokenSuffix(previous, nextCombined)
    || isSpeechTokenPrefix(nextCombined, previous)
    || isSpeechTokenSuffix(nextCombined, previous)
  ) {
    return false;
  }

  const overlapWordCount = findSpeechOverlapWordCount(previous, nextCombined);
  if (isReliableSpeechOverlap(previous, nextCombined, overlapWordCount)) {
    return false;
  }

  const reverseOverlapWordCount = findSpeechOverlapWordCount(nextCombined, previous);
  if (isReliableSpeechOverlap(nextCombined, previous, reverseOverlapWordCount)) {
    return false;
  }

  return true;
}

function preserveDroppedRecognitionInterim(previousInterim, nextFinalText, nextInterimText) {
  if (!shouldPreserveDroppedRecognitionInterim(previousInterim, nextFinalText, nextInterimText)) {
    return false;
  }

  return promoteTranscriptChunkToHistory(previousInterim);
}

let failed = false;

recognitionSessionFinalText = "hi are you traveling\nyes I am";
promoteRecognitionFinalTextToHistory();
if (transcriptHistoryText !== "hi are you traveling\nyes I am" || recognitionSessionFinalText !== "") {
  failed = true;
  console.error("[FAIL] promotes current final text into history", {
    transcriptHistoryText,
    recognitionSessionFinalText,
  });
}

recognitionSessionFinalText = "need to do before boarding they will check your bags";
promoteRecognitionFinalTextToHistory();
if (transcriptHistoryText !== "hi are you traveling\nyes I am\nneed to do before boarding they will check your bags") {
  failed = true;
  console.error("[FAIL] appends promoted final without losing previous history", transcriptHistoryText);
}

transcriptHistoryText = "need to do before boarding";
if (!promoteTranscriptChunkToHistory("need to do before boarding they will check your bags")) {
  failed = true;
  console.error("[FAIL] grouped final should update tail");
}
if (transcriptHistoryText !== "need to do before boarding they will check your bags") {
  failed = true;
  console.error("[FAIL] grouped final should replace history tail", transcriptHistoryText);
}

if (!preserveDroppedRecognitionInterim("we need to bring the printed documents", "", "and arrive early")) {
  failed = true;
  console.error("[FAIL] dropped interim should be preserved when next text diverges");
}

if (transcriptHistoryText !== "need to do before boarding they will check your bags\nwe need to bring the printed documents") {
  failed = true;
  console.error("[FAIL] preserved interim should be merged into history", transcriptHistoryText);
}

if (shouldPreserveDroppedRecognitionInterim(
  "we need to bring the printed documents",
  "we need to bring the printed documents and passports",
  ""
)) {
  failed = true;
  console.error("[FAIL] interim covered by next final should not be preserved separately");
}

if (shouldPreserveDroppedRecognitionInterim("okay", "", "")) {
  failed = true;
  console.error("[FAIL] short low-signal interim should not be preserved");
}

if (failed) {
  process.exit(1);
}

console.log("[OK] recognition live commit cases");
