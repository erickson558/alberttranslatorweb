<?php

define('APP_NAME', 'AlbertTranslator PHP');
define('APP_VERSION', 'V1.6.0');
define('APP_MODE', 'php');
define('TRANSLATION_TIMEOUT_SEC', 15);
define('MAX_TRANSCRIPT_LENGTH', 6000);
define('ASSEMBLYAI_API_KEY', getenv('ASSEMBLYAI_API_KEY') ?: '');
define('ASSEMBLYAI_TOKEN_TTL_SEC', 300);
