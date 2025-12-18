# Matey

A browser-based editor meant for writing YARRRML rules.
The corresponding RML rules can be exported for use outside of Matey.
Additionally, the rules can be executed on a sample of the data,
which allows users to inspect the generated Linked Data.

<!-- omit in toc -->
## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Setting up the RMLMapper Web API endpoint](#setting-up-the-rmlmapper-web-api-endpoint)
  - [Configuring Matey](#configuring-matey)
- [Developing](#developing)
  - [Installation](#installation-1)
  - [Debugging](#debugging)
  - [Building](#building)
- [Run tests](#run-tests)
- [License](#license)

## Requirements

[Node.js](https://nodejs.org/en/download/)

## Installation

```shell
npm install
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

To configure Matey, create a configuration file `config.json` in the project root.
The configuration options are:

- `"rmlMapperUrl"`: URL of RMLMapper Web API endpoint

Example configuration file content file would be:

```json
{
  "rmlMapperUrl": "http://localhost:4000/execute"
}
```

If you to run Matey with this configuration, make sure you have such an endpoint set up.

The file `config.json` is git-ignored and if you do not provide such a file,
the scripts in `package.json` copy [config-default.json](./config-default.json) to it.

## Developing

### Installation

Install dependencies via

   ```shell
   npm install
   ```

### Debugging

1. Build for debugging and spin up an HTTP server via

   ```shell
   npm run dev
   ```

2. Open <http://localhost:5173> in the browser.

### Building

Build a minimized version into `./dist`:

   ```shell
   npm run build
   ```

## Run tests

The tests assume that an RMLMapper endpoint with URL <https://rml.io/api/rmlmapper/execute> is up and running.

Run the following commands from inside the project directory:

```shell
npm install
npm test
```

## License

This code is copyrighted by [Ghent University – imec](http://knows.idlab.ugent.be/) and
released under the [MIT license](http://opensource.org/licenses/MIT).
