<?php
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/http.php';
require_once __DIR__ . '/../backend/translator_service.php';

function fail_smoke($message)
{
    fwrite(STDERR, "[FAIL] " . $message . PHP_EOL);
    exit(1);
}

function pass_smoke($message)
{
    fwrite(STDOUT, "[OK] " . $message . PHP_EOL);
}

function assert_translation_looks_valid($text, $translated, $targetLanguage)
{
    $original = trim((string)$text);
    $candidate = trim((string)$translated);
    if ($candidate === '') {
        fail_smoke('La traduccion quedo vacia para: ' . $original);
    }

    if (strcasecmp($original, $candidate) === 0) {
        fail_smoke('La traduccion no cambio el texto original para: ' . $original);
    }

    if (strtolower((string)$targetLanguage) === 'es') {
        $looksSpanish = preg_match('/(¿|¡|[áéíóúñ]|\b(el|la|de|y|para|por|hoy|mañana|como|cómo|reporte|entiend)\b)/iu', $candidate) === 1;
        if (!$looksSpanish) {
            fail_smoke('La traduccion no parece espanola: ' . $candidate);
        }
    }
}

$cases = array(
    array(
        'text' => 'How are you today?',
        'source' => 'en',
        'target' => 'es',
        'provider' => 'google-free',
    ),
    array(
        'text' => 'Please send the report tomorrow.',
        'source' => 'en',
        'target' => 'es',
        'provider' => 'auto',
    ),
);

foreach ($cases as $case) {
    $detectedLanguage = $case['source'];
    $translated = translate_transcript(
        $case['text'],
        $case['source'],
        $case['target'],
        $detectedLanguage,
        $case['provider']
    );

    assert_translation_looks_valid($case['text'], $translated, $case['target']);
    pass_smoke($case['provider'] . ': ' . $case['text'] . ' => ' . $translated);
}

pass_smoke('Prueba de humo de traduccion completada.');
