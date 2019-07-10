## Matey
A browser-based editor meant for writing YARRRML rules. The corresponding RML rules can be exported for use outside of Matey. Additionally, the rules can be executed on a sample of the data, which allows users to inspect the generated Linked Data.

## Table of contents
1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Examples](#examples)
5. [Run tests](#run-tests)

## Requirements
[Node.js](https://nodejs.org/en/download/)

## Installation
```
npm install matey
```

## Usage

### Preparing your page
Put a div element with a certain id where you want your Matey editor to be:
```html
<div id="matey-id"></div>
```
Try to avoid declaring div elements with id's prefixed with "matey", as most div elements that will be inserted into your page have such an id.

### Setting up Matey using `require`
In your JavaScript code, import the Matey class from the package, and on an instance call the `init` function with the id of the div element for the editor.
```javascript
let Matey = require("matey");
let matey = new Matey();
matey.init("matey-id");
```
### Setting up Matey by including minified script in page
To build the minified script, you first need to install all of the Matey's
dependencies by running `npm install` from inside the project directory.
Then you can create a minified version of Matey by running `npm run build:browser`, which puts the script in the current directory.
You can also choose your own file destination by running `browserify lib/index.js --standalone matey -t urify/transform -t brfs | uglifyjs > my/file/destination.min.js`.

To set up Matey in your page, include the script in your HTML code, and call Matey's `init` function on an instance.
```html
<script src="matey.min.js" type="text/javascript"></script>
<script>
    let matey = new Matey();
    matey.init("matey-id")
</script>
```

### Configuring Matey
To add extra configuration, you can pass a JSON object as an argument to Matey's `ìnit()` method. Configuration options include:
* **rml\_mapper\_uri**: URI of RMLMapper Web API endpoint used for generating Linked Data triples.

## Examples
Examples of usage can be found in the `examples` directory of the project. Both examples illustrate the use of Matey through a single web page which only contains Matey's editors.

## Run tests
From inside the project directory, run the following commands:
```
npm install
npm run test
```
