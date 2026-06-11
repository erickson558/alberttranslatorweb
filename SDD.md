# SDD — Spec Driven Development

## AlbertTranslator PHP — V1.6.0

---

## 1. Visión general

**AlbertTranslator** es una aplicación web de transcripción en vivo y traducción en tiempo real.
Funciona sobre EasyPHP/Apache y usa el navegador como frontend inteligente.

**Principio rector:** El usuario habla, ve la transcripción aparecer mientras habla,
y la traducción se actualiza progresivamente. Todo en tiempo real. Sin instalaciones adicionales.

---

## 2. Requisitos funcionales (RF)

| ID   | Requisito                                                                                       | Estado |
|------|------------------------------------------------------------------------------------------------|--------|
| RF01 | Capturar voz en el navegador con Web Speech API (Chromium/Edge).                               | ✅ V1.0 |
| RF02 | Transcribir en tiempo real con resultados finales e interim.                                   | ✅ V1.0 |
| RF03 | Traducir el contenido completo de la transcripción (no chunks parciales aislados).             | ✅ V1.2 |
| RF04 | Soportar múltiples proveedores: Google Free, LibreTranslate, MyMemory, Auto.                  | ✅ V1.3 |
| RF05 | Fallback local EN↔ES cuando todos los proveedores externos fallan.                             | ✅ V1.3 |
| RF06 | Watchdog de reconocimiento: recuperar automáticamente ante silencios o cuelgues del motor.     | ✅ V1.4 |
| RF07 | Exportar conversación (transcripción, traducción, o ambas) a .txt.                            | ✅ V1.4 |
| RF08 | Traducción manual: pegar o escribir texto para traducir sin usar micrófono.                    | ✅ V1.4 |
| RF09 | Lectura en voz alta de transcripción y traducción (TTS).                                      | ✅ V1.4 |
| RF10 | Atajos de teclado: Ctrl+Enter (iniciar/detener), Ctrl+Backspace (limpiar).                    | ✅ V1.4 |
| RF11 | Intercambiar idiomas origen/destino con un clic.                                               | ✅ V1.4 |
| RF12 | Modo "rápido" vs "preciso" para traducción en vivo (toggle UI).                               | ✅ V1.5 |
| RF13 | Ajuste de sensibilidad del watchdog desde la UI.                                              | ✅ V1.5 |
| RF14 | Guardar y restaurar preferencias de usuario (idiomas, proveedor, perfil, watchdog).           | ✅ V1.5 |
| RF15 | Botón de donación "Cómprame una cerveza 🍺" con enlace a PayPal.                             | ✅ V1.6 |
| RF16 | Soporte multiidioma de interfaz (ES ↔ EN) con toggle en la cabecera.                         | ✅ V1.6 |
| RF17 | Preferencia de idioma de interfaz persistida en localStorage.                                 | ✅ V1.6 |

---

## 3. Requisitos no funcionales (RNF)

| ID    | Requisito                                                                                        | Métrica / Límite              | Estado |
|-------|--------------------------------------------------------------------------------------------------|-------------------------------|--------|
| RNF01 | RAM del navegador no debe crecer indefinidamente durante una sesión larga.                      | segmentCache ≤ 80 entradas    | ✅ V1.6 |
| RNF02 | CPU en reposo debe ser mínima (tab abierto pero sin escuchar).                                  | Heartbeat ≤ 4 s en reposo     | ✅ V1.6 |
| RNF03 | CPU activa durante escucha debe ser precisa sin exceso.                                         | Heartbeat = 1 s activo        | ✅ V1.6 |
| RNF04 | El tab en segundo plano no debe consumir CPU de heartbeat.                                      | Pausa en document.hidden      | ✅ V1.6 |
| RNF05 | Tiempo de respuesta de traducción < 3 s para texto corto (< 30 palabras).                      | < 3 s p95 en red local        | ✅     |
| RNF06 | El sistema debe recuperarse sin intervención del usuario ante cortes de reconocimiento.         | Watchdog 5–20 s configurable  | ✅     |
| RNF07 | La UI debe ser usable en pantallas de 768px de ancho o más.                                    | Responsive grid               | ✅     |
| RNF08 | El sistema no debe exponer errores internos al usuario final.                                   | Error handling en todos los await | ✅  |
| RNF09 | Las peticiones de traducción deben usar HTTPS siempre.                                          | https:// en todas las URLs    | ✅ V1.5 |
| RNF10 | El sistema debe operar sin dependencias externas de instalación (solo PHP + navegador).         | Zero-dependency runtime       | ✅     |

