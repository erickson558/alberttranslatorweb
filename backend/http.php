<?php

function send_json($payload, $statusCode)
{
    if (!headers_sent()) {
        http_response_code((int)$statusCode);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body()
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return null;
    }

    return $decoded;
}

function http_get_remote($url, &$httpCode, &$networkError)
{
    $httpCode = 0;
    $networkError = '';

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => TRANSLATION_TIMEOUT_SEC,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'User-Agent: AlbertTranslator-PHP/1.2.0',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false || $curlError) {
            $networkError = 'Error de red al traducir: ' . $curlError;
            return false;
        }

        return $response;
    }

    $curlCliResponse = http_get_remote_via_curl_cli($url, $httpCode, $networkError);
    if ($curlCliResponse !== false) {
        return $curlCliResponse;
    }

    $psResponse = http_get_remote_via_powershell($url, $httpCode, $networkError);
    if ($psResponse !== false) {
        return $psResponse;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => TRANSLATION_TIMEOUT_SEC,
            'header' => "Accept: application/json\r\nUser-Agent: AlbertTranslator-PHP/1.2.0\r\n",
        ],
    ]);

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        $networkError = 'No se pudo conectar al servicio de traduccion (sin curl).';
        // Ya se intento via PowerShell antes de llegar aqui.
    }

    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $headerLine) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $headerLine, $m)) {
                $httpCode = (int)$m[1];
                break;
            }
        }
    }

    return $response;
}

function http_get_remote_via_curl_cli($url, &$httpCode, &$networkError)
{
    $httpCode = 0;
    if (stripos(PHP_OS, 'WIN') !== 0) {
        return false;
    }

    $tmpOut = tempnam(sys_get_temp_dir(), 'atr_http_');
    if (!$tmpOut) {
        return false;
    }

    $cmd = 'curl.exe -s -L -o ' . escapeshellarg($tmpOut)
        . ' -w "%{http_code}" '
        . escapeshellarg($url);

    $output = [];
    $exitCode = 1;
    @exec($cmd, $output, $exitCode);
    $statusStr = trim(implode("\n", $output));
    $status = (int)$statusStr;

    $content = @file_get_contents($tmpOut);
    @unlink($tmpOut);

    if ($exitCode !== 0 || $status < 200 || $status >= 300 || $content === false || trim($content) === '') {
        $networkError = 'curl.exe no pudo recuperar contenido de traduccion.';
        return false;
    }

    $httpCode = $status;
    return $content;
}

function http_get_remote_via_powershell($url, &$httpCode, &$networkError)
{
    $httpCode = 0;
    if (stripos(PHP_OS, 'WIN') !== 0) {
        return false;
    }

    $timeout = (int)TRANSLATION_TIMEOUT_SEC;
    $psScript = "try { "
        . "$r = Invoke-WebRequest -UseBasicParsing -Uri " . escapeshellarg($url)
        . " -TimeoutSec " . $timeout . "; "
        . "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; "
        . "Write-Output $r.Content; exit 0 "
        . "} catch { exit 1 }";

    $cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -Command ' . escapeshellarg($psScript);
    $out = [];
    $code = 1;
    @exec($cmd, $out, $code);

    if ($code !== 0) {
        $networkError = 'Fallo tambien el fallback de PowerShell al traducir.';
        return false;
    }

    $content = trim(implode("\n", $out));
    if ($content === '') {
        $networkError = 'PowerShell no devolvio contenido de traduccion.';
        return false;
    }

    $httpCode = 200;
    return $content;
}
