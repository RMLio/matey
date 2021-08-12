// include all necessary dependencies
require('popper.js');
require('bootstrap');
const ace = require("brace");
require('brace/theme/monokai');
require('brace/mode/yaml');
require('brace/mode/json');
require('brace/mode/text');
require('brace/mode/xml');
const fs = require("fs");
const yarrrml = require("@rmlio/yarrrml-parser/lib/rml-generator");
const N3 = require("n3");
const Persister = require("./util/persister");

// import CSS style sheet
require('../assets/css/style.css');

// utilities
const {prettifyRDF, loadRemote} = require("./util/util");
const quadsSorter = require("./sorters/quadssorter");

// front
const Front = require('./front');

// EditorManager
const EditorManager = require('./editor-manager');

/**
 * Class for adding/manipulating Matey content in web page
 */
class Matey {

  constructor() {

    // read yaml prefixes from prefixes.json
    this.yamlPrefixes = JSON.parse(fs.readFileSync(__dirname + '/resources/prefixes.json', 'utf8'));

    // read Matey examples from examples.json
    this.mateyExamples = JSON.parse(fs.readFileSync(__dirname + '/resources/examples.json', 'utf8'));

    // create persister
    this.persister = new Persister();

    // create logger
    this.logger = require('./logger');

    // YARRML to RML convertor
    this.y2r = new yarrrml();

    // matey EditorManager
    this.editorManager = new EditorManager(this);

    // matey front
    this.front = new Front(this);

  }

  /**
   * Initializes all of the Matey content in <div> element with given id
   * @param {String} id - id of <div> element into which HTML code with Matey content should be inserted
   * @param {Object} config - object with user configuration
   */
  init(id, config) {

    this.id = id;

    // check if rmlMapperUrl is set in config
    if (config.rmlMapperUrl) {
      this.rmlMapperUrl = config.rmlMapperUrl;
    } else {
      throw new Error("No RMLMapper URL specified. Make sure the 'rmlMapperUrl' property is set in the configuration object.");
    }

    // warn logger that page has been visited
    this.logger.warn('page_visit');

    // initialize the front-end
    this.front.init()

    // initialize the EditorManager
    this.editorManager.init()

    // load examples into YARRRML and Data editors
    this.front.loadExamples('examples-matey', this.mateyExamples);
    const stored = this.persister.get('latestExample');

    if (stored) {
      this.front.doAlert('We found a previous edited state in our LocalStorage you used to successfully generate RDF! I hope you don\'t mind we loaded that one for you ;).', 'info', 10000);
      this.loadExample(stored);
    } else {
      this.loadExample(this.mateyExamples[0]);
    }
  }


  /**
   * Fetch a remote data source, and use it to create a new data editor. Displays alert if fetching fails.
   * @param {String} url - url of the remote data source
   * @param {String} dataPath - path that data source will have once it's loaded in
   * @returns {Promise<String>} promise that holds data source if fetch successful
   */
  loadRemoteDataSource(url, dataPath) {
    return loadRemote(url)
      .then(dataValue => {
        this.editorManager.createAndOpenDataEditor(dataPath, dataValue);
      })
      .catch(e => {
        this.logger.error('data_loading_error', e);
        this.front.doAlert('Could not load remote data source.', 'danger', 5000);
      })
  }

  /**
   * Fetch YARRRML rules from remote source and set YARRRML editor's value to them. Displays alert if fetching fails.
   * @param {String} url - url of remote rules
   * @returns {Promise<String>} promise that holds data source if fetch successful
   */
  loadRemoteYarrrml(url) {
    return loadRemote(url)
      .then(rules => {
        this.editorManager.setInput(rules);
      })
      .catch(e => {
        this.logger.error('yarrrml_loading_error', e);
        this.front.doAlert('Could not load remote YARRRML rules.', 'danger', 5000);
      })
  }

