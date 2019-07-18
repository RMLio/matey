/*global $ */

// include all necessary dependencies

const $ = require('jquery');
require('popper.js');
require('bootstrap');
const ace = require('brace');

require('brace/theme/monokai');
require('brace/mode/yaml');
require('brace/mode/json');
require('brace/mode/text');


const yarrrml = require('@rmlio/yarrrml-parser/lib/yarrrml2rml');
const N3 = require('n3');
const $logger = require('beaver-logger');
const Persister = require('./persister');
const persister = new Persister();

const path = require('path');
const urify = require('urify');

const fs = require('fs');

const ttlRead = require('@graphy/content.ttl.read');
const ttlWrite = require('@graphy/content.ttl.write');
const rdfTree = require('@graphy/util.dataset.tree');

const handlebars = require('handlebars');

const quadsSorter = require('./quadssorter');

// read yaml prefixes from prefixes.json
const yamlPrefixes = JSON.parse(fs.readFileSync(__dirname + '/prefixes.json', 'utf8'));

// read Matey examples from examples.json
const mateyExamples = JSON.parse(fs.readFileSync(__dirname + '/examples.json', 'utf8'));

// import CSS style sheet
require('../assets/css/style.css');

$logger.init({

  // URI to post logs to
  uri: 'http://edutab.test.iminds.be:8989/api/log',

  // State name to post logs under
  initial_state_name: 'init',

  // Interval at which to automatically flush logs to the server
  flushInterval: 10 * 60 * 1000,

  // Interval at which to debounce $logger.flush calls
  debounceInterval: 10,

  // Limit on number of logs before auto-flush happens
  sizeLimit: 300,

  // Supress `console.log`s when `true`
  // Recommended for production usage
  silent: false,

  // Enable or disable heartbeats, which run on an interval
  heartbeat: true,

  // Heartbeat log interval
  heartbeatInterval: 5000,

  // Maximum number of sequential heartbeat logs
  heartbeatMaxThreshold: 50,

  // Monitors for event loop delays and triggers a toobusy event
  heartbeatTooBusy: false,

  // Event loop delay which triggers a toobusy event
  heartbeatTooBusyThreshold: 10000,

  // Log levels which trigger an auto-flush to the server
  autoLog: ['warn', 'error'],

  // Log window.onunload and window.beforeUnload events?
  logUnload: true,

  // Log unload synchronously, to guarantee the log gets through?
  logUnloadSync: false,

  // Log performance stats from the browser automatically?
  logPerformance: true
});

/**
 * Class for adding/manipulating Matey content in web page
 */
class Matey {

