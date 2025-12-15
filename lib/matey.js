// include all necessary dependencies
import 'popper.js';
import 'bootstrap';
import 'brace';
import 'brace/theme/monokai';
import 'brace/mode/yaml';
import 'brace/mode/turtle';
import 'brace/mode/json';
import 'brace/mode/text';
import 'brace/mode/xml';
import yarrrml from "@rmlio/yarrrml-parser/lib/rml-generator";
import { Writer, Parser } from "n3";
import Persister from "./util/persister";
import logger from "./logger";

// import CSS style sheet
import '../assets/css/style.css';

// utilities
import { prettifyRDF, loadRemote } from "./util/util";
import quadsSorter from "./sorters/quadssorter";

// front
import Front from './front';

// EditorManager
import EditorManager from './editor-manager';

import yamlPrefixes from './resources/prefixes.json' assert { type: 'json' };
import mateyExamples from './resources/examples.json' assert { type: 'json' };

const modes = ['YARRRML', 'RMLIO', 'RMLKGC'];

/**
 * Class for adding/manipulating Matey content in web page
 */
class Matey {

  constructor() {

    // read yaml prefixes from prefixes.json
    this.yamlPrefixes = yamlPrefixes;

    // read Matey examples from examples.json
    this.mateyExamples = mateyExamples;

    // create persister
    this.persister = new Persister();

    // create logger
    this.logger = logger;

    // YARRML to RML convertor
    this.y2r = new yarrrml();

    // matey EditorManager
    this.editorManager = new EditorManager(this);

    // matey front
    this.front = new Front(this);

    // An identifier for stateful functions performed during RML mappings, e.g., LDES generation.
    // When invoked from a browser it is the timestamp of refreshing the page, so as long as
    // the user doesn't reload the page, this id remains the same and the state is not reset.
    this.functionStateId = new Date().getTime().toString();

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
    this.front.init();

    // initialize the EditorManager
    this.editorManager.init();

    // load modes into mode selector
    this.front.loadModes(modes);

    // activate the last stored mode or default to YARRRML
    const storedMode = this.persister.get('mode');
    if (storedMode && modes.includes(storedMode)) {
      this.setMode(storedMode);
    } else {
      this.setMode('YARRRML');
    }
  }

  /**
   * Adapts Matey to work in given mode
   * 
   * @param {String} mode - mode to be set
   */
  setMode(mode) {
    if (modes.includes(mode)) {
      if (this.mode === mode) {
        this.front.doAlert(`Mode ${mode} is active already...`, 'success');
        return;
      }
      this.mode = mode;
      this.suitableExamples = this.mateyExamples.filter(example => {
        return (mode === 'YARRRML' && example.yarrrml) || (mode === 'RMLIO' && example.rmlio) || (mode === 'RMLKGC' && example.rmlkgc);
      });
      this.front.setMode(mode);
      this.front.loadExamples(this.suitableExamples);
      // load the last stored example for the new mode, if any
      // otherwise load the first suitable example for the new mode
      const storedExample = this.persister.get(`latestExample${mode}`);
      if (storedExample) {
        this.front.doAlert(`We found a previous edited state in our LocalStorage you used to successfully generate RDF in mode ${this.mode}! I hope you don\'t mind we loaded that one for you ;).`, 'info', 10000);
        this.loadExample(storedExample);
        this.front.displayExample('');
        this.logger.info(`stored_example_loaded for mode ${mode}`);
      } else {
        const suitableExample = this.suitableExamples.length ? this.suitableExamples[0] : null;
        if (suitableExample) {
          this.loadExample(suitableExample);
          this.front.displayExample(suitableExample.label);
          this.logger.info(`suitable_example_loaded for mode ${mode}`);
        } else {
          this.logger.info(`no_suitable_example_loaded for mode ${mode}`);
        }
      }
      this.logger.info(`mode_switched: ${mode}`);
      this.persister.set('mode', mode);
    } else {
      this.front.doAlert(`Mode ${mode} is not supported!`, 'danger');
      this.logger.error(`mode_switch_failed: ${mode}`);
    }
  }

