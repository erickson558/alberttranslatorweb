# AlbertTranslator PHP

Version actual: V1.8.0

Aplicacion web de traduccion y transcripcion en tiempo real para EasyPHP/Apache, con frontend y backend PHP desacoplados.

## Que hace el programa

- Captura voz en navegador con Web Speech API.
- Traduce en vivo y en modo manual.
- Traduce siempre desde el contenido completo del cuadro de transcripcion, evitando previsualizaciones parciales que mezclen idiomas.
- Soporta lectura en voz alta de transcripcion y traduccion.
- Incluye fallback local EN<->ES cuando proveedores externos fallan.
- Permite seleccionar proveedor de traduccion: Auto, Google Free, LibreTranslate Free, MyMemory Free.
- Mantiene una UX fluida para texto incremental y traduccion instantanea.
- Incluye watchdog de reconocimiento para recuperar automaticamente la captura cuando hay cortes o silencios prolongados.
- Permite ajustar desde la UI la sensibilidad del watchdog de voz para reaccionar mas rapido ante pausas o cuelgues del motor.
- Evita retraducciones redundantes con encolado en vivo deduplicado y control de frecuencia.
- Reduce carga sobre el reconocimiento retrasando la traduccion en vivo hasta que el texto se estabiliza o llega como resultado final.
- Muestra estado operativo en tiempo real (microfono, incremental, segmentos y palabras).
- Incluye atajos de teclado para flujo rapido: Ctrl+Enter (iniciar/detener o traducir manual) y Ctrl+Backspace (limpiar).
- Permite exportar a TXT: ambos paneles, solo transcripcion o solo traduccion.
- Soporta AssemblyAI (streaming vía WebSocket) como motor de voz alternativo al nativo del navegador, para redes que bloquean el backend de voz de Google — requiere API key propia en `.env` (ver `.env.example`).
- Panel de "Diagnóstico técnico" visible en la UI: registra en vivo los eventos del reconocimiento de voz para reportar problemas sin usar DevTools.
- Soporta cambio de idioma de interfaz (ES ↔ EN) con un clic, persistido en localStorage.
- Incluye botón de donacion "Comprame una cerveza" vinculado a PayPal.
- Optimizado en uso de RAM (cache LRU con limite de 80 entradas) y CPU (heartbeat adaptativo 1s activo / 4s reposo, pausa en tab oculto).

## Arquitectura

- index.php: entrada principal de la aplicacion y configuracion de assets.
- frontend/css/style.css: estilos y experiencia visual.
- frontend/js/app.js: logica de interfaz, reconocimiento de voz y eventos de usuario.
- frontend/js/transcription-engine.js: motor de transcripcion separado.
- frontend/js/translation-engine.js: motor de traduccion separado con procesamiento por frases/oraciones.
- frontend/js/assemblyai-engine.js: motor de voz alternativo por streaming (AssemblyAI).
- frontend/js/pcm-audio-processor.js: AudioWorklet que convierte el audio del mic a PCM16.
- api/health.php: endpoint de salud.
- api/stt-stream-token.php: emite un token temporal de AssemblyAI para streaming STT desde el navegador.
- api/translate-text.php: endpoint de traduccion.
- backend/config.php: configuracion global y version de app; carga `.env` si existe.
- backend/http.php: utilidades HTTP/JSON.
- backend/translator_service.php: logica de traduccion y fallback.

## Configuracion opcional: AssemblyAI (motor de voz alternativo)

Si tu red bloquea el backend de voz de Google (el microfono arranca pero nunca transcribe
nada), puedes habilitar AssemblyAI como motor alternativo:

1. Crea una cuenta gratuita en https://www.assemblyai.com/ y copia tu API key.
2. Copia `.env.example` a `.env` (en la raiz del proyecto) y completa `ASSEMBLYAI_API_KEY=`.
3. Recarga la pagina — no hace falta reiniciar Apache.

Sin este paso, la app funciona exactamente igual que antes (motor nativo del navegador).

## Requisitos y dependencias

Dependencias de ejecucion:
- PHP 5.4 o superior.
- Servidor web (EasyPHP/Apache).
- Navegador Chromium/Chrome/Edge para reconocimiento de voz y TTS.

Dependencias opcionales:
- Extension curl de PHP para mejorar compatibilidad con servicios externos.

Dependencias de CI/CD:
- GitHub Actions.
- softprops/action-gh-release para publicar releases automaticos.

## Ejecucion local

1. Publica este directorio dentro de tu document root de EasyPHP.
2. Abre http://localhost:888/monitoreos/AlbertTranslator/
3. Permite acceso al microfono.
4. Usa Iniciar escucha para transcripcion y traduccion continua.

## API

- GET /monitoreos/AlbertTranslator/api/health.php
- POST /monitoreos/AlbertTranslator/api/translate-text.php

Ejemplo de payload:

```json
{
  "transcript": "hello world",
  "source_language": "en",
  "target_language": "es"
}
```

## Politica de versionado

Este proyecto usa Semantic Versioning con prefijo V:
- Formato: Vx.x.x
- Patch: correcciones o cambios no disruptivos.
- Minor: nuevas funcionalidades compatibles.
- Major: cambios incompatibles.

La version debe mantenerse sincronizada en:
- VERSION
- backend/config.php (APP_VERSION)
- Tag de Git
- GitHub Release

## Releases automaticos

El workflow en .github/workflows/release.yml se ejecuta en cada push a main y:
- Lee VERSION.
- Valida formato Vx.x.x.
- Crea o valida el tag correspondiente en el commit actual.
- Publica/actualiza el GitHub Release con esa version.

Checklist recomendada antes de publicar:
- RELEASE_CHECKLIST.md

Regla operativa recomendada:
- Cada commit a main debe incluir incremento de VERSION si representa una nueva entrega.

## Changelog

Historial de cambios en CHANGELOG.md.

## Buenas practicas aplicadas

- Separacion de responsabilidades por capas.
- Validacion de entrada en endpoints.
- Contratos JSON consistentes.
- Automatizacion de release para trazabilidad.
- Version unica y sincronizada en app, git y GitHub.
- Recuperacion robusta ante errores transitorios de reconocimiento y red.
- Dedupe y throttling de traduccion en vivo para reducir carga y evitar efectos de rebote.
- Recuperacion profunda cuando Chromium no devuelve `onend` despues de `stop()` en Web Speech API.

## Licencia

Distribuido bajo Apache License 2.0.
Consulta LICENSE para el texto legal completo.
