'use strict';

// import mocked XMLHttpRequest
const xhrMock = require('xhr-mock').default;

// import readFileSync from File System
const readFileSync = require('fs').readFileSync;

// read expected JSON and YAML responses from files
const expectedJsonResponse = readFileSync(__dirname + '/correct_responses/test.json', 'utf8');
const expectedYarrrmlResponse = readFileSync(__dirname + '/correct_responses/test.yaml', 'utf8');

// tests
describe('Loading of remote data with HTTP GET', function () {

  // replace the real XHR object with the mock XHR object before each test
  beforeEach(() => xhrMock.setup());

  // put the real XHR object back and clear the mocks, and remove all alert box elements after each test
  afterEach(() => {
    xhrMock.teardown();

    let alerts = document.getElementsByClassName('alert');

    while (alerts[0]) {
      alerts[0].parentNode.removeChild(alerts[0]);
    }
  });

  describe('with loadRemoteDataSource()', function () {

    it('displays fetched data source when status=200', async function () {

      expect.assertions(1);

      // initialise mocked server's response for correct URL
      let correctUrl = '/get/existent_json';

      xhrMock.get(correctUrl, {
        status: 200,
        body: expectedJsonResponse
      });

      // let matey fetch remote data source and wait for it to be displayed in data editor
      await matey.loadRemoteDataSource(correctUrl, 'test.json');

      // retrieve value from active data editor
      let activeEditorValue = matey.getActiveDataEditor().editor.getValue();

      // check if parsed value equals parsed expected value
      let parsedReceivedValue = JSON.parse(activeEditorValue);
      let parsedExpectedValue = JSON.parse(expectedJsonResponse);
      expect(parsedReceivedValue).toEqual(parsedExpectedValue);
    });

    it('causes exactly one (danger) alert when status=404', async function () {

      expect.assertions(2);

      // initialise mocked server's response for incorrect URL
      let incorrectUrl = '/get/nonexistent_json';
      xhrMock.get(incorrectUrl, {
        status: 404
      });

      // try to fetch remote data source
      await matey.loadRemoteDataSource(incorrectUrl, 'test.json');

      // check if danger alert appears, and if it is the only alert
      checkDangerAlert();
    });
  });

  describe('with loadRemoteYarrrml()', function() {

    it('displays fetched rules when status=200', async function() {

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

    it ('causes exactly one (danger) alert when status=404', async function() {

      expect.assertions(2);

      // initialise mocked server's response for incorrect URL
      let incorrectUrl = '/get/nonexistent_yarrrml';
      xhrMock.get(incorrectUrl, {
        status: 404
      });

      // try to fetch remote YARRRML rules
      await matey.loadRemoteYarrrml(incorrectUrl);

      // check if danger alert appears, and if it is the only alert
      checkDangerAlert();
    });

  });
});

/**
 * Asserts whether there is exactly one bootstrap danger alert present in the page.
 */
function checkDangerAlert() {
  // get array of alert elements from page
  let alerts = document.getElementsByClassName('alert');

  // do assertions
  expect(alerts.length).toBe(1);
  expect(alerts[0].classList).toContain('alert-danger');
}
