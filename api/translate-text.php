<?php
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/http.php';
require_once __DIR__ . '/../backend/translator_service.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Metodo no permitido.'], 405);
}

$payload = read_json_body();
if (!is_array($payload)) {
    send_json(['error' => 'JSON invalido.'], 400);
}

$transcript = isset($payload['transcript']) ? trim((string)$payload['transcript']) : '';
$source = isset($payload['source_language'])
    ? strtolower(trim((string)$payload['source_language']))
    : 'en';
$target = isset($payload['target_language'])
    ? strtolower(trim((string)$payload['target_language']))
    : 'es';
$provider = isset($payload['translation_provider'])
    ? strtolower(trim((string)$payload['translation_provider']))
    : 'auto';

if ($transcript === '') {
    send_json([
        'transcript' => '',
        'translation' => '',
        'detected_language' => $source === 'auto' ? 'auto' : $source,
    ], 200);
}

if (strlen($transcript) > MAX_TRANSCRIPT_LENGTH) {
    send_json(['error' => 'Texto demasiado largo para traducir.'], 413);
}

if (!is_valid_lang($target) || $target === 'auto') {
    send_json(['error' => 'Codigo de idioma destino invalido.'], 400);
}

if ($source !== 'auto' && !is_valid_lang($source)) {
    send_json(['error' => 'Codigo de idioma origen invalido.'], 400);
}

$allowedProviders = ['auto', 'google-free', 'mymemory-free'];
if (!in_array($provider, $allowedProviders, true)) {
    send_json(['error' => 'Proveedor de traduccion invalido.'], 400);
}

$detectedLanguage = $source === 'auto' ? 'auto' : $source;
$translated = translate_transcript($transcript, $source, $target, $detectedLanguage, $provider);

send_json([
    'transcript' => $transcript,
    'translation' => trim($translated),
    'detected_language' => $detectedLanguage,
], 200);
