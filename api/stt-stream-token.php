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

// Reutiliza http_get_remote() (con sus fallbacks a curl.exe/PowerShell) en vez
// de duplicar la lógica de cURL/file_get_contents: en instalaciones EasyPHP/
// Windows donde la extensión cURL de PHP no valida bien el certificado SSL,
// esos fallbacks son los que permiten alcanzar a AssemblyAI igualmente.
$httpCode = 0;
$networkError = '';
$responseBody = http_get_remote($url, $httpCode, $networkError, [
    'Authorization: ' . ASSEMBLYAI_API_KEY,
]);

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
