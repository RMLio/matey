# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [1.3.4] - 2025-09-22

### Changed

- Upgrade YARRRML parser

## [1.3.3] - 2025-06-05

### Added

- Added Changefrog to dev dependencies

### Changed

- Added ERA examples
- Made build instructions cross-platform
- Updated package-lock

## [1.3.2] - 2025-05-22

### Changed

- Upgrade YARRRML parser

## [1.3.1] - 2025-05-21

### Added

- Markdown linter

### Changed

- README: steps

### Fixed

- Button "Load Example" is not functioning correctly (See [issue 48](https://gitlab.ilabt.imec.be/yarrrml/matey/-/issues/48))

## [1.3.0] - 2025-01-07

### Changed

- Added box colors
- Use dropdown for examples
- Expanded example descriptions
- Added description of Matey
- Added user study link
- Gray out output data box
- Single layout
- Use single generate RDF button
- Remove RML output
- Add clear all button

### Fixed

- Upgraded dependencies for security.

## [1.2.0] - 2024-09-24

### Added

- IncRML + LDES generation examples, the new way of generating basic LDES.
- Release script

### Changed

- Updated dependency on yarrrml-parser to v1.7.2
- Updated dev dependency on jest to 29.7.0
- Added dev dependency to jest-dom version 6.5.0
- Added dev dependency to jest-environment-jsdom version 29.7.0

### Removed

- Old LDES generation example, since not supported by yarrrml-parser anymore.

## [1.1.1] - 2023-09-19

### Changed

- Updated dependency on yarrrml-parser to v1.6.1
- Downgraded dev dependency on gulp to 3.9.1 due to security issue
- Updated dev dependency on node-fetch to 2.6.7
- Removed dependency on Gulp
- Updated contributor list

## [1.1.0] - 2023-09-13

### Changed

- Updated dependency on yarrrml-parser to v1.5.4
- Pass new function state ID to the RML Web API when a user refreshes the browser.

### Added

- A minimal LDES example in the web GUI.
- A button `Reset state` in the web GUI, so next call to RMLMapper web API uses a clean state.

## [1.0.5] - 2022-11-25

### Added

- Add Tutorial example for KG4DI

## [1.0.4] - 2022-02-02

### Fixed

- CI: fix changelog retrieval

## [1.0.3] - 2022-02-02

### Fixed

- Typo: getAmountOfDateEditors renamed to getNumberOfDataEditors (see [issue 3](https://github.com/RMLio/matey/issues/2)).
- Make download buttons work again (see [issue 2](https://github.com/RMLio/matey/issues/2))

## [1.0.2] - 2022-01-24

### Fixed

- Fix Bootstrap CSS import path when embedding Matey in other projects with a common node_modules folder.
- Regenerate package-lock.json with integrity checks and new name.

## [1.0.1] - 2022-01-24

### Added

- CI jobs to automate releases, tests & deployment
- Fix CHANGELOG formatting
- Enforce CHANGELOG updates for merge requests

## [1.0.0] - 2021-08-17

### Changed

- Updated all dependencies and necessary compatibility changes
- Index.js split into several files
- Support for target  and multiple outputs (see [issue 34](https://gitlab.ilabt.imec.be/yarrrml/matey/-/issues/34))
- Replaced uglify with terser

### Fixed

- Jest test for example outputs cannot load Worker object (see [issue 13](https://gitlab.ilabt.imec.be/yarrrml/matey/-/issues/13))
- Missing require for brace XML mode
- Outdated guides in README

### Added

- Test and example for targets in RML
- Add license info (see [issue 37](https://gitlab.ilabt.imec.be/yarrrml/matey/-/issues/37))

## 0.0.2 - 2019-07-26

### Added

- Initial public release

[1.3.4]: https://github.com/RMLio/matey/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/RMLio/matey/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/RMLio/matey/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/RMLio/matey/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/RMLio/matey/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/RMLio/matey/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/RMLio/matey/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/RMLio/matey/compare/v1.0.5...v1.1.0
[1.0.5]: https://github.com/RMLio/matey/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/RMLio/matey/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/RMLio/matey/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/RMLio/matey/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/RMLio/matey/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/RMLio/matey/compare/v0.0.2...v1.0.0
