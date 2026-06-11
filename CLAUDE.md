# AlbertTranslator — Contexto del proyecto para Claude Code

## ¿Qué es este proyecto?

Aplicación web PHP de **transcripción en vivo y traducción en tiempo real**.
Corre sobre EasyPHP/Apache en `http://localhost:888/monitoreos/AlbertTranslator/`.

- Captura voz con Web Speech API (browser-side).
- Traduce vía endpoints PHP que hacen proxy a Google Free, LibreTranslate, MyMemory.
- Fallback local word-by-word EN↔ES cuando todos los proveedores fallan.
- UI dark futurista con typewriter effect, watchdog de reconocimiento y runtime strip.
- Soporte multiidioma de interfaz (ES ↔ EN) vía sistema i18n en app.js.

## Versión actual

Leer siempre el archivo `VERSION` — no memorizar la versión. Sincronizar en:
- `VERSION`
- `backend/config.php` (constante `APP_VERSION`)
- `README.md`
- Tag Git y GitHub Release

## Arquitectura de archivos

```
index.php                    ← HTML principal, inyecta PHP_APP_CONFIG en window
backend/
  config.php                 ← constantes globales (APP_NAME, APP_VERSION, timeouts)
  http.php                   ← utilidades HTTP: http_get_remote() con cURL/PowerShell
  translator_service.php     ← lógica de traducción multi-proveedor + fallbacks
api/
  health.php                 ← GET /api/health.php
  translate-text.php         ← POST /api/translate-text.php
  stt-stream-token.php       ← token temporal para streaming STT externo (futuro)
frontend/
  css/style.css              ← estilos dark mode
  js/
    transcription-engine.js  ← AlbertTranscriptionEngine: merge de chunks, normalización
    translation-engine.js    ← AlbertTranslationEngine: caché LRU + translate by phrases
    app.js                   ← orquestador: speech recognition, i18n, UI events, heartbeat
tests/
  transcription_engine_merge_cases.js  ← casos de test de merge
```

## Reglas críticas al tocar código

1. **NO romper funcionalidades existentes.** Analizar antes de cambiar.
2. **Versión semántica con prefijo V** (Vx.x.x). Patch=fix, Minor=feature, Major=breaking.
3. **Sincronizar versión** en los 4 lugares al mismo tiempo (VERSION, config.php, README, tag).
4. **No aumentar complejidad** sin justificación: tres líneas similares > abstracción prematura.
5. **No comentarios de "qué hace"** si el nombre ya lo dice. Sí comentar el "por qué" no obvio.
6. **Caché `segmentCache`** tiene límite `MAX_CACHE_SIZE=80`. No eliminar ese límite.
7. **Heartbeat adaptativo**: 1 s cuando escucha, 4 s en reposo. No volver a 1 s fijo.
8. **i18n**: añadir `data-i18n`, `data-i18n-ph` o `data-i18n-title` a nuevos elementos HTML.
   Registrar la cadena en ambos idiomas (`UI_STRINGS.es` y `UI_STRINGS.en`) en app.js.

## Comandos frecuentes

```bash
# Ver versión actual
cat VERSION

# Correr tests básicos (Node.js)
node tests/transcription_engine_merge_cases.js

# Abrir en navegador
start http://localhost:888/monitoreos/AlbertTranslator/

# Commit con versionado profesional (ver skill /fix-and-release)
git add .
git commit -m "fix: descripción corta (V1.x.x)"
git tag Vx.x.x
git push origin main
git push origin Vx.x.x
```

## Cuenta GitHub activa

- Usuario: **erickson558**
- Protocolo: https
- Rama principal: `main`
- El workflow `.github/workflows/release.yml` crea releases automáticos en cada push a main.

## Política de commits

Formato Conventional Commits:
```
tipo: descripción breve (Vx.x.x)

Cuerpo opcional explicando el "por qué".

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Tipos: `fix`, `feat`, `refactor`, `perf`, `docs`, `test`, `chore`.

## Skills disponibles (ver .claude/commands/)

| Skill                | Propósito                                                        |
|----------------------|------------------------------------------------------------------|
| `/fix-and-release`   | Flujo completo: análisis → corrección → versión → commit → push  |
| `/comment-code`      | Comentar cada parte del código con JSDoc/PHPDoc                  |
| `/github-push`       | Push a GitHub con cuenta erickson558, tag y release              |

## Agentes disponibles (ver .claude/agents/)

| Agente             | Propósito                                                         |
|--------------------|-------------------------------------------------------------------|
| `debugger`         | Detecta bugs, analiza causa raíz, corrige sin romper features     |
| `code-reviewer`    | Revisa calidad, seguridad, rendimiento y SDD compliance           |
| `release-manager`  | Gestiona versioning, CHANGELOG, tags y GitHub releases            |
