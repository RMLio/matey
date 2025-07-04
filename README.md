# Matey

A browser-based editor meant for writing YARRRML rules.
The corresponding RML rules can be exported for use outside of Matey.
Additionally, the rules can be executed on a sample of the data,
which allows users to inspect the generated Linked Data.

## Table of contents

1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Examples](#examples)
5. [Run tests](#run-tests)
6. [License](#license)

## Requirements

[Node.js](https://nodejs.org/en/download/)

## Installation

```shell
npm i @rmlio/matey
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

### Preparing your page

Put a div element with a certain id where you want your Matey editor to be:

```html
<div id="matey-id"></div>
```

Try to avoid declaring div elements with id's suffixed with `-matey`,
as most div elements that will be inserted into your page have such an id.
For example, elements with id's such as `btn-matey` or `editor-matey` are reserved by Matey.

### Setting up Matey by including minified script in page

- Install dependencies by running `npm install`.
- Create minified version by running `npm run build:browser`,
which puts the scripts in the current working directory.
You can also choose your own file destination by running
`browserify lib/index.js --standalone Matey -t urify/transform -t brfs -t browserify-css | terser > my/file/destination.min.js`.
- Start an RMLMapper Web API endpoint (sugggested: [rmlmapper-webapi-js](https://github.com/RMLio/rmlmapper-webapi-js))
- Include the script in your HTML code, and call Matey's `init` function on an instance of the `Matey` class:

```html
<head>
    <!-- otherwise browsers won't be able to parse the minified script -->
    <meta charset="UTF-8">
</head>

<script src="matey.min.js" type="text/javascript"></script>
<script>
    let matey = new Matey();
    const config = {
       rmlMapperUrl: "http://localhost:4000/execute" // make sure an RMLMapper endpoint with this URL is active!
    };
    matey.init("matey-id", config);
</script>
```

### Setting up Matey using a bundler

In your JavaScript code, import the Matey class from the package, and
on an instance call the `init` function with the `id` of the `div` element for the editor.

```javascript
const Matey = require("matey");
const matey = new Matey();
const config = {
  rmlMapperUrl: "https://rml.io/api/rmlmapper/execute" // make sure an RMLMapper endpoint with this URL is active!
};
matey.init("matey-id", config);
```

You can use `browserify` from within the project's root directory to bundle up the code and its dependencies,
so you can include it in your HTML code.
The example in the folder `examples/with_bundler` used the following command
to bundle the code up into `examples/with_with_bundler/bundle.js`:

```shell
browserify examples/with_bundler/init.js -t urify/transform -t brfs -t browserify-css --minify=true | terser > examples/with_bundler/bundle.js
```

The browserify transformations used in the example are necessary for Matey to work.

### Configuring Matey

To configure Matey, you can pass a JSON object as an argument to Matey's `init` method.
The configuration options are:

- `rmlMapperUrl`: URL of RMLMapper Web API endpoint

An example of calling `init` with a configuration object would be:

```javascript
let config = {
    rmlMapperUrl: "http://tw06v069.ugent.be/rmlmapper/process"
};
matey.init("matey-id", config);
```

### YARRRML examples

The YARRRML examples come from a single configuration file located at `lib/resources/examples.json`.
If you want to add a new example to the editor, that's where you want to add stuff.

## Examples

Examples of usage can be found in the `examples` directory of the project.
Both examples illustrate the use of Matey through a single web page which only contains Matey's editors.
In these examples, Matey is configured to use an RMLMapper endpoint with URL `http://localhost:4000/execute`, so if you
want these examples to run, make sure you have such an endpoint set up.

## Developing

1. Install dependencies via

   ```shell
   npm i
   ```

2. Build via

   ```shell
   npm run build:browser
   ```

3. Copy `matey.min.js` from `dist` to `examples/with_minified_script/matey.min.js` via

   ```shell
   cp dist/matey.min.js examples/with_minified_script/matey.min.js
   ```

4. Run an HTTP server inside `examples/with_minified_script` via

   ```shell
   npx http-server examples/with_minified_script
   ```

5. Open <http://localhost:8080/test.html> in the browser.

## Run tests

The tests also assume that an RMLMapper endpoint with URL <http://localhost:4000/execute> is up and running.
Once you have it set up,
run the following commands from inside the project directory:

```shell
npm install
npm test
```

## License

This code is copyrighted by [Ghent University – imec](http://knows.idlab.ugent.be/) and
released under the [MIT license](http://opensource.org/licenses/MIT).