  /**
   *  Converts inserted YARRRML rules to RML rules and inserts it into RML editor.
   *  @returns {Promise<void>} promise that resolves if RML was successfully generated, and rejects otherwise
   */
  toRML() {
    return new Promise((resolve, reject) => {
      try {
        const yaml = this.editorManager.getInput();
        const y2r = new yarrrml();
        const quads = this.generateRMLQuads(y2r);
        if (!quads) {
          resolve();
        }

        quads.sort(quadsSorter);

        const writer = new N3.Writer({
          prefixes: {
            rr: 'http://www.w3.org/ns/r2rml#',
            rml: 'http://semweb.mmlab.be/ns/rml#',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
            ql: 'http://semweb.mmlab.be/ns/ql#',
            map: y2r.baseIRI,
            ...this.getYamlPrefixes()
          }
        });

        writer.addQuads(quads);
        writer.end(async (error, result) => {
          // try to prettify result
          try {
            result = await prettifyRDF(result);
          } catch (e) {
            this.logger.error('prettify_failed', e)
          }

          // set result as RML output
          this.editorManager.setRML(result);
          this.logger.warn('rml_generated', {yarrrml: yaml, rml: result});
          this.front.doAlert('RML mapping file updated!', 'success');

          // resolve promise
          resolve();

        });
      } catch (err) {
        this.logger.error('rml_generation_error', err);
        this.front.doAlert('Could not generate RML rules.', 'danger', 3000);
      }
    });
  }

