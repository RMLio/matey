import { edit } from "brace";
// import monaco functionality from a separate module, so that it can be mocked in tests
import { createMonacoEditor } from "./monaco-adapter.js";
export default class EditorManager {
  constructor(matey) {
    this.matey = matey;
  }

  /**
   * Initialize the editors
   */
  init(mode) {
    this.dataEditors = [];
    this.outputEditors = [];

    this.inputEditorYARRRML = edit("editor-yarrrml-matey");
    this.inputEditorYARRRML.$blockScrolling = Infinity; // to remove annoying console warning
    this.inputEditorYARRRML.setTheme("ace/theme/monokai");
    this.inputEditorYARRRML.getSession().setMode("ace/mode/yaml");
    this.inputEditorYARRRML.setShowPrintMargin(false);
    this.inputEditorYARRRML.setFontSize(14);

    this.inputEditorRMLIO = createMonacoEditor(document.getElementById("editor-rmlio-matey"), {
      value: "",
      language: "rmlio",
      wordBasedSuggestions: 'currentDocument',
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: false }
    });

    this.inputEditorRMLKGC = createMonacoEditor(document.getElementById("editor-rmlkgc-matey"), {
      value: "",
      language: "rmlkgc",
      wordBasedSuggestions: 'currentDocument',
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: false }
    });
  }

  /**
   * Creates a basic ace editor
   * @param {String} id - id of <div> element into which the ace editor is to be created
   */
  createBasicAceEditor(id){
    const editor = edit(id);
    editor.$blockScrolling = Infinity; // to remove annoying console warning
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/text");
    editor.setShowPrintMargin(false);
    editor.setReadOnly(true);
    editor.setOption('selectionStyle', "line");
    editor.setFontSize(14);
    return editor;
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
   * Returns the ioutput editor that is currently active in the page.
   * @returns {Object} object that contains information about the active editor
   */
  getActiveOutputEditor() {
    let activeEditor = null;

    this.outputEditors.forEach(outputEditor => {
      if (outputEditor.elem.hasClass('active')) {
        activeEditor = outputEditor;
      }
    });

    return activeEditor;
  }

  /**
   * Returns the content of the input editor
   */
  getInputYARRRML(){
    return this.inputEditorYARRRML.getValue();
  }

  setInputYARRRML(input){
    return this.inputEditorYARRRML.setValue(input);
  }

  /**
   * Returns the content of the input editor (RMLIO)
   */
  getInputRMLIO() {
    return this.inputEditorRMLIO.getValue();
  }

  setInputRMLIO(input) {
    return this.inputEditorRMLIO.setValue(input);
  }

  /**
     * Returns the content of the input editor (RMLKGC)
     */
  getInputRMLKGC() {
    return this.inputEditorRMLKGC.getValue();
  }

  setInputRMLKGC(input) {
    return this.inputEditorRMLKGC.setValue(input);
  }

  /**
   @param {String} rml - text inside RML output editor
   */
  setRML(rml) {
    this.outputEditors.forEach(outputEditor => {
      if (outputEditor.elem.hasClass('rml-output')) {
        outputEditor.setValue(rml);
      }
    });
  }

  /**
   * Gets the output from the dataEditors
   * @return {Array} list of objects representing the output
   */
  getOutput(){
    let output = []
    this.dataEditors.forEach(dataEditor => {
      const data = dataEditor.editor.getValue();
      output.push({
        path: dataEditor.path,
        data,
        type: dataEditor.type
      });
    });
    return output;
  }

  /**
   * Gets the sources from the dataEditors
   * @return {Object} objects representing the sources
   */
  getSources(){
    let sources = {}
    this.dataEditors.forEach(dataEditor => {
      const data = dataEditor.editor.getValue();
      sources[dataEditor.path] = data;
    });
    return sources;
  }

  /**
   * Creates and initializes Ace Editor for output data
   * Will chose next free index if index is null
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
  createOutputEditor(dataPart, dataType, index=null, selectValue = null) {
    if(!index){
      index = this.outputEditors.length > 0 ? this.outputEditors[this.outputEditors.length - 1].index + 1 : 0;
    }
    const editor = this.createAbstractEditor(dataPart, dataType, index, selectValue, 'outputeditor', 'output-matey', 'dropdown-out-chooser-matey', true);
    this.outputEditors.push(editor);
    return editor;
  }

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
    const editor = edit(id);
    editor.$blockScrolling = Infinity; // to remove annoying console warning
    editor.setTheme("ace/theme/monokai");
    editor.setShowPrintMargin(false);
    editor.setFontSize(14);
    editor.setValue(value, selectValue);
    editor.getSession().setMode("ace/mode/" + type);
    editor.setReadOnly(readOnly);
    return editor;
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
  createAbstractEditor(dataPart, dataType, index, selectValue = null, prefix, divId, dropdownId, readOnly = false) {
    return {
      ...this.matey.front.createAbstractEditor(dataPart, dataType, index, selectValue, prefix, divId, dropdownId),
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

    return this.createAbstractEditor(temp, 'Source', index, selectValue, 'dataeditor', 'data-matey', 'dropdown-data-chooser-matey');
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
      this.matey.front.deleteDataEditor();
    }
  }

  /**
   * Resets content of all editors
   */
  destroyDataEditors() {
    this.matey.front.destroyDataEditors();
    this.dataEditors = [];
  }

  /**
   * Destroys all the output editors
   */
  destroyOutputEditors() {
    this.matey.front.destroyOutputEditors();
    this.outputEditors = [];
  }

  /**
   * Loads in given example into input editors
   * @param mode - mode in which Matey is running
   * @param example - example to be loaded in
   * @param reset - Determines the cursor position after example texts are inserted. If true, all text will
   *        be selected in both input editors. If false, the cursor will move to the top in both input editors.
   */
  loadExample(mode, example, reset = false) {
    this.destroyDataEditors();
    this.destroyOutputEditors();
    this.inputEditorYARRRML.setValue("");
    this.inputEditorRMLIO.setValue("");
    this.inputEditorRMLKGC.setValue("");

    function loadRulesEditor(mode, editor, content, reset) {
      if (content) {
        if (Array.isArray(content)) {
          content = content.join('\n'); // the content can be stored as an array of lines for simplicity in the examples file
        }
      } else {
        throw new Error(`this is not a valid ${mode} example`);
      }
      switch (mode) {
        case 'YARRRML':
        default:
          // this works for ace editors
          editor.setValue(content, reset ? null : -1);
          break;
        case 'RMLIO':
        case 'RMLKGC':
          // this works for monaco editors
          editor.setValue(content);
          if (reset) {
            const fullRange = editor.getModel().getFullModelRange();
            editor.setSelection(fullRange);
          } else {
            editor.setPosition({ lineNumber: 1, column: 1 });
          }
          break;
      }
    }

    switch (mode) {
      case 'YARRRML':
      default:
        loadRulesEditor(mode, this.inputEditorYARRRML, example.yarrrml, reset);
        break;
      case 'RMLIO':
        loadRulesEditor(mode, this.inputEditorRMLIO, example.rmlio, reset);
        break;
      case 'RMLKGC':
        loadRulesEditor(mode, this.inputEditorRMLKGC, example.rmlkgc, reset);
        break;
    }

    const selectValue = reset ? null : -1;

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
      this.matey.front.doAlert(`Reloaded the "${example.label}" example`, 'success');
    }
  }

  /**
   Clears all editors.
   */
  clearAll() {
    this.inputEditorYARRRML.setValue("");
    this.inputEditorRMLIO.setValue("");
    this.inputEditorRMLKGC.setValue("");
    this.destroyDataEditors();
    this.destroyOutputEditors();
  }

  /**
   @returns {Array} text inside Turtle/TriG editors
   */
  getLD() {
    return this.outputEditors.map(editor => editor.editor.getValue());
  }

  /**
   @returns {String} text inside YARRRML editor
   */
  getYARRRML() {
    return this.inputEditorYARRRML.getValue();
  }

  /**
   @returns {String} text inside RMLIO editor
   */
  getRMLIO() {
    return this.inputEditorRMLIO.getValue();
  }

  /**
   @returns {String} text inside RMLKGC editor
   */
  getRMLKGC() {
    return this.inputEditorRMLKGC.getValue();
  }

  /**
   @returns {String} text RML inside output
   */
  getRmlFromOutput() {
    this.outputEditors.forEach(outputEditor => {
      if (outputEditor.elem.hasClass('rml-output')) {
        return outputEditor.getValue(rml);
      }
    });
  }

  /**
   @returns {String} text inside active data editor
   */
  getData() {
    return this.getActiveDataEditor().editor.getValue();
  }

  /**
   @returns {number} get number of data editors
   */
  getNumberOfDataEditors() {
    return this.dataEditors.length;
  }
}
