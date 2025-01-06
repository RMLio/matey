const urify = require("urify");
const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");
const $ = require("jquery");
const {downloadString} = require("./util/util");

/**
 * Class for manipulating the Matey UI in the web page
 */

module.exports = class Front {

  constructor(matey) {
    this.matey = matey;
    this.persister = matey.persister;
  }

  /**
   * Initialize the UI for the data editor
   */
  init() {
    // read URIs for images needed in HTML body which will be inserted into template string
    const img22url = urify(path.join('assets/img', '22.png'));
    const img31url = urify(path.join('assets/img', '31.png'));

    // read HTML template from matey.html and insert image URIs
    const htmlSource = fs.readFileSync(__dirname + '/../assets/html/matey.html', 'utf8');
    const htmlTmpl = handlebars.compile(htmlSource);
    const html = htmlTmpl({
      img22url: img22url,
      img31url: img31url
    });

    // insert HTML content into page
    $("#" + this.matey.id).html(html);

    // initialize Input and Delete button for data editor
    this.$inputButtonDiv = $('#input-button-matey');
    this.$deleteButtonSpan = $('#data-source-delete-matey');

    // initialize output button
    this.$outputButtonDiv = $('#output-button-matey');

    this.$deleteButtonSpan.find('button').on('click', (e) => {
      e.stopPropagation();
      matey.editorManager.deleteDataEditor($(e.target).data('delete-editor-id'));
    });


    // bind buttons for generating LD and RML to corresponding functions
    document.getElementById("clear-btn-matey").onclick = this.matey.clearAll.bind(this.matey);

    // update layout
    const layout = this.persister.get('layout');

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
      const dataPath = prompt("Create a new data path", "source_" + this.matey.editorManager.getNumberOfDataEditors() + '.csv');

      if (dataPath !== null) {
        // create a new, empty data editor and set it as the active one
        this.matey.editorManager.createAndOpenDataEditor(dataPath, '');
      }
    });

    // bind button for loading remote data source to corresponding function
    $('#data-load-matey').on('click', () => {
      const url = prompt("Enter data source URL");
      const dataPath = prompt("Create a new data path", "source_" + this.matey.editorManager.getNumberOfDataEditors() + '.csv');

      if (url !== null && dataPath !== null) {
        this.matey.loadRemoteDataSource(url, dataPath);
      }
    });

    // bind button for loading remote YARRRML rules to corresponding function
    $('#yarrrml-load-matey').on('click', () => {
      const url = prompt("Enter YARRRML rules URL");

      if (url !== null) {
        this.matey.loadRemoteYarrrml(url);
      }
    });

    // bind download buttons to their corresponding functions
    $('#data-dl-matey').on('click', () => {
      const activeEditor = this.matey.editorManager.getActiveDataEditor();

      downloadString(activeEditor.editor.getValue(), activeEditor.type, activeEditor.path);
    });

    $('#yarrrml-dl-matey').on('click', () => {
      downloadString(this.matey.editorManager.getYARRRML(), 'text', 'yarrrml.yaml');
    });

    $('#turtle-dl-matey').on('click', () => {
      const activeEditor = this.matey.editorManager.getActiveOutputEditor();
      console.log(activeEditor)

      downloadString(activeEditor.editor.getValue(), 'text', activeEditor.path);
    });
  }

  /**
   * Places the editors in a certain arrangement, specified by given layout
   * @param {String} layout - specifies the layout in which editors should be arranged
   */
  updateLayout(layout) {
    const inputDiv = $('#div-input-data-matey');
    const yarrrmlDiv = $('#div-yarrrml-matey');
    const outputDiv = $('#div-output-data-matey');
    const btn22 = $('#layout-22-matey');
    const btn31 = $('#layout-31-matey');

    switch (layout) {
      case '2x2':
        //<div class="col-md-4" id="div-output-data-matey">
        inputDiv.attr('class', 'col-md-6');
        yarrrmlDiv.attr('class', 'col-md-6');
        outputDiv.attr('class', 'col-md-6');
        btn22.hide();
        btn31.show();
        this.persister.set('layout', '2x2');
        break;
      default:
        inputDiv.attr('class', 'col-md-4');
        yarrrmlDiv.attr('class', 'col-md-4');
        outputDiv.attr('class', 'col-md-4');
        btn22.show();
        btn31.hide();
        this.persister.set('layout', '3x1');
        break;
    }
  }

  /**
   * Creates and initializes buttons that will load examples into input editors when pressed. All these buttons
   * are placed into the HTML element with the given id.
   * @param {String} id - identifier to div element which will contain buttons to load examples
   * @param {Array} examples -  examples for which buttons must be made
   */
  loadExamples(id, examples) {
    const $el = $('#' + id);

    examples.forEach((example) => {
      const $button = $('<button type="button" class="btn btn-secondary">' + (example.icon ? '<span class="icon-' + example.icon + '"></span>&nbsp;' : '') + example.label + '</button>');
      $el.append($button);
      $button.on('click', () => {
        this.matey.loadExample(example, true);
      })
    });
  }

  /**
   * Updates the delete button for data editors. If there are no data editors, the button will be hidden, else
   * the button is shown and will store in it the id of the data editor that should be deleted when the button is pressed.
   * @param id - id of the data editor corresponding to the delete button
   */
  updateDeleteButton(id) {
    if (this.matey.editorManager.getNumberOfDataEditors() === 0) {
      this.$deleteButtonSpan.hide();
    } else {
      this.$deleteButtonSpan.show();
      this.$deleteButtonSpan.find('button').data('delete-editor-id', id);
    }
  }

  /**
   * Creates the UI components for a new Ace Editor
   * @param {String} path - path of the data in data editor
   * @param {number} index - identifier for data editor element
   * * @param {String}  value - of the data in data editor
   * @returns {{
   *   elem:      (jQuery|HTMLElement) element containing the ace editor,
   *   input:     (jQuery|HTMLElement) element containing button for data editor,
   *   dropdownA: (jQuery|HTMLElement) element containing dropdown for data editor,
   * }}
   */
  createDataEditor(path, index, value) {
    const $dropdownA = $(`<a class="dropdown-item rounded-0" data-toggle="tab" id="dataeditor-link-${index}" href="#dataeditor-${index}">${path}</a>`);
    $('#dropdown-data-chooser-matey').append($dropdownA);

    const $dataValue = $(`<div class="ace-editor tab-pane" data-matey-label="${path}" id="dataeditor-${index}"><pre><code>${value}</code></pre></div>`);
    $('#data-matey').append($dataValue);

    const inputButton = $(`<span>Input: ${path}</span>`);

    $dropdownA.on('click', e => {
      this.$inputButtonDiv.html(inputButton);
      this.updateDeleteButton(index);

      e.preventDefault();
      $dropdownA.tab('show');
    });

    return {
      elem: $dataValue,
      input: inputButton,
      dropdownA: $dropdownA,
    }
  }

  /**
   * Removes the data editor UI.
   * @param index - index of data editor that must to be deleted
   */
  deleteDataEditor(index) {
    this.$inputButtonDiv.html('Input: data');
    this.updateDeleteButton(null);
  }

  /**
   * Creates an HTML element for an alert message and displays is in the page for a certain time period
   * @param message - the alert message to be displayed
   * @param type - of alert
   * @param timeout - how long alert has to stay open
   */
  doAlert(message, type = 'primary', timeout = 2000) {

    // read HTML template for alert element
    const htmlSource = fs.readFileSync(__dirname + '/../assets/html/alert.html', 'utf8');
    const htmlTmpl = handlebars.compile(htmlSource);
    const html = htmlTmpl({
      type: type,
      message: message
    });

    const $alert = $(html);

    $('#alerts-matey').append($alert);

    setTimeout(() => {
      $alert.alert('close');
    }, timeout);
  }

  /**
   * Resets content of data editors
   */
  destroyDataEditors() {
    $('#data-matey').html('');
    $('#dropdown-data-chooser-matey').html('');
  }

  /**
   * Resets content of output editors
   */
  destroyOutputEditors() {
    this.$outputButtonDiv.text('Output: Knowledge Graph');
    $('#output-matey').html('');
    $('#dropdown-out-chooser-matey').html('');
  }

  /**
   * Set the text of the output button
   * @param {String} text - text to be placed in the button
   */
  setOutputButtonDivText(text) {
    this.$outputButtonDiv.text(text);
  }

  /**
   * Create an input button for a certain datasource
   * @param {Object} dataPart - object that contains path of the datasource
   * @returns {HTMLElement} HTML element containing the button.
   */
  createInputButton(dataPart) {
    return $(`<span>Input: ${dataPart.path}</span>`);
  }

  /**
   * Creates and initializes ui for an abstract ace editor
   * @param {Object} dataPart - object that contains value, type and path of data in data editor
   * @param {number} index - identifier for data editor element
   * @param selectValue - determines cursor position after new value is set. `undefined` or null is selectAll, -1 is at the document start, and 1 is at the end
   * @param {String} prefix - prefix for he id's
   * @param {String} divId - id of the div to add the editor to
   * @param {String} dropdownId - id op the dropdown for the selector for this editor
   * @returns {{
   *   elem:      (jQuery|HTMLElement) element containing the ace editor,
   *   input:     (jQuery|HTMLElement) element containing button for data editor,
   *   dropdownA: (jQuery|HTMLElement) element containing dropdown for data editor,
   * }}
   */
  createAbstractEditor(dataPart, index, selectValue = null, prefix, divId, dropdownId) {
    const $dropdownA = $(`<a class="dropdown-item rounded-0" data-toggle="tab" id="${prefix}-link-${index}" href="#${prefix}-${index}">${dataPart.path}</a>`);
    $(`#${dropdownId}`).append($dropdownA);
    const $dataValue = $(`<div class="ace-editor tab-pane" data-matey-label="${dataPart.path}" id="${prefix}-${index}"><pre><code>${dataPart.value}</code></pre></div>`);
    $(`#${divId}`).append($dataValue);
    const input = this.createInputButton(dataPart);

    $dropdownA.on('click', e => {
      this.updateDeleteButton(index);
      e.preventDefault();
      $dropdownA.tab('show');
    });

    return {
      elem: $dataValue,
      input,
      dropdownA: $dropdownA,
    }
  }
}
