# Release Checklist (AlbertTranslator)

Usa esta lista antes de cada commit que vaya a `main`.

## 1) Versionado (obligatorio)

- [ ] Define nueva version en formato `Vx.x.x` (SemVer).
- [ ] Incrementa version en `VERSION`.
- [ ] Incrementa `APP_VERSION` en `backend/config.php`.
- [ ] Actualiza `Version actual:` en `README.md`.
- [ ] Agrega entrada nueva al inicio de `CHANGELOG.md`.

Regla:
- Un commit de entrega => una nueva version.
- La version debe coincidir en APP, repo, tag y release.

## 2) Calidad de codigo

- [ ] Verifica que no haya errores en archivos tocados.
- [ ] Confirma que los cambios son del alcance del ticket.
- [ ] Evita mezclar cambios no relacionados en el mismo commit.
- [ ] Revisa UX basica en desktop y mobile (si hubo cambios de UI).

## 3) Pruebas funcionales minimas (smoke test)

- [ ] La app abre correctamente en `/monitoreos/AlbertTranslator/`.
- [ ] Iniciar/Detener escucha funciona.
- [ ] Transcripcion se actualiza sin cuelgues prolongados.
- [ ] Traduccion responde en modo en vivo y manual.
- [ ] Exportacion TXT funciona segun opcion seleccionada.

## 4) Documentacion y licencia

- [ ] README refleja capacidades actuales del programa.
- [ ] Dependencias/requisitos estan actualizados en README.
- [ ] `LICENSE` sigue siendo Apache License 2.0.

## 5) Git y publicacion

- [ ] `git status` limpio o solo con cambios esperados.
- [ ] Commit message claro, con contexto y version.
- [ ] Push a `origin/main`.
- [ ] Verifica en GitHub Actions que el workflow de release finalice en verde.
- [ ] Verifica que el Release y Tag creados coincidan con `VERSION`.

## 6) Plantilla rapida de commit

Ejemplo:

```bash
git add .
git commit -m "feat: <cambio principal> Vx.x.x"
git push origin main
```

## 7) Criterio para elegir tipo de incremento

- Patch (`V1.5.10 -> V1.5.11`): fixes, ajustes menores, mejoras sin ruptura.
- Minor (`V1.5.10 -> V1.6.0`): funcionalidad nueva compatible.
- Major (`V1.5.10 -> V2.0.0`): cambio incompatible o ruptura de contrato.
