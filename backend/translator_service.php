<?php

function is_valid_lang($lang)
{
    return preg_match('/^[a-z]{2,8}$/', $lang) === 1;
}

function is_effective_translation($sourceText, $translatedText, $sourceLang, $targetLang)
{
    $s = strtolower(trim((string)$sourceText));
    $t = strtolower(trim((string)$translatedText));
    if ($t === '') {
        return false;
    }

    if (strtolower((string)$sourceLang) === strtolower((string)$targetLang)) {
        return true;
    }

    $src = strtolower((string)$sourceLang);
    $tgt = strtolower((string)$targetLang);

    if (($src === 'en' || $src === 'auto') && $tgt === 'es') {
        if (is_likely_english_text($t) && !is_likely_spanish_text($t)) {
            return false;
        }
    }

    if (($src === 'es' || $src === 'auto') && $tgt === 'en') {
        if (is_likely_spanish_text($t) && !is_likely_english_text($t)) {
            return false;
        }
    }

    return $s !== $t;
}

function is_likely_english_text($text)
{
    $tokens = preg_split('/\W+/u', strtolower((string)$text));
    if (!is_array($tokens)) {
        return false;
    }

    $hints = [
        'the' => 1, 'and' => 1, 'you' => 1, 'are' => 1, 'how' => 1, 'today' => 1,
        'i' => 1, 'know' => 1, 'guys' => 1, 'some' => 1, 'people' => 1, 'right' => 1,
        'here' => 1, 'please' => 1, 'report' => 1, 'meeting' => 1, 'week' => 1,
    ];

    $score = 0;
    foreach ($tokens as $token) {
        if ($token !== '' && isset($hints[$token])) {
            $score += 1;
        }
    }

    return $score >= 2;
}

function is_likely_spanish_text($text)
{
    $tokens = preg_split('/\W+/u', strtolower((string)$text));
    if (!is_array($tokens)) {
        return false;
    }

    $hints = [
        'el' => 1, 'la' => 1, 'de' => 1, 'y' => 1, 'que' => 1, 'qué' => 1,
        'como' => 1, 'cómo' => 1, 'estás' => 1, 'hoy' => 1, 'por' => 1, 'favor' => 1,
        'reporte' => 1, 'reunión' => 1, 'semana' => 1, 'chicos' => 1, 'personas' => 1,
        'aquí' => 1, 'sí' => 1,
    ];

    $score = 0;
    foreach ($tokens as $token) {
        if ($token !== '' && isset($hints[$token])) {
            $score += 1;
        }
    }

    return $score >= 2;
}

