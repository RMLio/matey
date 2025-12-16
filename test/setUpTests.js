'use strict';

// import matey
const Matey = require('../lib');
global.matey = new Matey();

// import jsdom-worker to mock Worker object which doesn't work by default in Jest/jsdom
require('jsdom-worker-fix');

// createObjectURL isn't available in Jest by default, so has to be mocked too
global.URL.createObjectURL = jest.fn();

// set up document body
document.body.innerHTML = '<div id="test-editor"></div>';

// initialise matey editors
const config = {
  rmlMapperUrl: "https://rml.io/api/rmlmapper/execute" // CI/CD needs this to pass all tests
};
matey.init("test-editor", config);
