// include all necessary dependencies
require('popper.js');
require('bootstrap');
const ace = require("brace");
require('brace/theme/monokai');
require('brace/mode/yaml');
require('brace/mode/json');
require('brace/mode/text');
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

    // matey frond
    this.front = new Front(this, this.persister, this.logger);
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

    // initialize Ace Editors
    this.dataEditors = [];
    this.outputEditors = [];

    this.editor = ace.edit("editor-matey");
    this.editor.setTheme("ace/theme/monokai");
    this.editor.getSession().setMode("ace/mode/yaml");
    this.editor.$blockScrolling = Infinity; // to remove annoying console warning
    this.editor.setShowPrintMargin(false);
    this.editor.setFontSize(14);

    this.outputEditor = ace.edit("output-matey");
    this.outputEditor.setTheme("ace/theme/monokai");
    this.outputEditor.getSession().setMode("ace/mode/text");
    this.outputEditor.$blockScrolling = Infinity; // to remove annoying console warning
    this.outputEditor.setShowPrintMargin(false);
    this.outputEditor.setReadOnly(true);
    this.outputEditor.setOption('selectionStyle', "line");
    this.outputEditor.setFontSize(14);

    this.rmlEditor = ace.edit("rml-matey");
    this.rmlEditor.setTheme("ace/theme/monokai");
    this.rmlEditor.getSession().setMode("ace/mode/text");
    this.rmlEditor.$blockScrolling = Infinity;
    this.rmlEditor.setShowPrintMargin(false);
    this.rmlEditor.setReadOnly(true);
    this.rmlEditor.setOption('selectionStyle', "line");
    this.rmlEditor.setFontSize(14);

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
        this.createAndOpenDataEditor(dataPath, dataValue);
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
        this.editor.setValue(rules);
      })
      .catch(e => {
        this.logger.error('yarrrml_loading_error', e);
        this.front.doAlert('Could not load remote YARRRML rules.', 'danger', 5000);
      })
  }

  /**
   * Returns the data editor that is currently active in the page.
   * @returns {Object} object that contains information about the active editor
   */
  getActiveDataEditor() {
    let activeEditor = null;

    this.dataEditors.forEach(dataEditor => {
      if (dataEditor.elem.hasClass('active')) {
        activeEditor = dataEditor;
      }
    });

    return activeEditor;
  }

  /**
   *  Converts inserted YARRRML rules to RML rules and inserts it into RML editor.
   *  @returns {Promise<void>} promise that resolves if RML was successfully generated, and rejects otherwise
   */
  toRML() {
    return new Promise((resolve, reject) => {
      try {
        const yaml = this.editor.getValue();
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
          this.rmlEditor.setValue(result);
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
      const yaml = this.editor.getValue();

      try {
        const quads = this.generateRMLQuads();

        if (!quads) {
          return;
        }

        const output = [];

        const writer = new N3.Writer();
        writer.addQuads(quads);

        writer.end((err, rmlDoc) => {
          if(err){
            this.logger.error("Something went wrong when converting with N3 writer.",err);
          }

          const sources = {};
          this.dataEditors.forEach(dataEditor => {
            const data = dataEditor.editor.getValue();
            sources[dataEditor.path] = data;
            output.push({
              path: dataEditor.path,
              data,
              type: dataEditor.type
            });
          });

          // Reset outputs
          this.destroyOutputEditors();

          // Execute mapping
          fetch(this.rmlMapperUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              rml: rmlDoc,
              sources
            })
          }).then(response => {
            return response.json();
          }).then(async data => {
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
                    const outputEditor = this.createOutputEditor({path: 'output', type: 'text', value: outTtl}, 0);
                    this.outputEditors.push(outputEditor);
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

                const newIndex = this.outputEditors.length > 0 ? this.outputEditors[this.outputEditors.length - 1].index + 1 : 0;

                const outputEditor = this.createOutputEditor({path: file, type: 'text', value: content}, newIndex);

                this.outputEditors.push(outputEditor);

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
          }).catch(err => {
            this.logger.error('yarrrml_invalid', {yarrrml: yaml});
            this.logger.error(err);
            this.front.doAlert('Couldn\'t run the YARRRML, check the source.', 'danger');
          });
        });
      } catch (err) {
        this.logger.error('ld_generation_error', err);
        this.front.doAlert('Could not generate Linked Data.', 'danger', 3000);
      }
    });
  };

  /**
   * Creates and initializes a new Ace Editor session for the <div> element with the given id
   * @param {String} id - identifier of editor element
   * @param {String} type - which determines the mode of ace editor session
   * @param {String} value - to be inserted into editor
   * @param {Number} selectValue - Determines cursor position after new value is set. `undefined` or 0 is selectAll, -1 is at the document start, and 1 is at the end
   * @param {Boolean} readOnly - Determines if the editor is editable
   * @returns {AceAjax.Editor} object corresponding to initialized editor HTML Element
   */
  createEditor(id, type = 'text', value = null, selectValue = null, readOnly = false) {
    const editor = ace.edit(id);
    editor.setTheme("ace/theme/monokai");
    editor.setShowPrintMargin(false);
    editor.setFontSize(14);
    editor.setValue(value, selectValue);
    editor.getSession().setMode("ace/mode/" + type);
    editor.setReadOnly(readOnly);
    editor.$blockScrolling = Infinity;
    return editor;
  }

  /**
   * Resets content of all editors
   */
  destroyDataEditors() {
    this.front.destroyDataEditors();
    this.dataEditors = [];
  }

  /**
   * Loads in given example into input editors
   * @param example - example to be loaded in
   * @param reset - Determines the cursor position after example texts are inserted. If true, all text will
   *        be selected in both input editors. If false, the cursor will move to the top in both input editors.
   */
  loadExample(example, reset = false) {
    this.destroyDataEditors();
    this.destroyOutputEditors();
    const selectValue = reset ? null : -1;
    const yaml = example.yarrrml;
    this.editor.setValue(yaml, selectValue);
    this.editor.getSession().setMode("ace/mode/yaml");
    this.editor.setReadOnly(false);

    const dataParts = example.data;
    let firstDateEditor = null;

    dataParts.forEach((dataPart, index) => {
      const dataEditor = this.createDataEditor(dataPart, index, selectValue);

      if (!firstDateEditor) {
        firstDateEditor = dataEditor;
      }

      this.dataEditors.push(dataEditor);
    });

    firstDateEditor.dropdownA.click();

    if (reset) {
      this.front.doAlert(`Reloaded the "${example.label}" example`, 'success');
    }
  }

  /**
   * Creates and initializes an abstract Ace Editor
   * @param {Object} dataPart - object that contains value, type and path of data in data editor
   * @param {number} index - identifier for data editor element
   * @param selectValue - determines cursor position after new value is set. `undefined` or null is selectAll, -1 is at the document start, and 1 is at the end
   * @param {String} prefix - prefix for he id's
   * @param {String} divId - id of the div to add the editor to
   * @param {String} dropdownId - id op the dropdown for the selector for this editor
   * @param {Boolean} readOnly - true if contents of editor should not be editable
   * @returns {{
   *   editor:    (AceAjax.Editor) object corresponding to initialized data editor HTML Element,
   *   path:      (String) file path of data source,
   *   type:      (String) type of data source (json or text),
   *   elem:      (jQuery|HTMLElement) element containing the ace editor,
   *   input:     (jQuery|HTMLElement) element containing button for data editor,
   *   dropdownA: (jQuery|HTMLElement) element containing dropdown for data editor,
   *   index:     (number) index that identifies data editor element
   * }}
   */
  createAbstractEditor(dataPart, index, selectValue = null, prefix, divId, dropdownId, readOnly = false) {
    return {
      ...this.front.createAbstractEditor(dataPart, index, selectValue, prefix, divId, dropdownId),
      editor: this.createEditor(`${prefix}-${index}`, dataPart.type, dataPart.value, selectValue, readOnly),
      path: dataPart.path,
      type: dataPart.type,
      index
    };
  }

  /**
   * Creates and initializes Ace Editor for input data
   * @param {Object} dataPart - object that contains value, type and path of data in data editor
   * @param {number} index - identifier for data editor element
   * @param selectValue - determines cursor position after new value is set. `undefined` or null is selectAll, -1 is at the document start, and 1 is at the end
   * @returns {{
   *   editor:    (AceAjax.Editor) object corresponding to initialized data editor HTML Element,
   *   path:      (String) file path of data source,
   *   type:      (String) type of data source (json or text),
   *   elem:      (jQuery|HTMLElement) element containing the ace editor,
   *   input:     (jQuery|HTMLElement) element containing button for data editor,
   *   dropdownA: (jQuery|HTMLElement) element containing dropdown for data editor,
   *   index:     (number) index that identifies data editor element
   * }}
   */
  createDataEditor(dataPart, index, selectValue = null) {

    const temp = {...dataPart};

    if (dataPart.type === 'json') {
      try {
        temp.value = JSON.stringify(JSON.parse(dataPart.value), null, '    ');
      } catch (e) {
        // Oh well, I tried
      }
    }

    return this.createAbstractEditor(temp, index, selectValue, 'dataeditor', 'data-matey', 'dropdown-data-chooser');
  }

  /**
   * Creates and initializes Ace Editor for output data
   * @param {Object} dataPart - object that contains value, type and path of data in data editor
   * @param {number} index - identifier for data editor element
   * @param selectValue - determines cursor position after new value is set. `undefined` or null is selectAll, -1 is at the document start, and 1 is at the end
   * @returns {{
   *   editor:    (AceAjax.Editor) object corresponding to initialized data editor HTML Element,
   *   path:      (String) file path of data source,
   *   type:      (String) type of data source (json or text),
   *   elem:      (jQuery|HTMLElement) element containing the ace editor,
   *   input:     (jQuery|HTMLElement) element containing button for data editor,
   *   dropdownA: (jQuery|HTMLElement) element containing dropdown for data editor,
   *   index:     (number) index that identifies data editor element
   * }}
   */
  createOutputEditor(dataPart, index, selectValue = null) {
    return this.createAbstractEditor(dataPart, index, selectValue, 'outputeditor', 'output-matey', 'dropdown-out-chooser-matey', true);
  }

  /**
   * Create a new data editor with the given parameters and a new index, and set it as the active data editor in the page
   * @param {String} dataPath - filepath for data source
   * @param {String} dataValue - value of data source
   */
  createAndOpenDataEditor(dataPath, dataValue) {
    // extract the type from the given data path
    const extension = dataPath.split('.').pop();
    const type = extension === 'json' ? 'json' : 'text';

    //calculate new index
    const newIndex = this.dataEditors.length > 0 ? this.dataEditors[this.dataEditors.length - 1].index + 1 : 0;

    //create data editor and set it is the active one
    const dataEditor = this.createDataEditor({path: dataPath, type, value: dataValue}, newIndex);
    this.dataEditors.push(dataEditor);
    dataEditor.dropdownA.click();
  }

  /**
   * Resets the data editor with the given index and removes it from the data editor array.
   * @param index of data editor that must to be deleted
   */
  deleteDataEditor(index) {
    this.dataEditors.forEach((dataEditor, myIndex) => {
      if (dataEditor.index === index) {
        dataEditor.elem.remove();
        dataEditor.dropdownA.remove();
        dataEditor.input.remove();
        this.dataEditors.splice(myIndex, 1);
      }
    });

    if (this.dataEditors.length > 0) {
      this.dataEditors[0].dropdownA.click();
    } else {
      this.front.deleteDataEditor();
    }
  }

  /**
   * @returns {Object} containing prefixes for YAML rules mapped on their full corresponding IRIs.
   */
  getYamlPrefixes() {
    const yaml = this.editor.getValue();
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
    const yaml = this.editor.getValue();
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
   * Destroys all the output editors
   */
  destroyOutputEditors() {
    this.front.destroyOutputEditors();
    this.outputEditors = [];
  }



  /**
   @returns {Array} text inside Turtle/TriG editors
   */
  getLD() {
    return this.outputEditors.map(editor => editor.editor.getValue());
  }

  /**
   @returns {String} text inside RML editor
   */
  getRML() {
    return this.rmlEditor.getValue();
  }

  /**
   @returns {String} text inside YARRRML editor
   */
  getYarrrml() {
    return this.editor.getValue();
  }

  /**
   @returns {String} text inside active data editor
   */
  getData() {
    return this.getActiveDataEditor().editor.getValue();
  }
}

module.exports = Matey;