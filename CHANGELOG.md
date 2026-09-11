# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog and the project uses Semantic Versioning with a V prefix: Vx.x.x.

## [V1.6.4] - 2026-09-11
### Fixed
- **Causa raíz de "no pide permiso de micrófono y el botón queda en 'Iniciando...'"**: en `frontend/js/app.js`, `startListening()` llamaba a `recognition.start()` sin ningún límite de tiempo para el caso en que el motor de reconocimiento no dispare **ningún** evento (`onstart`/`onerror`/`onend`). Esto ocurre en builds de Chromium sin el backend propietario de Web Speech API de Google: `recognition.start()` se queda "colgado" sin pedir permiso de micrófono ni fallar nunca. El único watchdog existente (`startRecognitionWatchdog()`) solo se arma dentro de `onstart`, por lo que si `onstart` jamás llega, tampoco arranca ningún mecanismo de recuperación y la UI queda congelada en "Iniciando escucha..." para siempre. Se agregó un "watchdog de arranque" (`armRecognitionStartWatchdog()` / `handleRecognitionStartTimeout()`, `RECOGNITION_START_TIMEOUT_MS = 6500`) que se arma justo después de `recognition.start()` en `startListening()` y se cancela desde `onstart`/`onerror`/`onend` (cualquier evento real del motor). Si vence sin que llegue ninguno, descarta la instancia colgada (`abort()`/`stop()` + desligado de handlers para evitar callbacks fantasma), restaura la UI a estado idle (botones, heartbeat en reposo) y muestra un error accionable (`errors.startTimeout`) sugiriendo Google Chrome o Microsoft Edge y revisar el permiso de micrófono. Se agregó también la limpieza del timer en `stopListening()` para el caso en que el usuario cancele manualmente mientras el arranque está colgado.
- Nuevas claves i18n `errors.startTimeout` / `errors.startTimeoutStatus` en `UI_STRINGS.es`/`UI_STRINGS.en`.
- Verificado con un harness Node+jsdom que carga los archivos reales (`transcription-engine.js` + `translation-engine.js` + `app.js`, sobre el `index.php` real renderizado por PHP CLI) con un mock de `SpeechRecognition`: (a) `.start()` que nunca dispara ningún evento confirma que a los ~6.5 s la UI vuelve a idle con el mensaje de error y sin quedar colgada, sin que ningún callback fantasma la revierta después; (b) `.start()` que dispara `onstart` a los 30 ms confirma que el flujo normal sigue igual (sin mostrar error, botones y estado "Escuchando en vivo" como antes).

### Changed
- Versión sincronizada a V1.6.4 en VERSION, APP_VERSION, README y CHANGELOG.

## [V1.6.3] - 2026-09-11
### Fixed
- **Causa raíz de "sigue sin mostrar la transcripción"**: en navegadores donde `SpeechRecognition.available`/`.install` existen (on-device speech recognition), `ensureLocalRecognitionReady()` (`app.js`) esperaba `install()` sin límite de tiempo antes de llamar a `initializeRecognitionInstance()`/`recognition.start()`. Cuando el modelo local está en estado `"downloadable"` esa promesa puede tardar minutos o no resolver nunca (confirmado con Chromium real: `available()` resuelve en ~4 ms devolviendo `"downloadable"`, pero `install()` no resuelve ni siquiera tras 8 s), dejando `startListening()` colgado indefinidamente: el micrófono real jamás llegaba a arrancar, por lo que `onresult` nunca se disparaba y la transcripción quedaba vacía aunque el usuario hablara. Se agregó `raceWithTimeout()` con `LOCAL_RECOGNITION_READY_TIMEOUT_MS = 4000` para acotar las llamadas a `available()`/`install()`; si exceden el límite, se cae de vuelta a reconocimiento remoto (comportamiento previo a la introducción de esta optimización) sin bloquear el arranque del micrófono. Verificado con un harness Node+jsdom que carga los archivos reales (`transcription-engine.js` + `app.js`) y ejercita `onresult` real → `parseRecognitionEvent` → `appendTranscriptChunk`/`renderTranscriptLive` → `animateTypeInto` → `textarea#transcript-output.value`, y con pruebas en navegador real (Chromium headless) que confirman que `startListening()` ahora se desbloquea en ~4.2 s en vez de colgarse indefinidamente.

### Changed
- Versión sincronizada a V1.6.3 en VERSION, APP_VERSION, README y CHANGELOG.