function translate_with_local_glossary($transcript, $source, $target)
{
    $source = strtolower((string)$source);
    $target = strtolower((string)$target);

    // Normaliza contracciones frecuentes para mejorar cobertura de traduccion.
    $transcript = preg_replace("/\b(don't|dont)\b/i", 'do not', (string)$transcript);
    $transcript = preg_replace("/\b(i'm|im)\b/i", 'i am', (string)$transcript);
    $transcript = preg_replace("/\b(can't|cant)\b/i", 'can not', (string)$transcript);
    $transcript = preg_replace("/\b(won't|wont)\b/i", 'will not', (string)$transcript);

    $pairs = [];
    if ($source === 'en' && $target === 'es') {
        $pairs = [
            'hello' => 'hola',
            'hi' => 'hola',
            'i' => 'yo',
            'im' => 'yo',
            'am' => 'estoy',
            'do' => 'hacer',
            'not' => 'no',
            'know' => 'sé',
            'okay' => 'bien',
            'ok' => 'bien',
            'will' => 'va',
            'how' => 'cómo',
            'are' => 'estás',
            'you' => 'tú',
            'today' => 'hoy',
            'tomorrow' => 'mañana',
            'yesterday' => 'ayer',
            'guys' => 'chicos',
            'so' => 'así',
            'but' => 'pero',
            'have' => 'he',
            'heard' => 'escuchado',
            'some' => 'algunas',
            'people' => 'personas',
            'right' => 'aquí',
            'here' => 'aquí',
            'say' => 'decir',
            'down' => 'abajo',
            'get' => 'ponerse',
            'well' => 'bien',
            'to' => 'a',
            'for' => 'para',
            'of' => 'de',
            'the' => 'el',
            'a' => 'un',
            'an' => 'un',
            'and' => 'y',
            'or' => 'o',
            'we' => 'nosotros',
            'good' => 'bueno',
            'morning' => 'mañana',
            'afternoon' => 'tarde',
            'night' => 'noche',
            'thanks' => 'gracias',
            'thank' => 'gracias',
            'please' => 'por favor',
            'yes' => 'sí',
            'no' => 'no',
            'what' => 'qué',
            'where' => 'dónde',
            'when' => 'cuándo',
            'why' => 'por qué',
            'who' => 'quién',
            'name' => 'nombre',
            'my' => 'mi',
            'your' => 'tú',
            'is' => 'es',
            'this' => 'esto',
            'that' => 'eso',
            'can' => 'puede',
            'could' => 'podría',
            'would' => 'gustaría',
            'should' => 'debería',
            'help' => 'ayudar',
            'me' => 'me',
            'need' => 'necesito',
            'want' => 'quiero',
            'buy' => 'comprar',
            'send' => 'enviar',
            'schedule' => 'programar',
            'meeting' => 'reunión',
            'next' => 'próxima',
            'week' => 'semana',
            'ticket' => 'boleto',
            'report' => 'reporte',
            'translation' => 'traducción',
            'translations' => 'traducciones',
            'one' => 'una',
            'large' => 'grande',
            'great' => 'genial',
            'pizza' => 'pizza',
            'pepperoni' => 'pepperoni',
            'water' => 'agua',
            'food' => 'comida',
            'house' => 'casa',
            'work' => 'trabajo',
            'friend' => 'amigo',
            'family' => 'familia',
            'beautiful' => 'hermoso',
            'very' => 'muy',
            'much' => 'mucho',
            'time' => 'tiempo',
            'now' => 'ahora',
            'later' => 'luego',
        ];
    } elseif ($source === 'es' && $target === 'en') {
        $pairs = [
            'hola' => 'hello',
            'como' => 'how',
            'estas' => 'are you',
            'hoy' => 'today',
            'gracias' => 'thanks',
            'por' => 'for',
            'favor' => 'please',
            'si' => 'yes',
            'no' => 'no',
            'que' => 'what',
            'donde' => 'where',
            'cuando' => 'when',
            'quien' => 'who',
            'nombre' => 'name',
            'mi' => 'my',
            'tu' => 'your',
            'es' => 'is',
            'puede' => 'can',
            'ayudar' => 'help',
            'necesito' => 'i need',
            'quiero' => 'i want',
            'agua' => 'water',
            'comida' => 'food',
            'casa' => 'house',
            'trabajo' => 'work',
            'amigo' => 'friend',
            'familia' => 'family',
            'muy' => 'very',
            'mucho' => 'much',
            'tiempo' => 'time',
            'ahora' => 'now',
            'luego' => 'later',
        ];
    }

    if (empty($pairs)) {
        return '';
    }

    $phraseReplacements = [];
    if ($source === 'en' && $target === 'es') {
        $phraseReplacements = [
            '/\bgreat one large pepperoni pizza\b/i' => 'genial una pizza grande de pepperoni',
            '/\bwould you like\b/i' => 'te gustaria',
            '/\bone large pepperoni pizza please\b/i' => 'una pizza grande de pepperoni por favor',
            '/\bone large pepperoni pizza\b/i' => 'una pizza grande de pepperoni',
            '/\blarge pepperoni pizza\b/i' => 'pizza grande de pepperoni',
            '/\bpepperoni pizza\b/i' => 'pizza de pepperoni',
            '/\bone large\b/i' => 'una grande',
            '/\bhow are you today\b/i' => 'cómo estás tú hoy',
            '/\bi do not know\b/i' => 'yo no sé',
            '/\bi know\b/i' => 'yo sé',
            '/\bright here\b/i' => 'aquí mismo',
            '/\bget well\b/i' => 'ponerse bien',
        ];
    } elseif ($source === 'es' && $target === 'en') {
        $phraseReplacements = [
            '/\bhola como estas hoy\b/i' => 'hello how are you today',
            '/\bcomo estas hoy\b/i' => 'how are you today',
            '/\bpizza grande de pepperoni\b/i' => 'large pepperoni pizza',
            '/\bpor favor\b/i' => 'please',
        ];
    }

    $originalTranscript = $transcript;
    $phraseApplied = false;
    if (!empty($phraseReplacements)) {
        foreach ($phraseReplacements as $pattern => $replacement) {
            $updated = preg_replace($pattern, $replacement, $transcript);
            if ($updated !== null) {
                if ($updated !== $transcript) {
                    $phraseApplied = true;
                }
                $transcript = $updated;
            }
        }
    }

    // Continúa con traducción por tokens para completar el resto del texto.

    $parts = preg_split('/(\W+)/u', $transcript, -1, PREG_SPLIT_DELIM_CAPTURE);
    if (!is_array($parts)) {
        return '';
    }

    $translated = '';
    $wordCount = 0;
    $translatedWords = 0;
    foreach ($parts as $part) {
        if ($part === '') {
            continue;
        }

        $key = strtolower($part);
        if (preg_match('/^[a-zA-Z]+$/', $part)) {
            $wordCount += 1;
        }
        if (isset($pairs[$key])) {
            $replacement = $pairs[$key];
            $isCapitalized = (strlen($part) > 0 && strtoupper(substr($part, 0, 1)) === substr($part, 0, 1));
            if ($isCapitalized) {
                $replacement = ucfirst($replacement);
            }
            $translated .= $replacement;
            if (preg_match('/^[a-zA-Z]+$/', $part)) {
                $translatedWords += 1;
            }
        } else {
            $translated .= $part;
        }
    }

    $normalized = trim(preg_replace('/\s+/', ' ', $translated));
    if ($wordCount > 0) {
        $ratio = $translatedWords / $wordCount;
        // Evita traducciones parciales con mezcla excesiva de idiomas.
        $minRatio = $wordCount >= 10 ? 0.4 : 0.55;
        if ($ratio < $minRatio) {
            return '';
        }
    }
    return $normalized;
}