  /**
   * This function "clears" the state by assigning a new timestamp to `functionStateId`.
   * This way RMLMapper Web API uses a new (clean) state when calling `toRML()` the next time.
   */
  clearAll() {
    this.editorManager.clearAll();
    this.functionStateId = new Date().getTime().toString();
    this.front.doAlert('Everything cleared!', 'success');
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
        this.editorManager.setInputYARRRML(rules);
      })
      .catch(e => {
        this.logger.error('yarrrml_loading_error', e);
        this.front.doAlert('Could not load remote YARRRML rules.', 'danger', 5000);
      })
  }

  /**
   * Fetch RMLIO rules from remote source and set RMLIO editor's value to them. Displays alert if fetching fails.
   * @param {String} url - url of remote rules
   * @returns {Promise<String>} promise that holds data source if fetch successful
   */
  loadRemoteRmlIo(url) {
    return loadRemote(url)
      .then(rules => {
        this.editorManager.setInputRMLIO(rules);
      })
      .catch(e => {
        this.logger.error('rmlio_loading_error', e);
        this.front.doAlert('Could not load remote RMLIO rules.', 'danger', 5000);
      })
  }

  /**
   * Fetch RMLKGC rules from remote source and set RMLKGC editor's value to them. Displays alert if fetching fails.
   * @param {String} url - url of remote rules
   * @returns {Promise<String>} promise that holds data source if fetch successful
   */
  loadRemoteRmlKgc(url) {
    return loadRemote(url)
      .then(rules => {
        this.editorManager.setInputRMLKGC(rules);
      })
      .catch(e => {
        this.logger.error('rmlio_loading_error', e);
        this.front.doAlert('Could not load remote RMLKGC rules.', 'danger', 5000);
      })
  }

  /**
   *  Converts inserted YARRRML rules to RML rules and inserts it into RML editor.
   *  @returns {Promise<void>} promise that resolves if RML was successfully generated, and rejects otherwise
   */
  toRML() {
    return new Promise((resolve, reject) => {
      try {
        const yaml = this.editorManager.getInputYARRRML();
        const y2r = new yarrrml();
        const quads = this.generateRMLQuads(y2r);
        if (!quads) {
          resolve();
        }

        quads.sort(quadsSorter);

        const writer = new Writer({
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
          const outputEditor = this.editorManager.createOutputEditor({path: 'mapping.rml.ttl', type: 'text', value: result}, 'RML mapping', 0);
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
      try {
        let yarrrmlInput = null;
        let rmlIoInput = null;
        let rmlKgcInput = null;
        let outputButtonTextSuffix;
        let quads;

        switch (this.mode) {
          case 'YARRRML':
          default:
            yarrrmlInput = this.editorManager.getInputYARRRML();
            outputButtonTextSuffix = "RDF output and RML rules";
            this.toRML();
            quads = this.generateRMLQuads();
            break;
          case 'RMLIO':
            rmlIoInput = this.editorManager.getInputRMLIO();
            outputButtonTextSuffix = "RDF output";
            quads = this.convertRMLtoQuads(rmlIoInput);
            break;
          case 'RMLKGC':
            rmlKgcInput = this.editorManager.getInputRMLKGC();
            outputButtonTextSuffix = "RDF output";
            quads = this.convertRMLtoQuads(rmlKgcInput);
            break;
        }

        if (!quads) {
          resolve();
        }

        let output = [];

        const writer = new Writer();
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
          const body = {
            rml: rmlDoc,
            functionStateId: this.functionStateId,
            sources
          };

          if (this.mode === 'RMLKGC') {
            body.engine = 'burp';
          }
          let response;
          try {
            // we're still calling the rmlMapperUrl, but we assume that the endpoint supports mapping engines RMLMapper (default) and BURP (see body.engine)
            response = await fetch(this.rmlMapperUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(body)
            });
          } catch (e) {
            this.logger.error('mapper_post_failed', { error: e });
            this.front.doAlert(`POST to mapping engine failed. Is it online at ${this.rmlMapperUrl}?`, 'danger', 5000);
            resolve();
            return;
  
          }
          // retrieve JSON from response
          const status = response.status;
          if (!response.ok) {
            this.logger.error('mapper_response_not_ok', { status: response.status });
            this.front.doAlert('Mapping engine response not ok', 'danger', 5000);
            resolve();
            return;
          }
          let data;
          try {
            data = await response.json();
          } catch (e) {
            this.logger.error('mapper_response_not_json');
            this.front.doAlert('`Mapping engine response could not be decoded', 'danger', 5000);
            resolve();
            return;
          }
      	  this.logger.info(`rmlMapper response: ${JSON.stringify(data, null, 2)}`);

          try {
            // One output (no targets)
            if (typeof data.output === 'string' || data.output instanceof String) {
              // parse the generated RDF and convert it to text
              const parser = new Parser();
              const prefixes = this.getYamlPrefixes();
              const outWriter = new Writer({format: 'turtle', prefixes});

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
                    const outputEditor = this.editorManager.createOutputEditor({path: 'output', type: 'text', value: outTtl}, 'RDF output', 0);

                    outputEditor.dropdownA.click();
                    this.front.setOutputButtonDivText(`1 ${outputButtonTextSuffix}`);
                    this.logger.warn('ttl_generated', { output, ttl: data, yarrrml: yarrrmlInput, rmlio: rmlIoInput, rmlkgc: rmlKgcInput });
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

                    this.persister.set(`latestExample${this.mode}`, {
                      label: 'latest',
                      icon: 'user',
                      yarrrml: yarrrmlInput,
                      rmlio: rmlIoInput,
                      rmlkgc: rmlKgcInput,
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

              for (const [file, content] of Object.entries(data.output)) {

                output.forEach(out => {
                  persistData.push({
                    path: out.path,
                    type: out.type,
                    value: out.data
                  })
                });
                this.persister.set(`latestExample${this.mode}`, {
                  label: 'latest',
                  icon: 'user',
                  yarrrml: yarrrmlInput,
                  rmlio: rmlIoInput,
                  rmlkgc: rmlKgcInput,
                  data: persistData
                });

                const outputEditor = this.editorManager.createOutputEditor({path: file, type: 'text', value: content}, 'RDF output');

                // Do not focus on targets with no results
                if (content !== '') {
                  outputEditor.dropdownA.click();
                }
              }
              this.front.setOutputButtonDivText(`${Object.keys(data.output).length} ${outputButtonTextSuffix.split('output').join('outputs')}`);
              this.front.doAlert('Output updated!', 'success');


              // Resolve promise
              resolve();
            }
          } catch (err) {
            switch (this.mode) {
              case 'YARRRML':
              default:
                this.logger.error('yarrrml_invalid', { yarrrml: yarrrmlInput });
                break;
              case 'RMLIO':
                this.logger.error('rmlio_invalid', { rmlio: rmlIoInput });
                break;
              case 'RMLKGC':
                this.logger.error('rmlkgc_invalid', { rmlkgc: rmlKgcInput });
                break;
            }
            this.logger.error(err);
            this.front.doAlert('Couldn\'t run with this input, check the source.', 'danger');
            resolve();
          }
        });
      } catch (err) {
        this.logger.error('ld_generation_error', err);
        this.front.doAlert('Could not generate Linked Data.', 'danger', 3000);
        resolve();
      }
    });
  };

  /**
   * @returns {Object} containing prefixes for YAML rules mapped on their full corresponding IRIs.
   */
  getYamlPrefixes() {
    const yaml = this.editorManager.getInputYARRRML();
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
    const yaml = this.editorManager.getInputYARRRML();
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
   * Converts RML rules into quads.
   * @param {String} rmlInput - RML rules in Turtle format
   * @returns {Array} array containing generated RDF quads
   * @throws {ParseException} exception that gets thrown when input YARRRML is invalid
   */
  convertRMLtoQuads(rmlInput) {
    const parser = new Parser();
    return parser.parse(rmlInput);
  }


  /**
   @returns {Array} text inside Turtle/TriG editors
   */
  getLD() {
    return this.editorManager.getLD();
  }

  /**
   @returns {String} text inside RMLIO editor
   */
  getRMLIO() {
    return this.editorManager.getRMLIO();
  }

  /**
   @returns {String} text inside RMLKGC editor
   */
  getRMLKGC() {
    return this.editorManager.getRMLKGC();
  }

  /**
   @returns {String} text inside YARRRML editor
   */
  getYARRRML() {
    return this.editorManager.getInputYARRRML();
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
    this.editorManager.loadExample(this.mode, example, reset);
  }

  loadExampleByLabel(label, reset = false) {
    if (label) {
      const example = this.suitableExamples.find(ex => ex.label === label);
      if (example) {
        this.loadExample(example, reset);
      } else {
        this.front.doAlert(`Example with label ${label} not found for mode ${this.mode}!`, 'danger');
      }
    }
  }
}

export default Matey;