---

## 4. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────┐
│                   NAVEGADOR (Cliente)                │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              app.js (Orquestador)             │   │
│  │  - i18n (ES ↔ EN)                           │   │
│  │  - Speech Recognition + Watchdog            │   │
│  │  - Heartbeat adaptativo                     │   │
│  │  - Typewriter animation                     │   │
│  │  - UI events + preferences                  │   │
│  └────────────┬────────────┬────────────────────┘   │
│               │            │                        │
│  ┌────────────▼──┐  ┌──────▼──────────────────┐    │
│  │ transcription │  │   translation-engine.js   │    │
│  │  -engine.js   │  │  - Cache LRU (≤80 items) │    │
│  │ - Merge chunks│  │  - Segment by phrases    │    │
│  │ - Normalize   │  │  - translateByPhrases()  │    │
│  └───────────────┘  └──────────────────────────┘    │
└─────────────────────────────┬───────────────────────┘
                              │ HTTP POST
                              ▼
┌─────────────────────────────────────────────────────┐
│              SERVIDOR PHP (EasyPHP/Apache)           │
│                                                     │
│  api/translate-text.php                             │
│       │                                             │
│       ▼                                             │
│  backend/translator_service.php                     │
│  ┌────────────────────────────────────────────┐     │
│  │ translate_transcript($text, $src, $tgt)    │     │
│  │                                            │     │
│  │  provider=google-free → tryGoogle()        │     │
│  │  provider=mymemory   → translate_mymemory()│     │
│  │  provider=libre      → translate_libre()   │     │
│  │  provider=auto       → Google → Libre → MM │     │
│  │                       → local glossary     │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  backend/http.php — http_get_remote() con cURL      │
│  backend/config.php — APP_VERSION, timeouts         │
└─────────────────────────────────────────────────────┘
```

---

## 5. Especificaciones de componentes

### 5.1 segmentCache (translation-engine.js)

**Propósito:** Evitar peticiones de red repetidas para el mismo segmento de texto.

**Especificación:**
- Tipo: `Map` (mantiene orden de inserción para purga FIFO)
- Límite: `MAX_CACHE_SIZE = 80` entradas
- Política de evicción: cuando `size >= MAX_CACHE_SIZE`, eliminar la entrada más antigua
- Clave: `"source|target|provider|textoNormalizado"`
- Limpiar al llamar `clearCache()` (lo hace `clearOutputs()` en app.js)

**Razón del límite:** Sin este límite, el Map crece indefinidamente durante sesiones largas
(traducción de reuniones de 2+ horas), consumiendo RAM hasta que el tab se vuelve lento.

### 5.2 Heartbeat adaptativo (app.js)

**Propósito:** Actualizar la tira de estado en tiempo real con el mínimo consumo de CPU.

**Especificación:**
- `HEARTBEAT_ACTIVE_MS = 1000` — cuando `listeningRequested && listening`
- `HEARTBEAT_IDLE_MS = 4000` — cuando el micrófono no está activo
- Pausa completa cuando `document.hidden === true`
- `restartHeartbeat(active: boolean)` se llama en `onstart`, `onend`, `stopListening()`, y en `visibilitychange`

**Razón:** El heartbeat previo era fijo a 1 s, consumiendo CPU constantemente aunque el usuario no usara la app.

### 5.3 Sistema i18n (app.js + index.php)

**Propósito:** Permitir cambiar el idioma de la interfaz de usuario sin recargar la página.

**Especificación:**
- Idiomas soportados: `es` (español, default), `en` (inglés)
- Diccionario: `UI_STRINGS` con rutas jerárquicas (ej. `"status.idle"`, `"errors.noCopy"`)
- Función de acceso: `i18n(key: string): string` — resuelve rutas con punto
- Aplicación al DOM: `applyUiLanguage(lang)` via `data-i18n`, `data-i18n-ph`, `data-i18n-title`
- Persistencia: `localStorage[UI_LANG_KEY]`
- Toggle: botón `#ui-lang-toggle` en la cabecera

**Para agregar un idioma nuevo:**
1. Añadir una entrada en `UI_STRINGS` con el código ISO (ej. `"fr"`)
2. Añadir la opción en `toggleUiLanguage()` (ciclo de idiomas)
3. Agregar el idioma al atributo `lang` del `<html>` dinámicamente si aplica

### 5.4 Watchdog de reconocimiento (app.js)

**Propósito:** Recuperar automáticamente el reconocimiento de voz ante silencios prolongados
o estados "activo pero mudo" de Chromium/Edge.