  /**
   * Initializes all of the Matey content in <div> element with given id
   * @param {String} id of <div> element into which HTML code with Matey content should be inserted
   * @param {Object} config object with user configuration
   */
  init(id, config) {

    // check if rmlMapperUrl is set in config
    if (config.rmlMapperUrl) {
      this.rmlMapperUrl = config.rmlMapperUrl;
    } else {
      throw new Error("No RMLMapper URL specified. Make sure the 'rmlMapperUrl' property is set in the configuration object.");
    }

    // read URIs for images needed in HTML body which will be inserted into template string
    let img22url = urify(path.join('assets/img', '22.png'));
    let img31url = urify(path.join('assets/img', '31.png'));

    // read HTML template from matey.html and insert image URIs
    let htmlSource = fs.readFileSync(__dirname + '/../assets/html/matey.html', 'utf8');
    let htmlTmpl = handlebars.compile(htmlSource);
    let html = htmlTmpl({
      img22url: img22url,
      img31url: img31url
    });

    // insert HTML content into page
    $("#" + id).html(html);

    // warn logger that page has been visited
    $logger.warn('page_visit');

    // initialize Input and Delete button for data editor
    this.$inputButtonDiv = $('#input-button-matey');
    this.$deleteButtonSpan = $('#data-source-delete-matey');

    this.$deleteButtonSpan.find('button').on('click', (e) => {
      e.stopPropagation();
      this.deleteDataEditor($(e.target).data('delete-editor-id'));
    });

    // initialize Ace Editors
    this.dataEditors = [];

    this.editor = ace.edit("editor-matey");
    this.editor.setTheme("ace/theme/monokai");
    this.editor.getSession().setMode("ace/mode/yaml");
    this.editor.setShowPrintMargin(false);
    this.editor.setFontSize(14);

    this.outputEditor = ace.edit("output-matey");
    this.outputEditor.setTheme("ace/theme/monokai");
    this.outputEditor.getSession().setMode("ace/mode/text");
    this.outputEditor.setShowPrintMargin(false);
    this.outputEditor.setReadOnly(true);
    this.outputEditor.setOption('selectionStyle', "line");
    this.outputEditor.setFontSize(14);

    this.rmlEditor = ace.edit("rml-matey");
    this.rmlEditor.setTheme("ace/theme/monokai");
    this.rmlEditor.getSession().setMode("ace/mode/text");
    this.rmlEditor.setShowPrintMargin(false);
    this.rmlEditor.setReadOnly(true);
    this.rmlEditor.setOption('selectionStyle', "line");
    this.rmlEditor.setFontSize(14);

    // bind buttons for generating LD and RML to corresponding functions
    document.getElementById("rml-btn-matey").onclick = this.toRML.bind(this);
    document.getElementById("ld-btn-matey").onclick = this.runMappingRemote.bind(this);

    // load examples into YARRRML and Data editors
    this.loadExamples('examples-matey', mateyExamples);
    let stored = persister.get('latestExample');

    if (stored) {
      doAlert('We found a previous edited state in our LocalStorage you used to successfully generate RDF! I hope you don\'t mind we loaded that one for you ;).', 'info', 10000);
      this.loadExample(stored);
    } else {
      this.loadExample(mateyExamples[0]);
    }

    // update layout
    let layout = persister.get('layout');

    if (layout) {
      this.updateLayout(layout);
    } else {
      this.updateLayout('3x1');
    }

    // bind layout updating buttons to their corresponding functions
    $('#layout-22-matey').click(() => {
      this.updateLayout('2x2');
    });

    $('#layout-31-matey').click(() => {
      this.updateLayout('3x1');
    });


    // bind button for creating new data source to corresponding function
    $('#data-create-matey').on('click', () => {
      let dataPath = prompt("Create a new data path", "source_" + this.dataEditors.length + '.csv');

      if (dataPath !== null) {
        // create a new, empty data editor and set it as the active one
        this.createAndOpenDataEditor(dataPath, '');
      }
    });

    // bind button for loading remote data source to corresponding function
    $('#data-load-matey').on('click', () => {
      let url = prompt("Enter data source URL");
      let dataPath = prompt("Create a new data path", "source_" + this.dataEditors.length + '.csv');

      if (url !== null && dataPath !== null) {
        this.loadRemoteDataSource(url, dataPath);
      }
    });

    // bind button for loading remote YARRRML rules to corresponding function
    $('#yarrrml-load-matey').on('click', () => {
      let url = prompt("Enter YARRRML rules URL");

      if (url !== null) {
        this.loadRemoteYARRRML(url);
      }
    });

    // bind download buttons to their corresponding functions
    $('#data-dl-matey').on('click', () => {
      let activeEditor = this.getActiveDataEditor();

      downloadString(activeEditor.editor.getValue(), activeEditor.type, activeEditor.path);
    });

    $('#yarrrml-dl-matey').on('click', () => {
      downloadString(this.editor.getValue(), 'text', 'yarrrml.yaml');
    });

    $('#turtle-dl-matey').on('click', () => {
      downloadString(this.outputEditor.getValue(), 'text/turtle', 'output.ttl');
    });

    $('#rml-dl-matey').on('click', () => {
      downloadString(this.rmlEditor.getValue(), 'text/turtle', 'output.rml.ttl');
    });
  }

  /**
   * Fetch a remote data source, and use it to create a new data editor. Returns a promise for fetched data source.
   * @param {String} url of the remote data source
   * @param {String} dataPath path that data source will have once it's loaded in
   * @returns {Promise} promise that the data source has been fetched.
   */
  loadRemoteDataSource(url, dataPath) {
    return loadRemoteAndExecute(url, dataValue => {
      this.createAndOpenDataEditor(dataPath, dataValue);
    })
  }

