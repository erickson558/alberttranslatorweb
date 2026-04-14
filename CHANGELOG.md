# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog and the project uses Semantic Versioning with a V prefix: Vx.x.x.

## [V1.5.27] - 2026-04-14
### Fixed
- Corregido el fallback PowerShell en `backend/http.php`: `$r` era interpolada como variable PHP vacía en string de dobles comillas, generando un script PowerShell inválido que fallaba silenciosamente en cada intento. Cambiado a comillas simples PHP para que `$r` llegue literal al intérprete de PowerShell.
- Corregido el check de ratio en `translate_with_local_glossary()`: cuando se aplicaba una frase compuesta (phraseApplied=true), los tokens ya traducidos en el texto destino hacían que el ratio bajara artificialmente por debajo del umbral mínimo, descartando traducciones válidas como "one large pepperoni pizza please". El check de ratio ahora se omite cuando hubo al menos una sustitución de frase.
- Corregido el endpoint de MyMemory en `translate_with_mymemory()`: URL cambiada de `http://` a `https://` para cifrar las peticiones de traducción en tránsito.
- Corregida race condition en `clearOutputs()` (app.js): la función ahora aborta el AbortController de traducción activo y cancela `translateDebounceTimer` / `typedTranslateDebounceTimer` antes de limpiar los outputs, evitando que respuestas en vuelo sobreescriban el contenido ya borrado.
- Corregida ausencia de guarda null en `startListening()` (app.js): si `initializeRecognitionInstance()` fallaba internamente, la llamada a `recognition.start()` lanzaba un TypeError no capturado. Ahora se verifica la instancia antes de continuar y se muestra un error descriptivo.

### Changed
- Synchronized version to V1.5.27 across VERSION, APP_VERSION, README, and CHANGELOG.

## [V1.5.26] - 2026-04-01
### Fixed
- Evitado el estado colgado donde Chromium quedaba "activo pero mudo" cuando `stop()` no devolvia `onend`; ahora se escala a recuperacion profunda y se recrea la instancia.
- Corregida la duplicacion/borrado de frases cuando Chromium revisa una cola larga conservando gran parte del prefijo.
- Reducida la perdida de transcripcion al sacar la traduccion en vivo del camino critico de `onresult`.
- Corregido el caso donde `/api/translate-text.php` podia devolver traduccion vacia sin activar los fallbacks locales ya implementados.

### Added
- Politica de `on-device-speech-recognition` y deteccion/instalacion de reconocimiento local cuando el navegador lo soporta.
- Endpoint opcional `/api/stt-stream-token.php` para token temporal de fallback STT externo gratuito.
- Prueba basica `tests/transcription_engine_merge_cases.js` para regresiones de merge de transcripcion.

### Changed
- Synchronized version to V1.5.26 across VERSION, APP runtime config, and README.

## [V1.5.13] - 2026-03-12
### Added
- Control en la UI para ajustar la sensibilidad del watchdog de voz entre perfiles mas agresivos o mas tolerantes.
- Indicador runtime con el umbral activo del watchdog y su ciclo de pasada de 5 segundos.

### Changed
- El watchdog de reconocimiento ahora revisa el estado cada 5 segundos con umbrales configurables de silencio y estancamiento.
- Synchronized version to V1.5.13 across VERSION, APP runtime config, and README.

## [V1.5.12] - 2026-03-12
### Fixed
- Evitada la duplicacion de frases cuando un resultado interim ya confirmado vuelve a llegar como resultado final mas largo del reconocimiento de voz.
- Agregado merge por solapamiento con la ultima frase confirmada para conservar una sola linea estable en la transcripcion.

### Changed
- Synchronized version to V1.5.12 across VERSION, APP runtime config, and README.

## [V1.5.11] - 2026-03-12
### Added
- Release checklist versionada en `RELEASE_CHECKLIST.md` para estandarizar pre-publicacion en `main`.

