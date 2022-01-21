# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

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

[1.0.0]: https://github.com/RMLio/matey/compare/v0.0.2...v1.0.0
