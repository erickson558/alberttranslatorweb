/*
  Prueba de regresion para la fusion de bloques interim/final de Web Speech.
  Verifica que los resultados ampliados o repetidos no dupliquen frases ya comprometidas.
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
        changed: true,
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

const cases = [
  ["", "need to do before boarding", "need to do before boarding"],
  ["need to do before boarding", "need to do before boarding they will check your bags and scan your belongings", "need to do before boarding they will check your bags and scan your belongings"],
  ["need to do before boarding they will check your bags and scan your belongings", "need to do before boarding they will check your bags and scan your belongings fast", "need to do before boarding they will check your bags and scan your belongings fast"],
  ["hi are you traveling\nyes I am", "hi are you traveling yes I am", "hi are you traveling\nyes I am"],
  ["hi are you traveling\nyes I am", "hi are you traveling yes I am I am going on vacation", "hi are you traveling yes I am I am going on vacation"],
  ["hi are you traveling\nyes I am\nI am going on vacation", "hi are you traveling yes I am I am going on vacation", "hi are you traveling\nyes I am\nI am going on vacation"],
  ["are you traveling yes I am", "yes I am", "are you traveling yes I am"],
];

let failed = false;
for (let i = 0; i < cases.length; i += 1) {
  const current = cases[i];
  const got = mergeTranscriptChunkIntoText(current[0], current[1]).text;
  if (got !== current[2]) {
    failed = true;
    console.error("[FAIL]", { base: current[0], incoming: current[1], expected: current[2], got });
  }
}

if (failed) {
  process.exit(1);
}

console.log("[OK] transcript merge regression cases");