**Especificación:**
- Polling: cada `WATCHDOG_POLL_INTERVAL_MS = 5000` ms
- Umbral de silencio: configurable por usuario entre 6 s y 13 s (default 10 s)
- Rolling refresh: si la sesión lleva `WATCHDOG_ROLLING_REFRESH_MS = 45000` ms activa y hay
  `WATCHDOG_REFRESH_IDLE_MS = 1500` ms de silencio → reinicia para mantener el motor "fresco"
- Escala de recuperación: soft restart → hard recovery → max attempts → error visible

### 5.5 Botón de donación

**URL:** `https://www.paypal.com/donate/?hosted_button_id=ZABFRXC2P3JQN`
**Elemento:** `<a id="donate-btn" class="donate-btn">` en el footer
**Comportamiento:** abre en nueva pestaña (`target="_blank"`) para no interrumpir la sesión activa
**i18n:** `data-i18n="donate"` — "Cómprame una cerveza 🍺" / "Buy me a beer 🍺"

---

## 6. Política de versionado

**Formato:** `Vx.x.x` (prefijo V mayúscula, semántico)

| Tipo    | Criterio                                          | Ejemplo              |
|---------|--------------------------------------------------|----------------------|
| `patch` | Bugfixes, correcciones, mejoras de rendimiento   | V1.5.27 → V1.5.28   |
| `minor` | Nuevas features sin breaking change              | V1.5.x → V1.6.0     |
| `major` | Cambios arquitecturales o APIs incompatibles     | V1.x.x → V2.0.0     |

**Archivos a sincronizar en cada versión:**
1. `VERSION` — número sin nada más en la primera línea
2. `backend/config.php` — `define('APP_VERSION', 'Vx.x.x');`
3. `README.md` — línea "Version actual:"
4. `CHANGELOG.md` — nueva sección `## [Vx.x.x] - YYYY-MM-DD`
5. Tag Git + GitHub Release (automatizado via `.github/workflows/release.yml`)

---

## 7. Historial de decisiones de diseño (ADR)

### ADR-001: PHP + Web Speech API (no Electron/Python)
**Decisión:** Stack web puro (PHP backend + JS frontend).
**Razón:** Corre en EasyPHP sin instalación adicional, accesible desde cualquier browser en la red local.
**Trade-off:** Depende de Chromium para Web Speech API — no funciona en Firefox/Safari.

### ADR-002: Traducción por segmentos, no bulk
**Decisión:** `translateByPhrases()` divide el texto en oraciones y traduce cada una.
**Razón:** Permite mostrar traducción progresiva (onSegment) y cachear segmentos individuales.
**Trade-off:** Más peticiones HTTP — mitigado por el caché y debounce.

### ADR-003: Caché FIFO con límite de tamaño
**Decisión:** Map con MAX_CACHE_SIZE=80 y evicción del más antiguo.
**Razón:** Sin límite, el caché crece indefinidamente en sesiones largas → RAM leak.
**Trade-off:** Puede re-traducir segmentos muy antiguos si el caché se llena — aceptable.

### ADR-004: Heartbeat adaptativo
**Decisión:** 1 s cuando escucha, 4 s en reposo, pause en tab hidden.
**Razón:** El intervalo fijo de 1 s consumía CPU innecesariamente aunque el usuario no usara la app.
**Trade-off:** La tira de estado puede mostrar datos con hasta 4 s de retraso en reposo — aceptable.

### ADR-005: i18n client-side (JS), no server-side (PHP)
**Decisión:** Sistema i18n completamente en JS con data-i18n attributes.
**Razón:** Permite cambiar idioma sin recargar la página, preservando el estado de la sesión activa.
**Trade-off:** Los textos iniciales en el HTML son en español — se corrigen al ejecutar `applyUiLanguage()` en el primer render.

---

## 8. Checklist de nueva feature

Antes de considerar una feature "completa":

- [ ] RF correspondiente añadido/actualizado en la tabla §2
- [ ] Si afecta rendimiento: RNF correspondiente en §3
- [ ] Documentada en §5 si es un componente nuevo
- [ ] ADR creado si fue una decisión no obvia
- [ ] `data-i18n` en elementos HTML nuevos
- [ ] Cadenas en `UI_STRINGS.es` y `UI_STRINGS.en` en app.js
- [ ] Versión incrementada correctamente
- [ ] CHANGELOG actualizado
- [ ] CLAUDE.md actualizado si cambia algo para los agentes

---

*Última actualización: V1.6.0 — 2026-06-11*