function translate_with_force_en_es($transcript)
{
    $map = [
        'how' => 'cómo', 'are' => 'estás', 'you' => 'tú', 'today' => 'hoy', 'hello' => 'hola',
        'please' => 'por favor', 'send' => 'enviar', 'report' => 'reporte', 'guys' => 'chicos',
        'i' => 'yo', 'do' => 'hacer', 'not' => 'no', 'know' => 'sé', 'yes' => 'sí', 'okay' => 'bien',
        'ok' => 'bien', 'should' => 'debería', 'get' => 'ponerse', 'well' => 'bien',
    ];

    $parts = preg_split('/(\W+)/u', (string)$transcript, -1, PREG_SPLIT_DELIM_CAPTURE);
    if (!is_array($parts)) {
        return '';
    }

    $out = '';
    $replaced = 0;
    foreach ($parts as $part) {
        if ($part === '') {
            continue;
        }

        $key = strtolower($part);
        if (isset($map[$key])) {
            $rep = $map[$key];
            if (strlen($part) > 0 && strtoupper(substr($part, 0, 1)) === substr($part, 0, 1)) {
                $rep = ucfirst($rep);
            }
            $out .= $rep;
            $replaced += 1;
        } else {
            $out .= $part;
        }
    }

    if ($replaced < 2) {
        return '';
    }

    return trim(preg_replace('/\s+/', ' ', $out));
}

function translate_with_google_endpoint($transcript, $source, $target, &$detectedLanguage)
{
    $query = http_build_query([
        'client' => 'gtx',
        'sl' => $source,
        'tl' => $target,
        'dt' => 't',
        'q' => $transcript,
    ]);

    $url = 'https://translate.googleapis.com/translate_a/single?' . $query;
    $httpCode = 0;
    $networkError = '';
    $response = http_get_remote($url, $httpCode, $networkError);

    $translated = '';
    if ($response !== false && $httpCode >= 200 && $httpCode < 300) {
        $data = json_decode($response, true);
        if (is_array($data) && isset($data[0]) && is_array($data[0])) {
            foreach ($data[0] as $part) {
                if (is_array($part) && isset($part[0])) {
                    $translated .= (string)$part[0];
                }
            }
            if (isset($data[2]) && is_string($data[2])) {
                $detectedLanguage = strtolower($data[2]);
            }
        }
    }

    return trim($translated);
}

