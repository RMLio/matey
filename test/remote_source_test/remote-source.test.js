'use strict';

// import mocked XMLHttpRequest
const xhrMock = require('xhr-mock').default;

// import readFileSync from File System
const readFileSync = require('fs').readFileSync;

// read expected JSON and YAML responses from files
const expectedJsonResponse = readFileSync(__dirname + '/correct_responses/test.json', 'utf8');
const expectedYamlResponse = readFileSync(__dirname + '/correct_responses/test.yaml', 'utf8');

// tests
describe('Loading of remote data with HTTP GET', function () {

  // replace the real XHR object with the mock XHR object before each test
  beforeEach(() => xhrMock.setup());

  // put the real XHR object back and clear the mocks after each test
  afterEach(() => xhrMock.teardown());

  describe('into Data Editor', function () {

    it('displays data in data editor when status=200', async function () {

      // initialise mocked server's response for correct URL
      let correctUrl = '/get/json';

      xhrMock.get(correctUrl, {
        status: 200,
        body: expectedJsonResponse
      });

      // let matey fetch remote data source and wait for it to be displayed in data editor
      await matey.loadRemoteDataSource(correctUrl, 'test.json');

      // retrieve value from active data editor and parse it from JSON to object
      let activeEditorValue = matey.getActiveDataEditor().editor.getValue();
      let parsedGeneratedValue = JSON.parse(activeEditorValue);

      // check if parsed value equals parsed expected value
      let parsedExpectedValue = JSON.parse(expectedJsonResponse);
      expect(parsedGeneratedValue).toEqual(parsedExpectedValue);
    });

    it('shows exactly one danger alert when status=404', async function () {

      // initialise mocked server's response for incorrect URL
      let incorrectUrl = '/get/nonexistent_resource';
      xhrMock.get(incorrectUrl, {
        status: 404
      });

      // try to fetch remote data source
      await matey.loadRemoteDataSource(incorrectUrl, 'test.json');

      // check if alert indeed appears, and if it is the only alert
      let alerts = document.getElementsByClassName('alert');

      expect(alerts.length).toBe(1);
      expect(alerts[0].classList).toContain('alert-danger');
    });
  });

  describe('For YARRRML Editor', function() {

  });
});
