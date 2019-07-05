const $ = require('jquery');
const matey = require('../');

// set up document body
$('body').html('<div id="test-editor"></div>');

matey.init("test-editor");

$("#ld-btn").trigger("click");

/**
   Asynchronously reads content of file and performs given callback when done
 * @param  {String} path to file that must be read
 * @param  {Function} callback that will be performed when file is read
 */
function readFileContent(path, callback) {
    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", path, false);
    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status === 0) {
                let text = rawFile.responseText;
                callback(text);
            }
        }
    };
    rawFile.send(null);
}

/**
 * Checks whether clicking the "Generate LD" button generates the correct output in the Turtle/TriG editor
 * @param  {String} filename: path to file where correct output is located
 * @param {Boolean} isLD: if true, the LD output is checked, otherwise the RML output will be checked
 * @param {Function} done: callback that indicates test is finished
 */
function testOutput(filename, isLD, done) {
    let buttonID = isLD ? "#ld-btn" : "#btn";
        // click the button & wait 2 seconds for output to generate
    $(buttonID).trigger("click");
    setTimeout(function() {
        let generated_output = isLD ? matey.getLD() : matey.getRML();
        // read the correct output from the file and check if it fits the generated output
        let path = "correct_example_outputs/" + filename;
        readFileContent(path, function(expected_output) {
            chai.assert.equal(generated_output, expected_output);
            done();
        });
    }, 2000);
}


describe('Examples Output Test', function() {

    describe('People (JSON)', function() {

        test('Turtle/TriG', function(done) {
            //testOutput('people_turtle.txt', true, done);
        });

        test('RML', function(done) {
            //testOutput('people_rml.txt', false, done);
        });
    });


});