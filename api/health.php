<?php
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/http.php';

send_json([
    'status' => 'ok',
    'app' => APP_NAME,
    'version' => APP_VERSION,
    'mode' => APP_MODE,
    'transcription' => [
        'backend' => 'browser_speech_recognition',
        'on_device_policy' => 'enabled',
        'external_streaming_fallback' => [
            'provider' => 'assemblyai',
            'configured' => trim((string)ASSEMBLYAI_API_KEY) !== '',
            'token_endpoint' => '/api/stt-stream-token.php',
        ],
    ],
    'translation' => [
        'backend' => 'google_public_endpoint_with_fallback',
    ],
], 200);
