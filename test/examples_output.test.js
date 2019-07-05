// import necessary modules
const $ = require('jquery');
const matey = require('../');
const fs = require('fs');
const examples = require('../matey/global').examples;
require('jsdom-worker');

// set up document body
$('body').html('<div id="test-editor"></div>');

window.URL.createObjectURL = jest.fn();

// initialise matey editors
matey.init("test-editor");

describe('Examples Output Test', function() {

    describe('People (JSON)', function() {

        // load the People (JSON) example
        matey.loadExample(examples[0]);

        it('Turtle/TriG has correct output', function(done) {
            testOutput('people_turtle.txt', true, done);
        });

        it('RML has correct output', function(done) {
            testOutput('people_rml.txt', false, done);
        });

    });

    describe('Advanced', function() {

        // load the Advanced example
        matey.loadExample(examples[1]);

        it('Turtle/TriG has correct output', function(done) {
            testOutput('advanced_turtle.txt', true, done);
        });

        it('RML has correct output', function(done) {
            testOutput('advanced_rml.txt', false, done);
        });

    });

    describe('Facebook', function() {

        // load the Facebook example
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
 * @param  {String} filename: path to file where correct output is located
 * @param {Boolean} checkLD: if true, the LD output is checked, otherwise the RML output will be checked
 * @param {Function} done: callback that, indicates test is finished when called
 */
function testOutput(filename, checkLD, done) {
    let buttonID = checkLD ? "#ld-btn" : "#btn";

    // click the button & wait 2 seconds for output to generate
    $(buttonID).trigger("click");

    // retrieve generated output from editor
    let generated_output = checkLD ? matey.getLD() : matey.getRML();

    // read the correct output from the file and check if it fits the generated output
    let path = __dirname + "/correct_example_outputs/" + filename;
    let expected_output = fs.readFileSync(path, 'utf8');
    expect(generated_output).toBe(expected_output);

    done();
}