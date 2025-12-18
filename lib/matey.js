import 'popper.js';
import 'bootstrap';
import 'brace';
import 'brace/theme/monokai';
import 'brace/mode/yaml';
import 'brace/mode/turtle';
import 'brace/mode/json';
import 'brace/mode/text';
import 'brace/mode/xml';
import { Writer, Parser } from "n3";

import Persister from "./util/persister";
import { prettifyRDF, loadRemote, writerEndAsync, parseRdfAsync, sortedEntries, convertRMLtoQuads } from "./util/util";
import logger from "./logger";
import Front from './front';
import EditorManager from './editor-manager';
import YarrrmlHandler from './yarrrml-handler';
import MapperHandler from './mapper-handler';
import '../assets/css/style.css';
import mateyExamples from './resources/examples.json';

const modes = ['YARRRML', 'RMLIO', 'RMLKGC'];

/**
 * Class for adding/manipulating Matey content in web page
 */
class Matey {

  constructor() {

    // read Matey examples from examples.json
    this.mateyExamples = mateyExamples;

    // create persister
    this.persister = new Persister();

    this.logger = logger;
    this.editorManager = new EditorManager(this);
    this.front = new Front(this);
    this.yarrrmlHandler = new YarrrmlHandler(this.front, this.logger);

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
      this.mapperHandler = this.mapperHandler || new MapperHandler(config.rmlMapperUrl, this.front, this.logger);
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
    
    // TODO: remove comments below (this is a hack for an early merge to master)
    // const storedMode = this.persister.get('mode');
    // if (storedMode && modes.includes(storedMode)) {
    //   this.setMode(storedMode);
    // } else {
    //   this.setMode('YARRRML');
    // }
    
    // TODO: remove the next line (this is a hack for an early merge to master)
    this.setMode('YARRRML');
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
        // TODO: remove comments below (this is a hack for an early merge to master)
        // this.front.doAlert(`We found a previous edited state in our LocalStorage you used to successfully generate RDF in mode ${this.mode}! I hope you don\'t mind we loaded that one for you ;).`, 'info', 10000);
        
        // TODO: remove the next line (this is a hack for an early merge to master)
        this.front.doAlert(`We found a previous edited state in our LocalStorage you used to successfully generate RDF! I hope you don\'t mind we loaded that one for you ;).`, 'info', 10000);
        
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
   *  @returns {Promise<String>} promise that resolves with the RML output if RML was successfully generated
   */
  async toRML() {
    try {
      const yaml = this.editorManager.getInputYARRRML();
      const rml = await this.yarrrmlHandler.convertYARRRMLtoRML(yaml);
      this.editorManager.createOutputEditor({path: 'mapping.rml.ttl', type: 'text', value: rml}, 'RML mapping', 0);
      this.logger.warn('rml_generated', {yarrrml: yaml, rml: rml});
      this.front.doAlert('RML mapping file updated!', 'success');
      return rml;
    } catch (err) {
      this.logger.error('rml_generation_error', err);
      this.front.doAlert('Could not generate RML rules.', 'danger', 3000);
    }
  }

  /**
   *  Generates RDF quads based on input data and YARRRML rules and inserts them into 'Turtle/TriG' editor.
   *  @returns {Promise<void>} promise that resolves if LD was successfully generated, and rejects otherwise
   */
  async runMappingRemote() {
    let yarrrmlInput = null;
    let rmlIoInput = null;
    let rmlKgcInput = null;
    let outputButtonTextSuffix;
    let quads;

    try {
      // Reset outputs
      this.editorManager.destroyOutputEditors();

      switch (this.mode) {
        case 'YARRRML':
        default:
          yarrrmlInput = this.editorManager.getInputYARRRML();
          outputButtonTextSuffix = "RDF output and RML rules";
          const rml = await this.toRML();
          quads = convertRMLtoQuads(rml);
          break;
        case 'RMLIO':
          rmlIoInput = this.editorManager.getInputRMLIO();
          outputButtonTextSuffix = "RDF output";
          quads = convertRMLtoQuads(rmlIoInput);
          break;
        case 'RMLKGC':
          rmlKgcInput = this.editorManager.getInputRMLKGC();
          outputButtonTextSuffix = "RDF output";
          quads = convertRMLtoQuads(rmlKgcInput);
          break;
      }
      if (!quads) {
        return;
      }

      // Serialize RML with N3.Writer
      const writer = new Writer();
      writer.addQuads(quads);

      let rmlDoc;
      try {
        rmlDoc = await writerEndAsync(writer);
      } catch (err) {
        this.logger.error("Something went wrong when converting with N3 writer.", err);
        return;
      }

      const sources = this.editorManager.getSources();
      const data = await this.mapperHandler.executeMapping(rmlDoc, sources, this.mode === 'RMLKGC' ? 'burp' : null);
      const output = this.editorManager.getOutput();

      // Handle single output
      if (typeof data.output === 'string') {
        const parser = new Parser();
        const prefixes = this.yarrrmlHandler.getYamlPrefixes(this.editorManager.getInputYARRRML());
        const outWriter = new Writer({ format: 'turtle', prefixes });

        let parsedQuads;
        try {
          parsedQuads = await parseRdfAsync(parser, data.output);
        } catch (err) {
          this.logger.error('rdf_parse_failed', err);
          return;
        }

        parsedQuads.forEach(q => outWriter.addQuad(q));

        let outTtl;
        try {
          outTtl = await writerEndAsync(outWriter);
        } catch (err) {
          this.logger.error('ttl_write_failed', err);
          return;
        }

        try {
          outTtl = await prettifyRDF(outTtl);
        } catch (e) {
          this.logger.error('prettify_failed', e);
        }

        const outputEditor = this.editorManager.createOutputEditor( { path: 'output', type: 'text', value: outTtl }, 'RDF output', 0);
        outputEditor.dropdownA.click();
        this.front.setOutputButtonDivText(`1 ${outputButtonTextSuffix}`);
        this.front.doAlert('Output updated!', 'success');

        const persistData = output.map(out => ({
          path: out.path,
          type: out.type,
          value: out.data
        }));

        this.persister.set(`latestExample${this.mode}`, {
          label: 'latest',
          icon: 'user',
          yarrrml: yarrrmlInput,
          rmlio: rmlIoInput,
          rmlkgc: rmlKgcInput,
          data: persistData
        });

        return;
      }

      // Handle multiple outputs
      const persistData = output.map(out => ({
        path: out.path,
        type: out.type,
        value: out.data
      }));

      this.persister.set(`latestExample${this.mode}`, {
        label: 'latest',
        icon: 'user',
        yarrrml: yarrrmlInput,
        rmlio: rmlIoInput,
        rmlkgc: rmlKgcInput,
        data: persistData
      });

      for (const [file, content] of sortedEntries(data.output)) {
        const outputEditor =
          this.editorManager.createOutputEditor( { path: file, type: 'text', value: content }, 'RDF output');
        if (content !== '') {
          outputEditor.dropdownA.click();
        }
      }

      this.front.setOutputButtonDivText(`${Object.keys(data.output).length} ${outputButtonTextSuffix.split('output').join('outputs')}`);
      this.front.doAlert('Output updated!', 'success');

    } catch (err) {
      switch (this.mode) {
        case 'RMLIO':
          this.logger.error('rmlio_invalid', { rmlio: rmlIoInput });
          break;
        case 'RMLKGC':
          this.logger.error('rmlkgc_invalid', { rmlkgc: rmlKgcInput });
          break;
        case 'YARRRML':
        default:
          this.logger.error('yarrrml_invalid', { yarrrml: yarrrmlInput });
      }

      this.logger.error('ld_generation_error', err);
      this.front.doAlert('Could not generate Linked Data.', 'danger', 3000);
    }
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
