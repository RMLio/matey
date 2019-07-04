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
 * Returns the text inside the ace editor with the given id.
 * @param  {String} id of the editor element
 */
function getAceEditorText(id) {
    let lines = [];
    // iterate over divs that contain content lines of ace editor and add them to result
    let $line_divs = $("#" + id).find(".ace_scroller").find(".ace_content").find(".ace_text-layer").children();
    $line_divs.each(function(index, value) {
        let line = $(this).text();
        lines.push(line);
    });
    return lines.join("\n");
}

/**
 * Checks whether clicking the "Generate LD" button generates the correct output in the Turtle/TriG editor
 * @param  {String} filename: path to file where correct output is located
 * @param {Boolean} isLD: if true, the LD output is checked, otherwise the RML output will be checked
 * @param {Function} done: callback that indicates test is finished
 */
function testOutput(filename, isLD, done) {
    let buttonID = isLD ? "#ld-btn" : "#btn";
    let editorID = isLD ? "output" : "rml";
        // click the button & wait 2 seconds for output to generate
    $(buttonID).trigger("click");
    setTimeout(function() {
        let generated_output = getAceEditorText(editorID);
        // read the correct output from the file and check if it fits the generated output
        let path = "correct_example_outputs/" + filename;
        readFileContent(path, function(expected_output) {
            chai.assert.equal(generated_output.trim(), expected_output.trim());
            done();
        });
    }, 2000);
}


describe('Examples Output Test', function() {

    this.timeout(15000);

    describe('People (JSON)', function() {

        it('Turtle/TriG', function(done) {
            testOutput('people_turtle.txt', true, done);
        });

        it('RML', function(done) {
            testOutput('people_rml.txt', false, done);
        });
    });


});