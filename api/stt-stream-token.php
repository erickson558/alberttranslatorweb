<?php
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/http.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['error' => 'Metodo no permitido.'], 405);
}

if (trim((string)ASSEMBLYAI_API_KEY) === '') {
    send_json([
        'available' => false,
        'provider' => 'assemblyai',
        'error' => 'ASSEMBLYAI_API_KEY no esta configurada.',
    ], 503);
}

$url = 'https://streaming.assemblyai.com/v3/token?expires_in_seconds=' . (int)ASSEMBLYAI_TOKEN_TTL_SEC;
$headers = [
    'Accept: application/json',
    'Authorization: ' . ASSEMBLYAI_API_KEY,
    'User-Agent: AlbertTranslator-PHP/' . APP_VERSION,
];

$responseBody = false;
$networkError = '';
$httpCode = 0;

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => TRANSLATION_TIMEOUT_SEC,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_HTTPHEADER => $headers,
    ]);

    $responseBody = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($responseBody === false || $curlError) {
        $networkError = 'No se pudo solicitar token temporal a AssemblyAI: ' . $curlError;
    }
}

if ($responseBody === false) {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => TRANSLATION_TIMEOUT_SEC,
            'header' => implode("\r\n", $headers) . "\r\n",
        ],
    ]);

    $responseBody = @file_get_contents($url, false, $context);
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $headerLine) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $headerLine, $m)) {
                $httpCode = (int)$m[1];
                break;
            }
        }
    }
    if ($responseBody === false && $networkError === '') {
        $networkError = 'No se pudo solicitar token temporal a AssemblyAI.';
    }
}

if ($responseBody === false) {
    send_json([
        'available' => false,
        'provider' => 'assemblyai',
        'error' => $networkError ?: 'No se pudo obtener token temporal.',
    ], 502);
}

$payload = json_decode($responseBody, true);
if (!is_array($payload) || empty($payload['token'])) {
    send_json([
        'available' => false,
        'provider' => 'assemblyai',
        'error' => 'Respuesta invalida al solicitar token temporal.',
        'http_code' => $httpCode,
    ], 502);
}

send_json([
    'available' => true,
    'provider' => 'assemblyai',
    'token' => (string)$payload['token'],
    'expires_in_seconds' => (int)ASSEMBLYAI_TOKEN_TTL_SEC,
], 200);
