'use strict';

// import File System
const fs = require('fs');

// import Matey examples for example output tests
const examples = JSON.parse(fs.readFileSync(__dirname + '/../../lib/resources/examples.json', 'utf8'));

// import sorting function for RDF quads
const quadsSorter = require('../../lib/sorters/quadssorter');

// import RDF parser
const N3 = require('n3');
const parser = new N3.Parser({ format: 'Turtle' });

// This is a hack to get jsdom execute the (new) function `structuredClone`
// https://github.com/jsdom/jsdom/issues/3363#issuecomment-1221060809
global.structuredClone = (val) => JSON.parse(JSON.stringify(val))

// runMappingRemote() tests
describe('runMappingRemote()', function() {

    it('should generate correct LD output for "Simple JSON source" example', async function() {
        matey.loadExample(examples[0]);
        await testOutput('people_ld.ttl', true);
    });

    it('should generate correct LD output for "Combination of a JSON and a CSV source" example', async function() {
        matey.loadExample(examples[1]);
        await testOutput('advanced_ld.ttl', true);
    });

    it('should generate correct LD output for "Facebook JSON data" example', async function() {
        matey.loadExample(examples[2]);
        await testOutput('facebook_ld.ttl', true);
    });

    it('should generate correct LD output for "YARRRML Targets for specifying output 1" example', async function() {
        matey.loadExample(examples[3]);
        await testOutput('target_ld_0.ttl', true, 0);
    });

    it('should generate correct LD output for "YARRRML Targets for specifying output 2" example', async function() {
        matey.loadExample(examples[3]);
        await testOutput('target_ld_1.ttl', true, 1);
    });
});

// toRML() tests
describe('toRML()', function() {

    it('should generate correct RML output for "Simple JSON source" example', async function() {
        matey.loadExample(examples[0]);
        await testOutput('people_rml.ttl', false);
    });

    it('should generate correct RML output for "Combination of a JSON and a CSV source" example', async function() {
        matey.loadExample(examples[1]);
        await testOutput('advanced_rml.ttl', false);
    });

    it('should generate correct RML output for "Facebook JSON" example', async function() {
        matey.loadExample(examples[2]);
        await testOutput('facebook_rml.ttl', false);
    });

    it('should generate correct RML output for "YARRRML Targets for specifying output" example', async function() {
        matey.loadExample(examples[3]);
        await testOutput('target_rml.ttl', false);
    });

    it('should generate correct RML output for "Basic LDES of sensor data" example', async function() {
        matey.loadExample(examples[5]);
        await testOutput('basic_ldes_1_rml.ttl', false);
    });

    it('should generate correct RML output for "Updated LDES of sensor data" example', async function() {
        matey.loadExample(examples[6]);
        await testOutput('basic_ldes_2_rml.ttl', false);
    });

});

/**
 * Asserts whether runMappingRemote() or toRML() generates the correct output in the corresponding editor
 * @param  {String} filename - path to file where correct output is located
 * @param {Boolean} checkLD - if true, the LD output is checked, otherwise the RML output will be checked
 * @param {Integer} index - index of the outputEditor
 */
async function testOutput(filename, checkLD, index=0) {

    // make sure the test knows how many assertions are expected
    expect.assertions(1);

    // perform generate LD/RML action on matey according to checkLD
    if (checkLD) {
        await matey.runMappingRemote();
    } else {
        await matey.toRML();
    }

    // retrieve generated output from editor
    const generatedOutput = checkLD ? matey.getLD()[index+1] : matey.getLD()[0]

    // read the correct output from the file
    const path = __dirname + "/correct_example_outputs/" + filename;
    const expectedOutput = fs.readFileSync(path, 'utf8');

    // convert the outputs to RDF quads
    const generatedQuads = parser.parse(generatedOutput);
    const expectedQuads = parser.parse(expectedOutput);

    // sort the quads arrays so they can be compared on equality without considering array order
    generatedQuads.sort(quadsSorter);
    expectedQuads.sort(quadsSorter);

    // check if the generated quads equal the expected quads
    expect(generatedQuads).toEqual(expectedQuads);
}
