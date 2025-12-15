'use strict';

// import YAML for parsing YARRRML outpuit
import { parse } from "yamljs";

// import mocked XMLHttpRequest
import xhrMock from 'xhr-mock';

// read expected JSON and YAML responses from files using Vite raw imports
const responseFiles = import.meta.glob('./correct_responses/*', { query: '?raw', import: 'default' });
const expectedJsonResponse = await responseFiles['./correct_responses/json-response.json']();
const expectedYarrrmlResponse = await responseFiles['./correct_responses/yarrrml-response.yaml']();

// replace the real XHR object with the mock XHR object, and clear all alert boxes before each test
beforeEach(() => {
  xhrMock.setup();

  const alerts = document.getElementsByClassName('alert');
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
    const correctUrl = '/get/existent_json';

    xhrMock.get(correctUrl, {
      status: 200,
      body: expectedJsonResponse
    });

    // let matey fetch remote data source and wait for it to be displayed in data editor
    await matey.loadRemoteDataSource(correctUrl, 'json-response.json.json');

    // retrieve value from active data editor
    const activeEditorValue = matey.getData();

    // check if parsed value equals parsed expected value
    const parsedReceivedValue = JSON.parse(activeEditorValue);
    const parsedExpectedValue = JSON.parse(expectedJsonResponse);
    expect(parsedReceivedValue).toEqual(parsedExpectedValue);
  });

  it('should display danger alert message when status=404', async function () {

    expect.assertions(1);

    // initialise mocked server's response for incorrect URL
    const incorrectUrl = '/get/nonexistent_json';

    xhrMock.get(incorrectUrl, {
      status: 404
    });

    // try to fetch remote data source
    await matey.loadRemoteDataSource(incorrectUrl, 'json-response.json.json');

    // check if danger alert appears
    const alerts = document.getElementsByClassName('alert-danger');
    expect(alerts.length).toBe(1);
  });
});

// tests for fetching remote YARRRML rules
describe('loadRemoteYarrrml()', function() {

  it('should display fetched rules in YARRRML editor when status=200', async function() {

    expect.assertions(1);

    // initialise mocked server's response for correct URL
    const correctUrl = '/get/existent_yarrrml';

    xhrMock.get(correctUrl, {
      status: 200,
      body: expectedYarrrmlResponse
    });

    // let matey fetch remote YARRRML rules and wait for them to be displayed in YARRRML editor
    await matey.loadRemoteYarrrml(correctUrl);

    // retrieve value from YARRRML editor
    const yarrrmlEditorValue = matey.getYARRRML();

    // check if parsed value equals parsed expected value
    const parsedReceivedValue = parse(yarrrmlEditorValue);
    const parsedExpectedValue = parse(expectedYarrrmlResponse);
    expect(parsedReceivedValue).toEqual(parsedExpectedValue);
  });

  it ('should display danger alert message when status=404', async function() {

    expect.assertions(1);

    // initialise mocked server's response for incorrect URL
    const incorrectUrl = '/get/nonexistent_yarrrml';
    xhrMock.get(incorrectUrl, {
      status: 404
    });

    // try to fetch remote YARRRML rules
    await matey.loadRemoteYarrrml(incorrectUrl);

    // check if danger alert appears
    const alerts = document.getElementsByClassName('alert-danger');
    expect(alerts.length).toBe(1);
  });
});
