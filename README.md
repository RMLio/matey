## Matey
A browser-based editor meant for writing YARRRML rules. The corresponding RML rules can be exported for use outside of Matey. Additionally, the rules can be executed on a sample of the data, which allows users to inspect the generated Linked Data.

## Table of contents
1. [Installation](#installation)
2. [Usage](#usage)
3. [Run tests](#Run tests)

## Installation
```
npm install yarrrml-matey
```

## Usage

### Preparing your page
Put a div element with a certain id where you want your Matey editor to be:
```html
<div id="matey-id"></div>
```
Try to avoid declaring div elements with id's prefixed with `matey`, as most div elements that will be inserted into your page have such an id.

### Setting up the Matey editor
In your JavaScript code, import the package, and call the `init` function with the id of the div element for the editor.
```javascript
let matey = require("yarrrml-matey");
matey.init("matey-id");
```