  /**
   * Fetch YARRRML rules from remote source and set YARRRML editor's value to them.
   * @param {String} url of remote rules
   * @returns {Promise} promise that the rules have been fetched
   */
  loadRemoteYARRRML(url) {
    return loadRemoteAndExecute(url, rules => {
      this.editor.setValue(rules);
    });
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
   *  Converts inserted YARRRML rules to RML rules and inserts it into RML editor. Will be called upon clicking
   *  "Generate RML" button.
   */
  toRML() {
    const yaml = this.editor.getValue();
    const y2r = new yarrrml();
    const quads = this.generateRML(y2r);

    if (quads) {

      quads.sort(quadsSorter);

      const writer = new N3.Writer({
        prefixes: {
          rr: 'http://www.w3.org/ns/r2rml#',
          rml: 'http://semweb.mmlab.be/ns/rml#',
          rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
          rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
          ql: 'http://semweb.mmlab.be/ns/ql#',
          map: y2r.baseIRI,
          ...this.getYamlPrefixes() // merge prefixes with user-defined prefixes in YARRRML rules
        }
      });

      writer.addQuads(quads);
      writer.end((error, result) => {
        prettifyRDF(result, prettyResult => {
          this.rmlEditor.setValue(prettyResult);
          $logger.warn('rml_generated', {yarrrml: yaml, rml: result});
          doAlert('RML mapping file updated!', 'success');
        });
      });
    }
  }

  /**
   *  Generates RDF quads based on input data and YARRRML rules and inserts them into 'Turtle/TriG' editor. Will be
   *  called upon clicking "Generate LD" button.
   */
  runMappingRemote() {
    const yaml = this.editor.getValue();
    const quads = this.generateRML();

    if (quads) {
      const output = [];

      const writer = new N3.Writer();
      writer.addQuads(quads);
      writer.end((err, rmlDoc) => {
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
        
        fetch(this.rmlMapperUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            rml: rmlDoc,
            sources
          })
        }).then(response => {
          return response.json();
        }).then(data => {
          const parser = new N3.Parser();
          const prefixes = this.getYamlPrefixes();
          const outWriter = new N3.Writer({format: 'turtle', prefixes});

          parser.parse(data.output, (err, quad) => {
            if (quad) {
              outWriter.addQuad(quad);
            } else {
              outWriter.end((err, outTtl) => {
                prettifyRDF(outTtl, prettyOutTtl => {
                  this.outputEditor.setValue(prettyOutTtl);
                  $logger.warn('ttl_generated', {output, ttl: data, yarrrml: yaml});
                  doAlert('Output updated!', 'success');

                  let persistData = [];

                  output.forEach(out => {
                    persistData.push({
                      path: out.path,
                      type: out.type,
                      value: out.data
                    })
                  });

                  persister.set('latestExample', {
                    label: 'latest',
                    icon: 'user',
                    yarrrml: yaml,
                    data: persistData
                  });
                });
              });
            }
          });
        }).catch(err => {
          $logger.error('yarrrml_invalid', {yarrrml: yaml});
          console.log(err);
          doAlert('Couldn\'t run the YARRRML, check the source.', 'danger');
        });
      });
    }
  };

  /**
   * Places the editors in a certain arrangement, specified by given layout
   * @param {String} layout: specifies the layout in which editors should be arranged
   */
  updateLayout(layout) {
    const inputDiv = $('#div-input-data-matey');
    const yarrrmlDiv = $('#div-yarrrml-matey');
    const outputDiv = $('#div-output-data-matey');
    const rmlDiv = $('#div-rml-matey');
    const btn22 = $('#layout-22-matey');
    const btn31 = $('#layout-31-matey');

    switch (layout) {
      case '2x2':
        //<div class="col-md-4" id="div-output-data-matey">
        inputDiv.attr('class', 'col-md-6');
        yarrrmlDiv.attr('class', 'col-md-6');
        outputDiv.attr('class', 'col-md-6');
        rmlDiv.attr('class', 'col-md-6');
        btn22.hide();
        btn31.show();
        persister.set('layout', '2x2');
        break;
      default:
        inputDiv.attr('class', 'col-md-4');
        yarrrmlDiv.attr('class', 'col-md-4');
        outputDiv.attr('class', 'col-md-4');
        rmlDiv.attr('class', 'col-md-12');
        btn22.show();
        btn31.hide();
        persister.set('layout', '3x1');
        break;
    }
  }

  /**
   * Creates and initializes a new Ace Editor session for the <div> element with the given id
   * @param {String} id identifier of editor element
   * @param {String} type which determines the mode of ace editor session
   * @param {String} value to be inserted into editor
   * @param {Number} selectValue: Determines cursor position after new value is set. `undefined` or 0 is selectAll, -1 is at the document start, and 1 is at the end
   * @returns {AceAjax.Editor} object corresponding to initialized editor HTML Element
   */
  createEditor(id, type = 'text', value = null, selectValue = null) {
    const dataEditor = ace.edit(id);

    dataEditor.setTheme("ace/theme/monokai");
    dataEditor.setShowPrintMargin(false);
    dataEditor.setFontSize(14);
    dataEditor.setValue(value, selectValue);
    require('brace/mode/' + type); // this is done to require types that are not required yet
    dataEditor.getSession().setMode("ace/mode/" + type);

    return dataEditor;
  }

  /**
   * Resets content of all editors
   */
  destroyEditors() {
    $('#data-matey').html('');
    $('#dropdown-data-chooser-matey').html('');
    this.dataEditors = [];
  }

  /**
   * Loads in given example into input editors
   * @param example to be loaded in
   * @param reset Determines the cursor position after example texts are inserted. If true, all text will
   *        be selected in both input editors. If false, the cursor will move to the top in both input editors.
   */
  loadExample(example, reset = false) {
    this.destroyEditors();
    let selectValue = reset ? null : -1;
    const yaml = example.yarrrml;
    this.editor.setValue(yaml, selectValue);
    this.editor.getSession().setMode("ace/mode/yaml");
    this.editor.setReadOnly(false);

    let dataParts = example.data;
    let firstEditor = null;

    dataParts.forEach((dataPart, index) => {
      let editor = this.createDataEditor(dataPart, index, selectValue);

      if (!firstEditor) {
        firstEditor = editor;
      }

      this.dataEditors.push(editor);
    });

    firstEditor.dropdownA.click();

    if (reset) {
      doAlert(`Reloaded the "${example.label}" example`, 'success');
    }
  }

  /**
   * Creates and initializes buttons that will load examples into input editors when pressed. All these buttons
   * are placed into the HTML element with the given id.
   * @param {String} id identifier to div element which will contain buttons to load examples
   * @param {Array} examples for which buttons must be made
   */
  loadExamples(id, examples) {
    let $el = $('#' + id);

    examples.forEach((example) => {
      let $button = $('<button type="button" class="btn btn-secondary">' + (example.icon ? '<span class="icon-' + example.icon + '"></span>&nbsp;' : '') + example.label + '</button>');
      $el.append($button);
      $button.on('click', () => {
        this.loadExample(example, true);
      })
    });
  }

  /**
   * Creates and initializes Ace Editor for input data
   * @param {Object} dataPart Object that contains value, type and path of data in data editor
   * @param {Integer} index Identifier for data editor element
   * @param selectValue Determines cursor position after new value is set. `undefined` or null is selectAll, -1 is at the document start, and 1 is at the end
   * @returns {{
     *   editor:    (AceAjax.Editor) object corresponding to initialized data editor HTML Element,
     *   path:      (String) file path of data source,
     *   type:      (String) type of data source (json or text),
     *   elem:      (jQuery|HTMLElement) element containing the ace editor,
     *   input:     (jQuery|HTMLElement) element containing button for data editor,
     *   dropdownA: (jQuery|HTMLElement) element containing dropdown for data editor,
     *   index:     (Integer) index that identifies data editor element
     * }}
   */
  createDataEditor(dataPart, index, selectValue = null) {
    let value = dataPart.value;

    if (dataPart.type === 'json') {
      try {
        value = JSON.stringify(JSON.parse(dataPart.value), null, '    ');
      } catch (e) {
        // Oh well, I tried
      }
    }

    let $dropdownA = $(`<a class="dropdown-item rounded-0" data-toggle="tab" id="dataeditor-link-${index}" href="#dataeditor-${index}">${dataPart.path}</a>`);
    $('#dropdown-data-chooser-matey').append($dropdownA);

    let $dataValue = $(`<div class="ace-editor tab-pane" data-matey-label="${dataPart.path}" id="dataeditor-${index}"><pre><code>${value}</code></pre></div>`);
    $('#data-matey').append($dataValue);

    let inputButton = $(`<span>Input: ${dataPart.path}</span>`);

    $dropdownA.on('click', e => {
      this.$inputButtonDiv.html(inputButton);
      this.updateDeleteButton(index);

      e.preventDefault();
      $dropdownA.tab('show');
    });

    return {
      editor: this.createEditor(`dataeditor-${index}`, dataPart.type, value, selectValue),
      path: dataPart.path,
      type: dataPart.type,
      elem: $dataValue,
      input: inputButton,
      dropdownA: $dropdownA,
      index
    };
  }

  /**
   * Create a new data editor with the given parameters and a new index, and set it as the active data editor in the page
   * @param {String} dataPath filepath for data source
   * @param {String} dataValue value of data source
   */
  createAndOpenDataEditor(dataPath, dataValue) {
    // extract the type from the given data path
    let extension = dataPath.split('.').pop();
    let type = extension === 'json' ? 'json' : 'text';

    //calculate new index
    let newIndex = this.dataEditors.length > 0 ? this.dataEditors[this.dataEditors.length - 1].index + 1 : 0;

    //create data editor and set it is the active one
    let dataEditor = this.createDataEditor({path: dataPath, type, value: dataValue}, newIndex);
    this.dataEditors.push(dataEditor);
    dataEditor.dropdownA.click();
  }

  /**
   * Updates the delete button for data editors. If there are no data editors, the button will be hidden, else
   * the button is shown and will store in it the id of the data editor that should be deleted when the button is pressed.
   * @param id of the data editor corresponding to the delete button
   */
  updateDeleteButton(id) {
    if (this.dataEditors.length === 0) {
      this.$deleteButtonSpan.hide();
    } else {
      this.$deleteButtonSpan.show();
      this.$deleteButtonSpan.find('button').data('delete-editor-id', id);
    }
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
      this.$inputButtonDiv.html('Input: data');
      this.updateDeleteButton(null);
    }
  }

  /**
   * @returns {Object} containing prefixes for YAML rules mapped on their full corresponding IRIs.
   */
  getYamlPrefixes() {
    const yaml = this.editor.getValue();
    let prefixes = {};

    prefixes.rdf = yamlPrefixes.rdf;

    Object.keys(yamlPrefixes).forEach(pre => {
      if (yaml.indexOf(`${pre}:`) >= 0) {
        prefixes[pre] = yamlPrefixes[pre];
      }
    });

    try {
      let json = YAML.parse(yaml);
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
   * @param {yarrrml} y2r object that is used to convert YARRRML into RML
   * @returns {Array} array containing generated RDF quads
   */
  generateRML(y2r = null) {
    const yaml = this.editor.getValue();

    if (!y2r) {
      y2r = new yarrrml();
    }

    try {
      // convert YARRRML rules to RDF quads and return them
      return y2r.convert(yaml);
    } catch (e) {
      $logger.error('yarrrml_invalid', {yarrrml: yaml});
      doAlert('Couldn\'t generate the RML mapping file, check the source.', 'danger');

      return null;
    }
  }

  /**
   @returns {String} text inside Turtle/TriG editor
   */
  getLD() {
    return this.outputEditor.getValue();
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
  getYARRRML() {
    return this.editor.getValue();
  }

  /**
   @returns {String} text inside input data editor
   */
  getData() {
    return this.editor.getValue();
  }
}

/**
 * Makes text with RDF triples prettier
 * @param {String} rdf unprettified RDF
 * @param {Function} callback function that gets called when stream has finished writing all triples
 * @returns {String} prettified RDF
 */
function prettifyRDF(rdf, callback) {
  let prettyRdf = '';
  ttlRead(rdf)
    .pipe(rdfTree())
    .pipe(ttlWrite())
    .on('data', data => prettyRdf += data)
    .on('end', () => callback(prettyRdf));
}

/**
 * Fetch a remote source with given URL asynchronously and return promise of fetched data
 * @param {String} url of remote source
 * @returns {Promise} promise containing fetched value if resolved
*/
function loadRemote(url) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  return new Promise((resolve, reject) => {
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        let responseText = xhr.responseText;
        if (xhr.status === 200) {
          resolve(responseText);
        } else {
          doAlert('Failed to load remote source.', 'danger');
          $logger.error(responseText);
          console.log(responseText);
          reject(responseText);
        }
      }
    };
    xhr.send();
  });
}

