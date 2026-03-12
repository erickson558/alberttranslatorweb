# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog and the project uses Semantic Versioning with a V prefix: Vx.x.x.

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
