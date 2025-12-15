# Matey

> This branch and other `dev-add-rml*` branches add RMLIO and RMLKGC editing to Matey.
> Do not merge to master without consensus with original developers.

Contents:

- [Introduction](#introduction)
  - [Original introduction](#original-introduction)
  - [Additional introduction for this branch](#additional-introduction-for-this-branch)
    - [Mode selection](#mode-selection)
    - [Modified behavior in modes RMLIO and RMLKGC](#modified-behavior-in-modes-rmlio-and-rmlkgc)
    - [Run the development version](#run-the-development-version)
- [Notes on code changes](#notes-on-code-changes)
  - [Replacement of the logger](#replacement-of-the-logger)
  - [Migration to ESM + vite](#migration-to-esm--vite)
  - [Migration to monaco-editor](#migration-to-monaco-editor)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Setting up the RMLMapper Web API endpoint](#setting-up-the-rmlmapper-web-api-endpoint)
  - [Configuring Matey](#configuring-matey)
  - [YARRRML, RMLIO and RMLKGC examples](#yarrrml-rmlio-and-rmlkgc-examples)
- [Developing](#developing)
  - [Installation](#installation-1)
  - [Debugging](#debugging)
  - [Building](#building)
- [Run tests](#run-tests)
- [License](#license)

## Introduction

### Original introduction

A browser-based editor meant for writing YARRRML rules.
The corresponding RML rules can be exported for use outside of Matey.
Additionally, the rules can be executed on a sample of the data,
which allows users to inspect the generated Linked Data.

### Additional introduction for this branch

#### Mode selection

The front page has an additional selector, that allows to select a mode for Matey.
Matey's default mode is `YARRRRML`, but we added modes `RMLIO` and `RMLKGC`.

#### Modified behavior in modes RMLIO and RMLKGC

In the RMLIO and RMLKGC modes, Matey's behavior changes as follows:

- a modified input field replaces the YARRRML input field;
- clicking "Generate RDF" skips the YARRRML parsing step and calls a mapper with the RML input field's contents
- the output does not show generated RML rules, obviously.

In the RMLKGC mode, Matey calls mapping engine BURP; in other modes Matey calls RMLMapper.

#### Run the development version

Clone [this branch of rmlmapper-webapi-js](https://gitlab.ilabt.imec.be/rml/util/rmlmapper-webapi-js/-/tree/feature-extend-for-rmlkgc?ref_type=heads).

Setup that `rmlmapper-webapi-js` to run its service with BURP support at `http://localhost:4000`.

Continue as we explained in [Debugging](#debugging) below.

## Notes on code changes

### Replacement of the logger

The logger exported in `lib/logger.js` is `console`.
This is done to avoid interference with the loggings written to a server in the original logger.

### Migration to ESM + vite

The project was migrated from CJS + browserify to ESM + vite, in order to support monaco-editor.

Practical changes for this migration:

- Add `"type": "module",` to `package.json` and convert `.js` files from CJS to ESM
  (with cursor on `require`, use "Quick fix" from the context menu in vs-code).
- Add main HTML file `index.html`, which loads `src/main.js`, the code entry point.
- Delete irrelevant `examples/with_bundler` and `examples/with_minified_script`.
- Work around `fs.readFileSync()` with `import <something> from "<some path>/<some file>?raw"` statements
  at the top of involved files.

### Migration to monaco-editor

All changes are located in `lib/editor-manager.js`.

## Requirements

[Node.js](https://nodejs.org/en/download/)

## Installation

```shell
npm i
```

## Usage

### Setting up the RMLMapper Web API endpoint

To generate Linked Data triples, Matey does its RML mapping through a remote server.
For this, Matey requires you to provide
an RMLMapper endpoint.
You can either provide the URL of an existing server, or
set one up yourself by following
[these instructions](https://github.com/RMLio/rmlmapper-webapi-js).
Make sure that you provide the correct URL for the endpoint during [configuration](#configuring-matey).

### Configuring Matey

To configure Matey, create a file `config.json` in the project root.
The configuration options are:

- `"rmlMapperUrl"`: URL of RMLMapper Web API endpoint

The file `config.json` is git-ignored and if you do not provide such a file,
the scripts in ´package.json` copy [config-default.json](./config-default.json) to it.

### YARRRML, RMLIO and RMLKGC examples

The YARRRML, RMLIO and RMLKGC examples come from a single configuration file located at `lib/resources/examples.json`.

- YARRRML examples have a property `yarrrml`: the YARRRML content as a string;
- RMLIO  examples have a property `rmlio`:  an array of strings that, when joined with `\n`, result in the RMLIO  content.
- RMLKGC examples have a property `rmlkgc`: an array of strings that, when joined with `\n`, result in the RMLKGC content.

If you want to add a new example to the editor, that's where you want to add stuff.

## Developing

### Installation

Install dependencies via

   ```shell
   npm i
   ```

### Debugging

1. Build for debugging and spin up an HTTP server via

   ```shell
   npm run dev
   ```

2. Open <http://localhost:5173> in the browser.

### Building

1. Build a minimized version into `./dist`:

   ```shell
   npm run build
   ```

## Run tests

The tests also assume that an RMLMapper endpoint with URL <https://rml.io/api/rmlmapper/execute> is up and running.

Run the following commands from inside the project directory:

```shell
npm install
npm test
```

## License

This code is copyrighted by [Ghent University – imec](http://knows.idlab.ugent.be/) and
released under the [MIT license](http://opensource.org/licenses/MIT).