/**
 * Fetch some data from remote source, and execute callback if successful.
 * @param {String} url of remote source
 * @param {Function} callback function that gets called with fetched data is fetched was successful
 * @returns {Promise} promise that fetching has been executed.
 */
function loadRemoteAndExecute(url, callback) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await loadRemote(url);
      callback(data);
      resolve();
    } catch(e) {
      reject(e);
    }
  });
}

/**
 * Downloads the given text as a file with the given type and name.
 * @param {String} text string that serves as content for file
 * @param {String} fileType Specifies type of text for file. Can be 'json', 'text' or 'text/turtle'
 * @param {String} fileName name of file to be downloaded
 */
function downloadString(text, fileType, fileName) {
  let blob = new Blob([text], {type: fileType});
  let a = document.createElement('a');

  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(function () {
    URL.revokeObjectURL(a.href);
  }, 1500);
}

/**
 * Creates an HTML element for an alert message and displays is in the page for a certain time period
 * @param message the alert message to be displayed
 * @param type of alert
 * @param timeout how long alert has to stay open
 */
function doAlert(message, type = 'primary', timeout = 2000) {

  // read HTML template for alert element
  let htmlSource = fs.readFileSync(__dirname + '/../assets/html/alert.html', 'utf8');
  let htmlTmpl = handlebars.compile(htmlSource);
  let html = htmlTmpl({
    type: type,
    message: message
  });

  let $alert = $(html);

  $('#alerts-matey').append($alert);

  setTimeout(() => {
    $alert.alert('close');
  }, timeout);
}

module.exports = Matey;
