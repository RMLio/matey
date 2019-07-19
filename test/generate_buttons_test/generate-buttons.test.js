'use strict';

// import File System
const fs = require('fs');

// import Matey examples for example output tests
const examples = JSON.parse(fs.readFileSync(__dirname + '/../../lib/examples.json', 'utf8'));

// import sorting function for RDF quads
const quadsSorter = require('../../lib/quadssorter');

// import RDF parser
const N3 = require('n3');
const parser = new N3.Parser({ format: 'Turtle' });

// "Generate LD" button tests
describe('Clicking "Generate LD" button', function() {

    it('should have correct LD output for "People (JSON)" example', function(done) {
        matey.loadExample(examples[0]);
        testOutput('people_ld.ttl', true, done);
    });

    it('should have correct LD output for "Advanced" example', function(done) {
        matey.loadExample(examples[1]);
        testOutput('advanced_ld.ttl', true, done);
    });

    it('should have correct LD output for "Facebook" example', function(done) {
        matey.loadExample(examples[2]);
        testOutput('facebook_ld.ttl', true, done);
    });

});

// "Generate RML" button tests
describe('Clicking "Generate RML" button', function() {

    it('should have correct RML output for "People (JSON)" example', function(done) {
        matey.loadExample(examples[0]);
        testOutput('people_rml.ttl', false, done);
    });

    it('should have correct RML output for "Advanced" example', function(done) {
        matey.loadExample(examples[1]);
        testOutput('advanced_rml.ttl', false, done);
    });

    it('should have correct RML output for "Facebook" example', function(done) {
        matey.loadExample(examples[2]);
        testOutput('facebook_rml.ttl', false, done);
    });

});

/**
 * Asserts whether clicking the "Generate LD" or "Generate RML" button generates the correct output
 * in the corresponding editor
 * @param  {String} filename path to file where correct output is located
 * @param {Boolean} checkLD if true, the LD output is checked, otherwise the RML output will be checked
 * @param {Function} done callback that indicates test is finished when called
 */
function testOutput(filename, checkLD, done) {

    let buttonID = checkLD ? "ld-btn-matey" : "rml-btn-matey";

    // the RML output generates a lot faster than the LD output, so for the LD tests we'll wait a bit longer
    let timeout = checkLD ? 1500 : 500;

    // click the button & wait timeout seconds for output to generate
    document.getElementById(buttonID).click();

    setTimeout(function() {
        // retrieve generated output from editor
        let generatedOutput = checkLD ? matey.getLD() : matey.getRML();

        // read the correct output from the file
        let path = __dirname + "/correct_example_outputs/" + filename;
        let expectedOutput = fs.readFileSync(path, 'utf8');

        // convert the outputs to RDF quads
        let generatedQuads = parser.parse(generatedOutput);
        let expectedQuads = parser.parse(expectedOutput);

        // sort the quads arrays so they can be compared on equality without considering array order
        generatedQuads.sort(quadsSorter);
        expectedQuads.sort(quadsSorter);

        // check if the generated quads equal the expected quads
        expect(generatedQuads).toEqual(expectedQuads);

        // say that test is done
        done();
    }, timeout);
}