## [V1.6.2] - 2026-09-11
### Fixed
- **Causa raíz de "la traducción en vivo ya no se actualiza"**: la extensión cURL de PHP en este entorno EasyPHP/Windows no tiene configurado un `cacert.pem` válido (`openssl.cafile`/`curl.cainfo` vacíos), por lo que **todas** las peticiones HTTPS a los proveedores de traducción (Google Translate free, LibreTranslate, MyMemory) fallaban en `http_get_remote()` con `SSL certificate problem: unable to get local issuer certificate`. La app quedaba silenciosamente reducida al glosario local de ~150 palabras (`translate_with_local_glossary`), por lo que solo frases hechas enteramente de esas palabras (p.ej. "how are you today") parecían traducirse, y cualquier oración real la dejaba vacía. `backend/http.php`: cuando la petición vía `curl_init` de PHP falla por error de red/SSL, ahora se reintenta automáticamente con `curl.exe` (CLI) y PowerShell —los mismos fallbacks que ya existían para cuando la extensión cURL no está disponible—, sin desactivar la verificación de certificados en ningún punto.
- **Caché de traducción envenenado por fallos**: en `translation-engine.js`, `translateByPhrases()` guardaba en `segmentCache` incluso el resultado `""` cuando todos los proveedores fallaban para un segmento. Eso dejaba esa frase exacta permanentemente sin traducir durante el resto de la sesión (hasta purgarse por FIFO), aunque una petición posterior sí hubiera podido tener éxito. Ahora solo se cachean resultados no vacíos; los fallos no se persisten y cada intento futuro vuelve a golpear la red.

### Changed
- Versión sincronizada a V1.6.2 en VERSION, APP_VERSION, README y CHANGELOG.

## [V1.6.0] - 2026-06-11
### Added
- Botón de donación "Cómprame una cerveza 🍺" en el footer con enlace a PayPal (hosted_button_id=ZABFRXC2P3JQN). Se abre en pestaña nueva para no interrumpir la sesión activa.
- Soporte multiidioma de interfaz (ES ↔ EN): sistema i18n client-side con `UI_STRINGS`, función `i18n(key)`, atributos `data-i18n` / `data-i18n-ph` en todo el HTML y botón toggle `#ui-lang-toggle` en la cabecera. La preferencia se persiste en localStorage.
- Agentes de Claude Code (.claude/agents/): `debugger`, `code-reviewer`, `release-manager` con contexto completo del proyecto.
- Skills de Claude Code (.claude/commands/): `/fix-and-release`, `/comment-code`, `/github-push` con flujos paso a paso.
- CLAUDE.md: contexto del proyecto para asistentes de IA con reglas críticas, arquitectura y comandos frecuentes.
- SDD.md: documento de Spec Driven Development con RF, RNF, arquitectura, especificaciones de componentes, ADRs y checklist de features.

### Fixed
- **RAM leak crítico**: `segmentCache` en `translation-engine.js` crecía indefinidamente (Map sin límite). Implementado caché FIFO con `MAX_CACHE_SIZE = 80` y función `setCacheEntry()` que poda la entrada más antigua cuando el límite se supera.
- **CPU en reposo**: heartbeat de la tira de estado cambiado de intervalo fijo 1 s a adaptativo: 1 s cuando el micrófono está activo, 4 s en reposo (reducción del 75% de ciclos de CPU cuando el usuario no transcribe).
- **CPU con tab oculto**: el heartbeat ahora se pausa cuando `document.hidden === true` (visibilitychange) y se reanuda al volver al tab, eliminando actualizaciones innecesarias cuando la app está en segundo plano.
- Mensajes de error y estado de la UI ahora pasan por `i18n()` en lugar de strings hardcodeados en español, garantizando consistencia con el idioma de interfaz activo.
- `restartHeartbeat(false)` añadido en `stopListening()` y en el handler de `not-allowed`/`service-not-allowed` para garantizar la transición al modo lento en todos los paths de parada.

### Changed
- `translation-engine.js`: añadidos JSDoc completos a todas las funciones. Exportada `getCacheSize()` para diagnóstico.
- `app.js`: módulo i18n completo al inicio del archivo (UI_STRINGS, i18n(), applyUiLanguage(), restoreUiLanguage(), toggleUiLanguage()).
- `index.php`: refactorizado con `data-i18n` / `data-i18n-ph` en todos los elementos traducibles, nuevo bloque `.app-header-top` flex para alinear título + botón de idioma.
- `style.css`: nuevos estilos para `.lang-toggle-btn`, `.footer-content`, `.donate-btn` y `.app-header-top`.
- Versión sincronizada a V1.6.0 en VERSION, APP_VERSION, README y CHANGELOG.

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
