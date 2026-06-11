# Skill: /comment-code

Revisa y comenta cada parte del código de **AlbertTranslator** que no tenga documentación suficiente.

## Objetivo

Añadir comentarios que expliquen el **POR QUÉ** (no el qué — eso ya lo dicen los nombres).
El resultado debe ser que cualquier desarrollador nuevo pueda entender el código sin preguntar.

## Reglas de comentado

### ✅ Comentar cuando...
- Hay una restricción no obvia (ej: "MAX_CACHE_SIZE=80 porque sin límite el Map crece indefinidamente")
- Hay un invariante sutil (ej: "el AbortController se aborta ANTES de limpiar el output para evitar race")
- Hay un workaround para un bug del navegador (ej: "Chromium no dispara onend tras stop() en ciertos casos")
- El comportamiento sorprendería a un lector (ej: "scheduleLivePreviewTranslation está deshabilitado intencionalmente")
- Hay una decisión de diseño con trade-offs (ej: "se usa Map en lugar de Object para mantener orden de inserción")

### ❌ NO comentar cuando...
- El nombre de la función/variable ya lo explica (`function stopTypewriter()` no necesita "// para el typewriter")
- El código es trivial y auto-explicativo
- Sería repetir lo que hace el código línea a línea

## Estilo de comentarios

**JavaScript:** JSDoc para funciones públicas/exportadas, comentarios inline `//` para lógica interna.

```js
/**
 * Descripción de qué hace la función.
 * @param {string} text - Explicación del parámetro.
 * @returns {string[]} Explicación del retorno.
 */
function ejemplo(text) {
  // Por qué esta condición específica — la razón no obvia.
  if (someCondition) { ... }
}
```

**PHP:** PHPDoc para funciones, comentarios inline `//` para lógica crítica.

```php
/**
 * Descripción de la función.
 * @param string $transcript Texto a traducir.
 * @return string Traducción o '' si todos los proveedores fallan.
 */
function translate_transcript($transcript, ...) { ... }
```

## Flujo de trabajo

1. **Leer** el archivo objetivo completo
2. **Identificar** funciones/secciones sin documentación o con comentarios pobres
3. **Añadir** comentarios JSDoc/PHPDoc a cada función pública
4. **Añadir** comentarios inline donde el "por qué" no es obvio
5. **NO cambiar** la lógica — solo añadir comentarios
6. **Verificar** que los comentarios no repiten lo que el nombre ya dice

## Archivos prioritarios

En orden de impacto para nuevos desarrolladores:

1. `frontend/js/app.js` — orquestador principal (~2800 líneas)
2. `backend/translator_service.php` — lógica de traducción multi-proveedor
3. `frontend/js/translation-engine.js` — caché LRU y segmentación
4. `frontend/js/transcription-engine.js` — merge de chunks de reconocimiento
5. `backend/http.php` — utilidades HTTP con fallback PowerShell
6. `api/translate-text.php` — endpoint de traducción
7. `api/health.php` — endpoint de salud

## Secciones que siempre necesitan comentario en este proyecto

- Por qué `MAX_CACHE_SIZE = 80` (sin límite → RAM leak)
- Por qué el heartbeat es adaptativo y no fijo a 1s
- Por qué `scheduleLivePreviewTranslation` está vacío (intencionalmente disabled)
- Por qué se usa `commitPendingInterim("onend")` en el handler onend
- Por qué `shouldMergeByOverlap` usa `overlapCount >= 4` como umbral
- Por qué MyMemory fue cambiado de http:// a https://
- Por qué `phraseApplied=true` omite el check de ratio en `translate_with_local_glossary`
