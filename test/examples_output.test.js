'use strict';

// import jquery
const $ = require('jquery');

// import matey
const matey = require('../');

// import File System
const fs = require('fs');

// load Matey examples for example output tests
const examples = require('../matey/global').examples;

// import RDF parser and isomorphic checker to compare generated outputs to expected ones
// without the order of triples being important
const N3 = require('n3');
const parser = new N3.Parser();
const isomorphic = require('rdf-isomorphic').isomorphic;

// import jsdom-worker to mock Worker object which doesn't work by default in Jest/jsdom
require('jsdom-worker');

// createObjectURL isn't available in Jest by default, so has to be mocked too
window.URL.createObjectURL = jest.fn();

// set up document body
$('body').html('<div id="test-editor"></div>');


// initialise matey editors
matey.init("test-editor");

// tests

describe('Examples Output Test', function() {

    describe('People (JSON)', function() {

        // load the 'People (JSON)' example
        matey.loadExample(examples[0]);

        it('Turtle/TriG has correct output', function(done) {
            testOutput('people_turtle.txt', true, done);
        });

        it('RML has correct output', function(done) {
            testOutput('people_rml.txt', false, done);
        });
    });

    describe('Advanced', function() {

        // load the 'Advanced' example
        matey.loadExample(examples[1]);

        it('Turtle/TriG has correct output', function(done) {
            testOutput('advanced_turtle.txt', true, done);
        });

        it('RML has correct output', function(done) {
            testOutput('advanced_rml.txt', false, done);
        });
    });


    describe('Facebook', function() {

        // load the 'Facebook' example
        matey.loadExample(examples[2]);

        it('Turtle/TriG has correct output', function(done) {
            testOutput('facebook_turtle.txt', true, done);
        });

        it('RML has correct output', function(done) {
            testOutput('facebook_rml.txt', false, done);
        });
    });

});

/**
 * Checks whether clicking the "Generate LD" or "Generate RML" button generates the correct output
 * in the corresponding editor
 * @param  {String} filename path to file where correct output is located
 * @param {Boolean} checkLD if true, the LD output is checked, otherwise the RML output will be checked
 * @param {Function} done callback that indicates test is finished when called
 */
function testOutput(filename, checkLD, done) {
    let buttonID = checkLD ? "#ld-btn" : "#btn";

    // click the button & wait 2 seconds for output to generate
    $(buttonID).trigger("click");

    setTimeout(function() {
        // retrieve generated output from editor
        let generated_output = checkLD ? matey.getLD() : matey.getRML();

        // read the correct output from the file
        let path = __dirname + "/correct_example_outputs/" + filename;
        let expected_output = fs.readFileSync(path, 'utf8');

        // convert the outputs to RDF quads
        let generated_quads = parser.parse(generated_output);
        let expected_quads = parser.parse(expected_output);

        // check if the expected quads are isomorphic to the generated quads
        expect(isomorphic(generated_quads, expected_quads)).toBe(true);

        // say that test is done
        done();
    }, 2000);
}