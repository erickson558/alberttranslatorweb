# AlbertTranslator PHP

Version `V1.5.18` para EasyPHP, sin dependencias de Python y con arquitectura separada frontend/backend.

## Que hace

- Modo oscuro futurista por defecto.
- Captura voz con Web Speech API en el navegador.
- Traduccion fluida y seguimiento automatico al final del texto.
- Lectura por voz (bocina) para transcripcion y traduccion.
- Traduccion manual de texto sin microfono.
- Iconos de speaker estilo traductor moderno.
- Transcripcion intermedia en vivo con mayor sensibilidad y reconexion automatica de escucha.
- Corte inmediato de lectura por voz al refrescar/cerrar pagina.
- Correccion de traduccion para evitar devolver texto original cuando el destino es distinto.
- Fallback local EN<->ES para mantener traduccion util cuando servicios externos no responden.
- Traduccion en vivo mas rapida durante la transcripcion (preview + menor latencia de despacho).
- Mejoras por frases en fallback EN->ES para evitar mezclas ingles/espanol en expresiones comunes.
- Selector de proveedor free en la nube: `Auto`, `Google Free`, `MyMemory Free`.
- `Google Free` configurado por defecto.
- Traduccion en vivo alineada con el contenido actual visible del cuadro de transcripcion.
- Preview local solo cuando la calidad minima es segura; la traduccion en vivo prioriza exactitud sobre pseudo-traducciones.
- Compatibilidad reforzada en Windows cuando PHP no tiene extension `curl`.
- Fusion inteligente de bloques `interim/final` para reducir repeticion de palabras y frases en la transcripcion.
- Deduplicacion de cola reciente de transcripcion para bloques finales que reagrupan varias frases ya confirmadas.
- Watchdog de voz con reintento y recuperacion para evitar perdida de dialogo cuando Web Speech se queda sin eventos.
- Menor perdida de palabras y frases cortas durante streaming al confirmar intermedios por silencio y al priorizar la mejor alternativa de reconocimiento.
- Traduccion manual en tiempo real basada en escritura del textfield de origen.
- Exportacion separada de transcripcion y traduccion en TXT.
- Traduccion server-side por fragmentos para evitar error por texto largo.
- Efecto typewriter restaurado para la salida de traduccion.

## Arquitectura

- `index.php`: entrypoint web y wiring de assets.
- `frontend/css/style.css`: UI/UX y tema oscuro.
- `frontend/js/app.js`: captura voz, UX fluida, lectura por voz.
- `api/health.php`: estado de la API.
- `api/translate-text.php`: endpoint de traduccion.
- `backend/config.php`: constantes globales y version.
- `backend/http.php`: helpers HTTP/JSON.
- `backend/translator_service.php`: logica de traduccion.
- `tests/translation_smoke.php`: prueba de humo de traduccion.
- `tests/transcript_merge_cases.js`: regresion de fusion/deduplicacion de transcripcion.

## Requisitos

- EasyPHP / Apache con PHP 5.4+.
- Navegador Chromium/Chrome/Edge para reconocimiento y lectura de voz.
- Opcional: extension `curl` en PHP para mayor compatibilidad de traduccion.

## Uso

1. Abre `http://localhost:888/monitoreos/AlbertTranslator/`.
2. Permite acceso al microfono.
3. Por defecto: origen `en` (Ingles), destino `es` (Espanol).
4. Pulsa `Iniciar escucha` para transcribir y traducir.

## API

- `GET /monitoreos/AlbertTranslator/api/health.php`
- `POST /monitoreos/AlbertTranslator/api/translate-text.php`

Ejemplo JSON para traduccion:

```json
{
  "transcript": "hello world",
  "source_language": "en",
  "target_language": "es"
}
```

## Validacion basica

- Ejecuta `C:\Program Files (x86)\EasyPHP-Webserver-14.1b2\binaries\php\php.exe tests\translation_smoke.php` para una prueba rapida de traduccion.
- Ejecuta `node tests\transcript_merge_cases.js` para validar deduplicacion de bloques de transcripcion.

## Buenas practicas aplicadas

- Separacion de responsabilidades (frontend, api, backend).
- Validacion de entrada en API y traduccion por fragmentos para textos largos.
- Endpoints con respuestas JSON consistentes.
- Fallback de traduccion sin romper flujo de usuario.
- Versionado centralizado en backend (`APP_VERSION`) y archivo `VERSION`.

## Licencia

Apache License 2.0. Ver `LICENSE`.
