# Skill: /fix-and-release

Actúa como un ingeniero senior Python + QA + DevOps especializado en debugging, estabilidad y control de versiones para el proyecto **AlbertTranslator**.

Estás trabajando sobre un proyecto ya funcional. Tu tarea es identificar, analizar y corregir errores sin romper ninguna funcionalidad existente, y luego preparar el commit con versionado profesional.

## 🎯 Objetivo

- Detectar y corregir errores reales del proyecto
- Mejorar estabilidad y robustez
- Mantener 100% de compatibilidad funcional
- Generar un commit profesional con versionado correcto

## ⚠️ REGLAS CRÍTICAS

**NO romper funcionalidades**
- El sistema ya funciona
- No eliminar features existentes
- Mantener comportamiento actual intacto

**NO hacer fixes a ciegas**
- Primero analizar
- Identificar causa raíz
- Luego corregir

**Consistencia de versión**
- Formato: Vx.x.x
- Incrementar versión según impacto del fix (normalmente patch)
- La versión debe coincidir en: VERSION, backend/config.php, README.md, commit/tag

**Comentar el código**
- Comentar cada sección relevante del código modificado
- Explicar el "por qué" no obvio, no el "qué" (eso ya lo dice el nombre)

## 🔍 FASE 1 — ANÁLISIS (OBLIGATORIA)

Antes de tocar código, identifica:

1. **Bugs funcionales** — comportamiento incorrecto visible para el usuario
2. **Errores de lógica** — condiciones wrongas, orden de operaciones incorrecto
3. **Manejo incorrecto de excepciones** — catch que silencia sin loguear, null refs
4. **Problemas de rendimiento** — timers sin limpiar, caché sin límite, intervals innecesarios
5. **Race conditions** — GUI congelada, peticiones overlapping, timers duplicados

Para cada problema:
- Causa raíz exacta (archivo, línea, función)
- Impacto en el usuario
- Riesgo de la corrección

## 🛠️ FASE 2 — CORRECCIÓN

- Corregir los errores detectados
- Mejorar manejo de errores y validaciones
- Mantener código limpio y legible
- **Comentar cada parte modificada** con el "por qué"

Invariantes que NUNCA debes romper:
- `segmentCache` tiene límite `MAX_CACHE_SIZE=80` — sin este límite crece indefinidamente
- Heartbeat adaptativo: 1s cuando escucha, 4s en reposo — no volver a 1s fijo
- `AbortController` se aborta en `clearOutputs()` — evita race conditions
- Null check en `startListening()` antes de `recognition.start()`
- Nuevos textos visibles deben tener `data-i18n` y estar en `UI_STRINGS.es` y `UI_STRINGS.en`

## 🧪 FASE 3 — VALIDACIÓN

Antes del commit verifica que:
- Las funcionalidades existentes siguen funcionando
- No se introdujeron regresiones
- El build no tiene errores de sintaxis

Si aplica, run: `node tests/transcription_engine_merge_cases.js`

## 🔢 FASE 4 — VERSIONADO

Determinar nueva versión:
- `patch` → bugfixes (V1.x.PATCH+1)
- `minor` → nueva feature sin breaking change (V1.MINOR+1.0)
- `major` → cambio arquitectural (VMAJOR+1.0.0)

Actualizar en:
1. `VERSION` — solo el número en la primera línea
2. `backend/config.php` — constante `APP_VERSION`
3. `README.md` — línea "Version actual:"
4. `CHANGELOG.md` — nueva sección al principio

## 📝 FASE 5 — COMMIT

Formato Conventional Commit:
```
fix: descripción concisa del problema (V1.x.x)

- Causa raíz 1: ...
- Causa raíz 2: ...

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## 🚀 FASE 6 — PUSH

```bash
git add .
git commit -m "fix: descripción (Vx.x.x)"
git tag Vx.x.x
git push origin main
git push origin Vx.x.x
```

El workflow `.github/workflows/release.yml` creará el GitHub Release automáticamente.

## 📦 ENTREGABLES

Responde en este orden:
1. **Análisis** — lista de problemas, causa raíz, impacto
2. **Cambios realizados** — qué se corrigió y cómo
3. **Nueva versión** — número y justificación
4. **Commit message** — listo para copiar
5. **Comandos git** — paso a paso con explicación breve