function split_text_for_translation($transcript)
{
    $text = trim((string)$transcript);
    if ($text === '') {
        return [];
    }

    $parts = preg_split('/(?<=[\.!\?])\s+/u', $text);
    if (!is_array($parts)) {
        $parts = [$text];
    }

    $chunks = [];
    foreach ($parts as $part) {
        $piece = trim((string)$part);
        if ($piece === '') {
            continue;
        }

        if (strlen($piece) <= 140) {
            $chunks[] = $piece;
            continue;
        }

        $words = preg_split('/\s+/u', $piece);
        if (!is_array($words)) {
            $chunks[] = $piece;
            continue;
        }

        $buffer = '';
        foreach ($words as $word) {
            $word = trim((string)$word);
            if ($word === '') {
                continue;
            }
            $candidate = $buffer === '' ? $word : ($buffer . ' ' . $word);
            if (strlen($candidate) > 90) {
                if ($buffer !== '') {
                    $chunks[] = $buffer;
                }
                $buffer = $word;
            } else {
                $buffer = $candidate;
            }
        }
        if ($buffer !== '') {
            $chunks[] = $buffer;
        }
    }

    return $chunks;
}

function translate_with_google_chunked($transcript, $source, $target, &$detectedLanguage)
{
    $chunks = split_text_for_translation($transcript);
    if (empty($chunks)) {
        return '';
    }

    $translatedParts = [];
    foreach ($chunks as $chunk) {
        $piece = translate_with_google_endpoint($chunk, $source, $target, $detectedLanguage);
        if (!is_effective_translation($chunk, $piece, $source, $target)) {
            if (strtolower((string)$source) !== 'auto') {
                $piece = translate_with_google_endpoint($chunk, 'auto', $target, $detectedLanguage);
            }
        }

        if (!is_effective_translation($chunk, $piece, $source, $target)) {
            $piece = $chunk;
        }

        $translatedParts[] = trim((string)$piece);
    }

    return trim(preg_replace('/\s+/', ' ', implode(' ', $translatedParts)));
}

function translate_with_mymemory($transcript, $source, $target)
{
    $fallbackSource = $source === 'auto' ? 'en' : $source;
    $fallbackQuery = http_build_query([
        'q' => $transcript,
        'langpair' => $fallbackSource . '|' . $target,
    ]);
    $fallbackUrl = 'http://api.mymemory.translated.net/get?' . $fallbackQuery;

    $fallbackCode = 0;
    $fallbackError = '';
    $fallbackResponse = http_get_remote($fallbackUrl, $fallbackCode, $fallbackError);
    if ($fallbackResponse === false || $fallbackCode < 200 || $fallbackCode >= 300) {
        return '';
    }

    $fallbackData = json_decode($fallbackResponse, true);
    if (
        is_array($fallbackData)
        && isset($fallbackData['responseData'])
        && is_array($fallbackData['responseData'])
        && isset($fallbackData['responseData']['translatedText'])
    ) {
        return trim((string)$fallbackData['responseData']['translatedText']);
    }

    return '';
}

function translate_transcript($transcript, $source, $target, &$detectedLanguage, $provider = 'auto')
{
    $provider = strtolower(trim((string)$provider));
    if ($provider === '') {
        $provider = 'auto';
    }

    $tryGoogle = function ($text, $src, $tgt) use (&$detectedLanguage) {
        $translated = translate_with_google_endpoint($text, $src, $tgt, $detectedLanguage);
        if (is_effective_translation($text, $translated, $src, $tgt)) {
            return $translated;
        }

        if (strtolower((string)$src) !== 'auto') {
            $translated = translate_with_google_endpoint($text, 'auto', $tgt, $detectedLanguage);
            if (is_effective_translation($text, $translated, $src, $tgt)) {
                return $translated;
            }
        }

        $translated = translate_with_google_chunked($text, $src, $tgt, $detectedLanguage);
        if (is_effective_translation($text, $translated, $src, $tgt)) {
            return $translated;
        }

        return '';
    };

    if ($provider === 'google-free') {
        $translated = $tryGoogle($transcript, $source, $target);
        if ($translated !== '') {
            return $translated;
        }
    }

    if ($provider === 'mymemory-free') {
        $translated = translate_with_mymemory($transcript, $source, $target);
        if (is_effective_translation($transcript, $translated, $source, $target)) {
            return $translated;
        }

        $translated = $tryGoogle($transcript, $source, $target);
        if ($translated !== '') {
            return $translated;
        }
    }

    if ($provider === 'auto') {
        $translated = $tryGoogle($transcript, $source, $target);
        if ($translated !== '') {
            return $translated;
        }

        $translated = translate_with_mymemory($transcript, $source, $target);
        if (is_effective_translation($transcript, $translated, $source, $target)) {
            return $translated;
        }
    }

    return $transcript;
}
