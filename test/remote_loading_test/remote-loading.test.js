'use strict';

// import YAML for parsing YARRRML outpuit
const YAML = require("yamljs");

// import mocked XMLHttpRequest
const xhrMock = require('xhr-mock').default;

// import readFileSync from File System
const readFileSync = require('fs').readFileSync;

// read expected JSON and YAML responses from files
const expectedJsonResponse = readFileSync(__dirname + '/correct_responses/json-response.json', 'utf8');
const expectedYarrrmlResponse = readFileSync(__dirname + '/correct_responses/yarrrml-response.yaml', 'utf8');

// replace the real XHR object with the mock XHR object, and clear all alert boxes before each test
beforeEach(() => {
  xhrMock.setup();

  let alerts = document.getElementsByClassName('alert');
  while (alerts[0]) {
    alerts[0].parentNode.removeChild(alerts[0]);
  }
});

// put the real XHR object back and clear the mocks
afterEach(() => {
  xhrMock.teardown();
});

// tests for fetching remote data source
describe('loadRemoteDataSource()', function () {

  it('should display fetched source in data editor when status=200', async function () {

    expect.assertions(1);

    // initialise mocked server's response for correct URL
    let correctUrl = '/get/existent_json';

    xhrMock.get(correctUrl, {
      status: 200,
      body: expectedJsonResponse
    });

    // let matey fetch remote data source and wait for it to be displayed in data editor
    await matey.loadRemoteDataSource(correctUrl, 'json-response.json.json');

    // retrieve value from active data editor
    let activeEditorValue = matey.getData();

    // check if parsed value equals parsed expected value
    let parsedReceivedValue = JSON.parse(activeEditorValue);
    let parsedExpectedValue = JSON.parse(expectedJsonResponse);
    expect(parsedReceivedValue).toEqual(parsedExpectedValue);
  });

  it('should display danger alert message when status=404', async function () {

    expect.assertions(1);

    // initialise mocked server's response for incorrect URL
    let incorrectUrl = '/get/nonexistent_json';
    
    xhrMock.get(incorrectUrl, {
      status: 404
    });

    // try to fetch remote data source
    await matey.loadRemoteDataSource(incorrectUrl, 'json-response.json.json');

    // check if danger alert appears
    checkDangerAlert();
  });
});

// tests for fetching remote YARRRML rules
describe('loadRemoteYarrrml()', function() {

  it('should display fetched rules in YARRRML editor when status=200', async function() {

    expect.assertions(1);

    // initialise mocked server's response for correct URL
    let correctUrl = '/get/existent_yarrrml';

    xhrMock.get(correctUrl, {
      status: 200,
      body: expectedYarrrmlResponse
    });

    // let matey fetch remote YARRRML rules and wait for them to be displayed in YARRRML editor
    await matey.loadRemoteYarrrml(correctUrl);

    // retrieve value from YARRRML editor
    let yarrrmlEditorValue = matey.getYarrrml();

    // check if parsed value equals parsed expected value
    let parsedReceivedValue = YAML.parse(yarrrmlEditorValue);
    let parsedExpectedValue = YAML.parse(expectedYarrrmlResponse);
    expect(parsedReceivedValue).toEqual(parsedExpectedValue);
  });

  it ('should display danger alert message when status=404', async function() {

    expect.assertions(1);

    // initialise mocked server's response for incorrect URL
    let incorrectUrl = '/get/nonexistent_yarrrml';
    xhrMock.get(incorrectUrl, {
      status: 404
    });

    // try to fetch remote YARRRML rules
    await matey.loadRemoteYarrrml(incorrectUrl);

    // check if danger alert appears
    checkDangerAlert();
  });
});

/**
 * Asserts whether there is exactly 1 danger alert element visible in the page.
 */
function checkDangerAlert() {
  let alerts = document.getElementsByClassName('alert-danger');
  expect(alerts.length).toBe(1);
}
