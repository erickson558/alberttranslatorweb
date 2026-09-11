<?php

/**
 * Carga variables desde un archivo .env en la raíz del proyecto (si existe) al
 * entorno del proceso PHP, sin dependencias externas. En EasyPHP/Windows es
 * mucho más simple que configurar variables de entorno del sistema y reiniciar
 * Apache: basta con crear el archivo .env y recargar la página. No sobrescribe
 * variables ya definidas en el entorno real (ese tiene prioridad).
 */
function load_dotenv_if_present($path)
{
    if (!is_readable($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (strlen($value) >= 2 && (
            ($value[0] === '"' && substr($value, -1) === '"')
            || ($value[0] === "'" && substr($value, -1) === "'")
        )) {
            $value = substr($value, 1, -1);
        }
        if ($key !== '' && getenv($key) === false) {
            putenv($key . '=' . $value);
        }
    }
}
load_dotenv_if_present(__DIR__ . '/../.env');

define('APP_NAME', 'AlbertTranslator PHP');
define('APP_VERSION', 'V1.8.0');
define('APP_MODE', 'php');
define('TRANSLATION_TIMEOUT_SEC', 15);
define('MAX_TRANSCRIPT_LENGTH', 6000);
define('ASSEMBLYAI_API_KEY', getenv('ASSEMBLYAI_API_KEY') ?: '');
define('ASSEMBLYAI_TOKEN_TTL_SEC', 300);
