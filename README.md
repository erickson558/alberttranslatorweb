# AlbertTranslator PHP

Version actual: V1.5.12

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
- Evita retraducciones redundantes con encolado en vivo deduplicado y control de frecuencia.
- Muestra estado operativo en tiempo real (microfono, incremental, segmentos y palabras).
- Incluye atajos de teclado para flujo rapido: Ctrl+Enter (iniciar/detener o traducir manual) y Ctrl+Backspace (limpiar).
- Permite exportar a TXT: ambos paneles, solo transcripcion o solo traduccion.

## Arquitectura

- index.php: entrada principal de la aplicacion y configuracion de assets.
- frontend/css/style.css: estilos y experiencia visual.
- frontend/js/app.js: logica de interfaz, reconocimiento de voz y eventos de usuario.
- frontend/js/transcription-engine.js: motor de transcripcion separado.
- frontend/js/translation-engine.js: motor de traduccion separado con procesamiento por frases/oraciones.
- api/health.php: endpoint de salud.
- api/translate-text.php: endpoint de traduccion.
- backend/config.php: configuracion global y version de app.
- backend/http.php: utilidades HTTP/JSON.
- backend/translator_service.php: logica de traduccion y fallback.

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

## Licencia

Distribuido bajo Apache License 2.0.
Consulta LICENSE para el texto legal completo.
