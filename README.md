# AlbertTranslator PHP

Version `V1.5.23` para EasyPHP, sin dependencias de Python y con arquitectura separada frontend/backend.

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
- Typewriter restaurado en transcripcion sin usar el textarea animado como fuente de verdad para traduccion/copia/exportacion.
- Reconstruccion de la sesion de voz desde `SpeechRecognitionResultList` completa para reducir perdida de transcripcion en vivo.
- Ledger de resultados por indice para conservar bloques previos aunque Web Speech solo reescriba la cola cambiada.
- Watchdog de voz con reintento y recuperacion para evitar perdida de dialogo cuando Web Speech se queda sin eventos.
- Politica de watchdog ajustada para no reconectar por silencios normales y limpiar errores transitorios al recuperar escucha.
- La pausa breve ya no compromete ni parte la sesion de voz; solo fuerza refresco de traduccion y reserva el guardado para fallos reales, `stop` y `onend`.
- Menor perdida de palabras y frases cortas durante streaming al priorizar la mejor alternativa de reconocimiento y guardar el ultimo interim antes de una recuperacion real.
- Recuperacion dura mas temprana cuando el motor pasa demasiado tiempo sin emitir eventos, para reducir huecos largos de audio perdido.
- Wiring de handlers de `SpeechRecognition` restaurado para que las instancias recreadas por reconexion sigan capturando resultados y errores.
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
- `tests/recognition_watchdog_cases.js`: regresion de politica del watchdog de reconocimiento.
- `tests/recognition_recovery_commit_cases.js`: regresion de guardado del ultimo texto antes de reiniciar una sesion de voz rota.
- `tests/recognition_result_ledger_cases.js`: regresion del ledger por indice para no perder bloques previos entre eventos.
- `tests/recognition_handler_binding_cases.js`: regresion de wiring para reconexiones y recreacion de la instancia de voz.

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
- Ejecuta `node tests\recognition_watchdog_cases.js` para validar que el watchdog no reinicie ni comprometa la sesion por silencio normal.
- Ejecuta `node tests\recognition_recovery_commit_cases.js` para validar que una recuperacion real no pierda el ultimo texto capturado.
- Ejecuta `node tests\recognition_result_ledger_cases.js` para validar que los resultados previos de la sesion no desaparezcan cuando cambia solo la cola.
- Ejecuta `node tests\recognition_handler_binding_cases.js` para validar que una instancia recreada siga teniendo `onresult`, `onerror`, `onend` y `onstart`.

## Buenas practicas aplicadas

- Separacion de responsabilidades (frontend, api, backend).
- Validacion de entrada en API y traduccion por fragmentos para textos largos.
- Endpoints con respuestas JSON consistentes.
- Fallback de traduccion sin romper flujo de usuario.
- Versionado centralizado en backend (`APP_VERSION`) y archivo `VERSION`.

## Licencia

Apache License 2.0. Ver `LICENSE`.
