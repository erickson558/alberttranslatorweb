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

function http_get_remote($url, &$httpCode, &$networkError, $extraHeaders = [])
{
    $httpCode = 0;
    $networkError = '';
    $headers = array_merge([
        'Accept: application/json',
        'User-Agent: AlbertTranslator-PHP/1.2.0',
    ], $extraHeaders);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => TRANSLATION_TIMEOUT_SEC,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_HTTPHEADER => $headers,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response !== false && !$curlError) {
            return $response;
        }

        // BUG FIX: la extension curl de PHP puede fallar (p.ej. "SSL certificate
        // problem: unable to get local issuer certificate" cuando el cacert.pem del
        // php.ini esta desactualizado o ausente, comun en instalaciones EasyPHP/Windows)
        // aunque el sistema si tenga una cadena de confianza SSL valida. En ese caso no
        // se debe rendir de inmediato: se reintenta con curl.exe / PowerShell, que
        // resuelven la validacion de certificados de forma independiente al ini de PHP.
        // Nunca se desactiva la verificacion SSL: solo se cambia de cliente HTTP.
        $networkError = 'Error de red al traducir: ' . $curlError;
    }

    $curlCliResponse = http_get_remote_via_curl_cli($url, $httpCode, $networkError, $extraHeaders);
    if ($curlCliResponse !== false) {
        return $curlCliResponse;
    }

    $psResponse = http_get_remote_via_powershell($url, $httpCode, $networkError, $extraHeaders);
    if ($psResponse !== false) {
        return $psResponse;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => TRANSLATION_TIMEOUT_SEC,
            'header' => implode("\r\n", $headers) . "\r\n",
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

function http_get_remote_via_curl_cli($url, &$httpCode, &$networkError, $extraHeaders = [])
{
    $httpCode = 0;
    if (stripos(PHP_OS, 'WIN') !== 0) {
        return false;
    }

    $tmpOut = tempnam(sys_get_temp_dir(), 'atr_http_');
    if (!$tmpOut) {
        return false;
    }

    $headerArgs = '';
    foreach ($extraHeaders as $header) {
        $headerArgs .= ' -H ' . escapeshellarg($header);
    }

    $cmd = 'curl.exe -s -L' . $headerArgs . ' -o ' . escapeshellarg($tmpOut)
        . ' -w "%{http_code}" '
        . escapeshellarg($url);

    $output = [];
    $exitCode = 1;
    @exec($cmd, $output, $exitCode);
    $statusStr = trim(implode("\n", $output));
    $status = (int)$statusStr;

    $content = @file_get_contents($tmpOut);
    @unlink($tmpOut);

    if ($exitCode !== 0 || $content === false || trim($content) === '') {
        $networkError = 'curl.exe no pudo recuperar contenido de traduccion.';
        return false;
    }

    // BUG FIX: antes se descartaba cualquier respuesta con status fuera de
    // 2xx, perdiendo el cuerpo (p.ej. un JSON de error legible de la API).
    // Los llamadores (translator_service.php, stt-stream-token.php) ya
    // validan $httpCode por su cuenta antes de confiar en el contenido.
    $httpCode = $status;
    return $content;
}

function http_get_remote_via_powershell($url, &$httpCode, &$networkError, $extraHeaders = [])
{
    $httpCode = 0;
    if (stripos(PHP_OS, 'WIN') !== 0) {
        return false;
    }

    $timeout = (int)TRANSLATION_TIMEOUT_SEC;
    $headersPs = '';
    $pairs = [];
    foreach ($extraHeaders as $header) {
        if (strpos($header, ':') === false) {
            continue;
        }
        list($headerName, $headerValue) = explode(':', $header, 2);
        $headerName = str_replace("'", "''", trim($headerName));
        $headerValue = str_replace("'", "''", trim($headerValue));
        $pairs[] = "'" . $headerName . "'='" . $headerValue . "'";
    }
    if (!empty($pairs)) {
        $headersPs = '-Headers @{' . implode(';', $pairs) . '} ';
    }

    // BUG FIX: La cadena original usaba dobles comillas PHP, por lo que $r era
    // interpolada como variable PHP vacía y el script de PowerShell resultaba inválido
    // (" = Invoke-WebRequest..."). Ahora se usan comillas simples PHP para que $r
    // llegue literalmente al intérprete de PowerShell como la variable $r correcta.
    $psScript = 'try { '
        . '$r = Invoke-WebRequest -UseBasicParsing ' . $headersPs . '-Uri ' . escapeshellarg($url)
        . ' -TimeoutSec ' . $timeout . '; '
        . '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; '
        . 'Write-Output $r.Content; exit 0 '
        . '} catch { exit 1 }';

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
