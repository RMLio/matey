'use strict';

// import mocked xhr
const MockXMLHttpRequest = require('mock-xmlhttprequest');

// import readFileSync from File System
const readFileSync = require('fs').readFileSync;

// read expected JSON and YAML responses from files
const expectedJsonResponse = readFileSync(__dirname + '/correct_responses/test.json', 'utf8');
const expectedYamlResponse = readFileSync(__dirname + '/correct_responses/test.yaml', 'utf8');

// tests
describe('Loading of remote data with HTTP GET', function () {

  let server;

  describe('into Data Editor', function () {

    // close server after each test
    afterEach(function () {
      server.remove();
    });

    it('displays data in data editor when status=200', async function () {

      // initialise mock server with expected JSON response for HTTP GET
      let correctUrl = '/get/json';
      server = MockXMLHttpRequest.newServer({
        get: [correctUrl, {
          body: expectedJsonResponse
        }]
      }).install();

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

      // initialise mock server with expected YAML response for HTTP GET
      let incorrectUrl = '/get/nonexistent_resource';
      server = MockXMLHttpRequest.newServer({
        get: [incorrectUrl, {
          status: 404,
        }]
      }).install();

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