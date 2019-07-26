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

### Setting up the RMLMapper Web API endpoint
To generate Linked Data triples, Matey does its RML mapping through a remote server. For this, Matey requires you to provide
an RMLMapper endpoint. You can either provide the URL of an existing server, or set one up yourself by following the instructions
[here](https://github.com/RMLio/rmlmapper-webapi-js). Make sure that you provide the correct URL for the endpoint during [configuration](#configuring-matey).

### Preparing your page
Put a div element with a certain id where you want your Matey editor to be:
```html
<div id="matey-id"></div>
```
Try to avoid declaring div elements with id's suffixed with "-matey", as most div elements that will be inserted into your page have such an id. For example: elements with id's such as "btn-matey" or "editor-matey" are reserved by Matey.

### Setting up Matey by including minified script in page
- Install dependencies by running `npm install`.
- Create minified version by running `npm run build:browser`, which puts the scripts in the current working directory. You can also choose your own file destination by running `browserify lib/index.js --standalone Matey -t urify/transform -t brfs -t browserify-css | uglifyjs > my/file/destination.min.js`.
- Include the script in your HTML code, and call Matey's `init` function on an instance of the `Matey` class:
    ```html
    <script src="matey.min.js" type="text/javascript"></script>
    <script>
        let matey = new Matey();
        matey.init("matey-id");
    </script>
    ```
### Setting up Matey using a bundler
In your JavaScript code, import the Matey class from the package, and on an instance call the `init` function with the id of the div element for the editor.
```javascript
let Matey = require("matey");
let matey = new Matey();
matey.init("matey-id");
```
You can use `browserify` from within the project's root directory to bundle up the code and its dependencies, so you can include it into your HTML code. The example in the folder `examples/with_require` used the following command to bundle the code up into `examples/with_require/bundle.js`:
```
browserify examples/with_require/init.js -t urify/transform -t brfs -t browserify-css | uglifyjs > examples/with_require/bundle.js
```

### Configuring Matey
To configure Matey, you can pass a JSON object as an argument to Matey's `init` method. The configuration options are:
* `rmlMapperUrl`: URL of RMLMapper Web API endpoint


An example of calling `init` with a configuration object would be:
```javascript
let config = {
    rmlMapperUrl: "http://tw06v069.ugent.be/rmlmapper/process"
};
matey.init("matey-id", config);
```
## Examples
Examples of usage can be found in the `examples` directory of the project. 
Both examples illustrate the use of Matey through a single web page which only contains Matey's editors.
In these examples, Matey is configured to use an RMLMapper endpoint with URL "http://localhost:4000/execute", so if you
want these examples to run, make sure you have such an endpoint set up.

## Run tests
The tests also assume that an RMLMapper endpoint with URL "http://localhost:4000/execute" is up and running. Once you
have it set up, run the following commands from inside the project directory:
```
npm install
npm test
```