  /**
   *  Generates RDF quads based on input data and YARRRML rules and inserts them into 'Turtle/TriG' editor.
   *  @returns {Promise<void>} promise that resolves if LD was successfully generated, and rejects otherwise
   */
  runMappingRemote() {
    return new Promise((resolve, reject) => {
      const yaml = this.editorManager.getInput();

      try {
        const quads = this.generateRMLQuads();

        if (!quads) {
          resolve();
        }

        let output = [];

        const writer = new N3.Writer();
        writer.addQuads(quads);

        writer.end(async (err, rmlDoc) => {
          if (err) {
            this.logger.error("Something went wrong when converting with N3 writer.", err);
          }

          output = this.editorManager.getOutput();
          const sources = this.editorManager.getSources();

          // Reset outputs
          this.editorManager.destroyOutputEditors();

          // Execute mapping
          const response = await fetch(this.rmlMapperUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              rml: rmlDoc,
              sources
            })
          })

          // retrieve JSON from response
          const data = await response.json();

          try {
            // One output (no targets)
            if (typeof data.output === 'string' || data.output instanceof String) {
              // parse the generated RDF and convert it to text
              const parser = new N3.Parser();
              const prefixes = this.getYamlPrefixes();
              const outWriter = new N3.Writer({format: 'turtle', prefixes});

              parser.parse(data.output, (err, quad) => {
                if (quad) {
                  outWriter.addQuad(quad);
                } else {
                  outWriter.end(async (err, outTtl) => {
                    // try to prettify RDF
                    try {
                      outTtl = await prettifyRDF(outTtl);
                    } catch (e) {
                      this.logger.error('prettify_failed', e);
                    }

                    // set result as Linked Data output
                    const outputEditor = this.editorManager.createOutputEditor({path: 'output', type: 'text', value: outTtl}, 0);

                    outputEditor.dropdownA.click();
                    this.front.setOutputButtonDivText('Output: Turtle/TriG');
                    this.logger.warn('ttl_generated', {output, ttl: data, yarrrml: yaml});
                    this.front.doAlert('Output updated!', 'success');

                    // persist data for later use
                    const persistData = [];


                    output.forEach(out => {
                      persistData.push({
                        path: out.path,
                        type: out.type,
                        value: out.data
                      })
                    });

                    this.persister.set('latestExample', {
                      label: 'latest',
                      icon: 'user',
                      yarrrml: yaml,
                      data: persistData
                    });

                    // Resolve promise
                    resolve();
                  });
                }
              });

              // Multiple outputs (targets)
            } else {

              const persistData = [];

              console.log(data);

              for (const [file, content] of Object.entries(data.output)) {

                output.forEach(out => {
                  persistData.push({
                    path: out.path,
                    type: out.type,
                    value: out.data
                  })
                });
                this.persister.set('latestExample', {
                  label: 'latest',
                  icon: 'user',
                  yarrrml: yaml,
                  data: persistData
                });

                const outputEditor = this.editorManager.createOutputEditor({path: file, type: 'text', value: content});

                // Do not focus on targets with no results
                if (content !== '') {
                  outputEditor.dropdownA.click();
                }
              }
              this.front.setOutputButtonDivText(`Output: ${Object.keys(data.output).length} targets`);
              this.front.doAlert('Output updated!', 'success');


              // Resolve promise
              resolve();
            }
          } catch (err) {
            this.logger.error('yarrrml_invalid', {yarrrml: yaml});
            this.logger.error(err);
            this.front.doAlert('Couldn\'t run the YARRRML, check the source.', 'danger');
          }
        });
      } catch (err) {
        this.logger.error('ld_generation_error', err);
        this.front.doAlert('Could not generate Linked Data.', 'danger', 3000);
      }
    });
  };

  /**
   * @returns {Object} containing prefixes for YAML rules mapped on their full corresponding IRIs.
   */
  getYamlPrefixes() {
    const yaml = this.editorManager.getInput();
    let prefixes = {};

    prefixes.rdf = this.yamlPrefixes.rdf;

    Object.keys(this.yamlPrefixes).forEach(pre => {
      if (yaml.indexOf(`${pre}:`) >= 0) {
        prefixes[pre] = this.yamlPrefixes[pre];
      }
    });

    try {
      const json = YAML.parse(yaml);
      if (json.prefixes) {
        prefixes = Object.assign({}, prefixes, json.prefixes);
      }
    } catch (e) {
      // nothing
    }

    return prefixes;
  }

  /**
   * Converts the rules from the YARRRML editor into RML rules, and returns the generated quads.
   * @param {yarrrml} y2r - object that is used to convert YARRRML into RML
   * @returns {Array} array containing generated RDF quads
   * @throws {ParseException} exception that gets thrown when input YARRRML is invalid
   */
  generateRMLQuads(y2r = null) {
    const yaml = this.editorManager.getInput();
    if (!y2r) {
      y2r = new yarrrml();
    }
    let quads;
    try {
      quads = y2r.convert(yaml);
    } catch (e) {
      this.logger.error('yarrml_invalid', {yarrrml: yaml});
      this.front.doAlert('Couldn\'t generate the RML mapping file, check the source.', 'danger');
      return null;
    }
    return quads;
  }

  /**
   * Converts the rules from the YARRRML editor into RML rules, and returns the generated triples.
   * @param {yarrrml} y2r - object that is used to convert YARRRML into RML
   * @returns {Array} array containing generated RDF quads
   * @throws {ParseException} exception that gets thrown when input YARRRML is invalid
   */
  generateRMLTriples(y2r = null){
    const quads = this.generateRMLQuads(y2r);
    const triples = [];
    quads.forEach(q => {
      triples.push({
        subject: q.subject.value,
        predicate: q.predicate.value,
        object: q.object.termType === 'Literal' ? `"${q.object.value}"` : q.object.value
      });
    });
    return triples;
  }



  /**
   @returns {Array} text inside Turtle/TriG editors
   */
  getLD() {
    return this.editorManager.getLD();
  }

  /**
   @returns {String} text inside RML editor
   */
  getRML() {
    return this.editorManager.getRML();
  }

  /**
   @returns {String} text inside YARRRML editor
   */
  getYarrrml() {
    return this.editorManager.getInput();
  }

  /**
   @returns {String} text inside active data editor
   */
  getData() {
    return this.editorManager.getData();
  }

  /**
   * Loads in given example into input editors
   * @param example - example to be loaded in
   * @param reset - Determines the cursor position after example texts are inserted. If true, all text will
   *        be selected in both input editors. If false, the cursor will move to the top in both input editors.
   */
  loadExample(example, reset = false) {
    this.editorManager.loadExample(example, reset);
  }
}

module.exports = Matey;