const urify = require("urify");
const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");
const $ = require("jquery");
const {downloadString} = require("./util/util");

/**
 * Class for manipulating the Matey UI in the web page
 */

module.exports = class MateyFront {

  constructor(matey, persister, logger) {
    this.matey = matey;
    this.logger = logger;
    this.persister = persister;
  }

  init() {
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
    $("#" + this.matey.id).html(html);

    // initialize Input and Delete button for data editor
    this.$inputButtonDiv = $('#input-button-matey');
    this.$deleteButtonSpan = $('#data-source-delete-matey');

    this.$deleteButtonSpan.find('button').on('click', (e) => {
      e.stopPropagation();
      matey.deleteDataEditor($(e.target).data('delete-editor-id'));
    });


    // bind buttons for generating LD and RML to corresponding functions
    document.getElementById("rml-btn-matey").onclick = this.matey.toRML.bind(this.matey);
    document.getElementById("ld-btn-matey").onclick = this.matey.runMappingRemote.bind(this.matey);

    // update layout
    let layout = this.persister.get('layout');

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
      let dataPath = prompt("Create a new data path", "source_" + this.matey.dataEditors.length + '.csv');

      if (dataPath !== null) {
        // create a new, empty data editor and set it as the active one
        this.matey.createAndOpenDataEditor(dataPath, '');
      }
    });

    // bind button for loading remote data source to corresponding function
    $('#data-load-matey').on('click', () => {
      let url = prompt("Enter data source URL");
      let dataPath = prompt("Create a new data path", "source_" + this.matey.dataEditors.length + '.csv');

      if (url !== null && dataPath !== null) {
        this.matey.loadRemoteDataSource(url, dataPath);
      }
    });

    // bind button for loading remote YARRRML rules to corresponding function
    $('#yarrrml-load-matey').on('click', () => {
      let url = prompt("Enter YARRRML rules URL");

      if (url !== null) {
        this.matey.loadRemoteYarrrml(url);
      }
    });

    // bind download buttons to their corresponding functions
    $('#data-dl-matey').on('click', () => {
      let activeEditor = this.matey.getActiveDataEditor();

      downloadString(activeEditor.editor.getValue(), activeEditor.type, activeEditor.path);
    });

    $('#yarrrml-dl-matey').on('click', () => {
      downloadString(this.matey.editor.getValue(), 'text', 'yarrrml.yaml');
    });

    $('#turtle-dl-matey').on('click', () => {
      downloadString(this.matey.outputEditor.getValue(), 'text/turtle', 'output.ttl');
    });

    $('#rml-dl-matey').on('click', () => {
      downloadString(this.matey.rmlEditor.getValue(), 'text/turtle', 'output.rml.ttl');
    });
  }

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
        this.persister.set('layout', '2x2');
        break;
      default:
        inputDiv.attr('class', 'col-md-4');
        yarrrmlDiv.attr('class', 'col-md-4');
        outputDiv.attr('class', 'col-md-4');
        rmlDiv.attr('class', 'col-md-12');
        btn22.show();
        btn31.hide();
        this.persister.set('layout', '3x1');
        break;
    }
  }

  /**
   * Resets content of all editors
   */
  destroyEditors() {
    $('#data-matey').html('');
    $('#dropdown-data-chooser-matey').html('');
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
        this.matey.loadExample(example, true);
      })
    });
  }

  /**
   * Updates the delete button for data editors. If there are no data editors, the button will be hidden, else
   * the button is shown and will store in it the id of the data editor that should be deleted when the button is pressed.
   * @param id of the data editor corresponding to the delete button
   */
  updateDeleteButton(id) {
    if (this.matey.dataEditors.length === 0) {
      this.$deleteButtonSpan.hide();
    } else {
      this.$deleteButtonSpan.show();
      this.$deleteButtonSpan.find('button').data('delete-editor-id', id);
    }
  }

  /**
   * Creates the UI components for a new Ace Editor
   * @param {String} path Path of the data in data editor
   * @param {Integer} index Identifier for data editor element
   * * @param {String}  value of the data in data editor
   * @returns {{
   *   elem:      (jQuery|HTMLElement) element containing the ace editor,
   *   input:     (jQuery|HTMLElement) element containing button for data editor,
   *   dropdownA: (jQuery|HTMLElement) element containing dropdown for data editor,
   * }}
   */
  createDataEditor(path, index, value) {
    let $dropdownA = $(`<a class="dropdown-item rounded-0" data-toggle="tab" id="dataeditor-link-${index}" href="#dataeditor-${index}">${path}</a>`);
    $('#dropdown-data-chooser-matey').append($dropdownA);

    let $dataValue = $(`<div class="ace-editor tab-pane" data-matey-label="${path}" id="dataeditor-${index}"><pre><code>${value}</code></pre></div>`);
    $('#data-matey').append($dataValue);

    let inputButton = $(`<span>Input: ${path}</span>`);

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
   * @param index of data editor that must to be deleted
   */
  deleteDataEditor(index) {
    this.$inputButtonDiv.html('Input: data');
    this.updateDeleteButton(null);
  }

  /**
   * Creates an HTML element for an alert message and displays is in the page for a certain time period
   * @param message the alert message to be displayed
   * @param type of alert
   * @param timeout how long alert has to stay open
   */
   doAlert(message, type = 'primary', timeout = 2000) {

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
}