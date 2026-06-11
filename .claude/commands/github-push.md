# Skill: /github-push

Sube los cambios actuales a GitHub con la cuenta **erickson558**, crea el tag de versión y verifica que el workflow de release se dispare correctamente.

## Cuenta configurada

- **Usuario**: erickson558
- **Repositorio**: github.com/erickson558/AlbertTranslator (o el repositorio activo)
- **Protocolo**: https (ya autenticado via keyring)
- **Rama principal**: `main`
- **Token scopes**: gist, read:org, repo, workflow

## Pre-requisitos antes del push

Verificar:
1. `git status` — no debe haber cambios sin commitear
2. La versión en `VERSION` coincide con `backend/config.php` (APP_VERSION)
3. `CHANGELOG.md` tiene la entrada para la versión que se va a publicar
4. El commit message sigue el formato Conventional Commits

## Flujo de push completo

```bash
# 1. Ver estado actual
git status
git log --oneline -5

# 2. Ver qué versión vamos a publicar
cat VERSION

# 3. (Si hay cambios sin commitear, commitear primero)
git add .
git commit -m "tipo: descripción (Vx.x.x)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# 4. Crear el tag de versión (leer VERSION para el número exacto)
VERSION=$(cat VERSION)
git tag $VERSION

# 5. Push de la rama principal
git push origin main

# 6. Push del tag (dispara el workflow de GitHub Actions)
git push origin $VERSION

# 7. Verificar que el push fue exitoso
git log --oneline -3
git tag --list | tail -5
```

## Qué hace el workflow automático

`.github/workflows/release.yml` al recibir el push:
1. Lee `VERSION`
2. Valida formato Vx.x.x
3. Crea o valida el tag en el commit actual
4. Publica/actualiza el GitHub Release con:
   - Título: `AlbertTranslator Vx.x.x`
   - Descripción: contenido del CHANGELOG para esa versión

## Si el push falla por autenticación

```bash
# Verificar autenticación de gh CLI
gh auth status

# Si no está logueado:
gh auth login --hostname github.com --git-protocol https

# Verificar que el remote está configurado correctamente
git remote -v
```

## Si hay conflictos con el remoto

```bash
# Ver qué hay en el remoto
git fetch origin

# Integrar cambios remotos (preferir merge sobre rebase para no reescribir historia)
git pull origin main --no-rebase

# Resolver conflictos manualmente si los hay, luego:
git add .
git commit -m "merge: integrar cambios remotos"
git push origin main
```

## Notas

- **NUNCA** usar `git push --force` en `main`
- **NUNCA** saltar el tag — el workflow de release necesita el tag para crear el GitHub Release
- Si el workflow falla, revisar `.github/workflows/release.yml` y los logs en GitHub Actions
- El GitHub Release se puede ver en: https://github.com/erickson558/AlbertTranslator/releases