### Changed
- README actualizado para enlazar la checklist de release en la seccion de publicaciones automaticas.
- Synchronized version to V1.5.11 across VERSION, APP runtime config, and README.

## [V1.5.10] - 2026-03-12
### Added
- Exportacion TXT configurable por alcance: ambos paneles, solo transcripcion o solo traduccion.
- Nombre de archivo de exportacion con prefijo por alcance y timestamp de inicio de conversacion.

### Changed
- Fortalecida la recuperacion anti-cuelgue del reconocimiento con deteccion de estancamiento por falta de eventos y recuperacion profunda.
- Synchronized version to V1.5.10 across VERSION, APP runtime config, and README.

## [V1.5.9] - 2026-03-12
### Added
- Runtime status strip with live visibility for microphone state, incremental mode, segments, and word counters.
- Keyboard shortcuts for faster operation: `Ctrl+Enter` (start/stop or manual translate) and `Ctrl+Backspace` (clear).

### Changed
- Improved live typewriter behavior with smoother target updates and reduced-motion compatibility.
- Added interim-by-silence auto-commit to reduce dropped phrases when speech results stay non-final.
- Hardened recognition watchdog and restart flow with cooldowns, adaptive delays, and better handling of common Web Speech errors.
- Reduced redundant live translations via deduplicated/throttled enqueue logic.
- Synchronized version to V1.5.9 across VERSION, APP runtime config, and README.

## [V1.5.8] - 2026-03-12
### Fixed
- Hardened phrase/sentence translation engine for browser compatibility (removed lookbehind regex usage).
- Added robust per-segment fallback to avoid full translation failure when one segment request fails.

### Changed
- Extracted transcription logic into `frontend/js/transcription-engine.js` and delegated recognition parsing/helpers from `app.js`.
- Added free online provider option `libretranslate-free` and integrated it in API/backend translation flow.
- Added copy feedback toast UI for transcript/translation textfields.
- Synchronized version to V1.5.8 across VERSION, runtime APP_VERSION, and README.

## [V1.5.7] - 2026-03-12
### Changed
- Extracted translation flow to `frontend/js/translation-engine.js`.
- Updated frontend to translate incrementally by phrases/sentences while preserving UI animation.
- Kept app orchestration in `frontend/js/app.js` and delegated translation requests to the new engine.
- Synchronized version to V1.5.7 across VERSION, runtime APP_VERSION, and README.

## [V1.5.6] - 2026-03-12
### Fixed
- Kept translation typewriter animation while rendering live transcript instantly to avoid lag, dropped phrases, and disappearing interim text.

### Changed
- Synchronized version to V1.5.6 across VERSION, APP runtime config, and documentation.

## [V1.5.5] - 2026-03-12
### Fixed
- Removed live preview/local fallback path in frontend translation flow that could leave mixed EN/ES text in the translation box.
- Forced live translation to render only final API translation for the full visible transcript text.

### Changed
- Synchronized version to V1.5.5 across VERSION, APP runtime config, and repository documentation.

## [V1.5.4] - 2026-03-11
### Changed
- Incremented release version to keep APP, repository tags, and GitHub Releases aligned with the one-version-per-commit policy.
- Updated project documentation to reflect current production version.

## [V1.5.3] - 2026-03-11
### Added
- GitHub Actions workflow to create a release on each push to main using the VERSION file as the release tag.
- .gitignore for cleaner repository hygiene.
- Changelog and versioning policy documentation.

### Changed
- Standardized release process so app version, Git tag, and GitHub Release remain aligned.
- Expanded README documentation with architecture, API, release process, and contribution guidance.

## [V1.5.2] - 2026-03-11
### Added
- PHP modular architecture with frontend, api, and backend separation.
- Voice transcription and text-to-speech UX improvements.
- Cloud translator provider selector with Auto, Google Free, and MyMemory Free.
- Local EN<->ES fallback for translation resiliency.
