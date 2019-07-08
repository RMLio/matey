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

let yarrrml = require('@rmlio/yarrrml-parser/lib/yarrrml2rml');
let N3 = require('n3');
let $logger = require('beaver-logger');
let Persister = require('./persister');
let persister = new Persister();
let _GLOBAL = require('./global');

let readFileSync = require('fs').readFileSync;

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


class Matey {

    init(id) {

        // add style sheets to page

        let path = require('path');
        let urify = require('urify');
        let style_uri = urify(path.join('assets', 'style.css'));

        $('head').append(`
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="${style_uri}">`
        );

        // read URIs for images needed in HTML body

        let img_22_uri = urify(path.join('assets/img', '22.png'));
        let img_31_uri = urify(path.join('assets/img', '31.png'));

        // read HTML content from assets/index.html and convert to template string

        let content = readFileSync(__dirname + '/../assets/index.html', 'utf8');
        let content_tmpl = eval("`" + content + "`");

        // insert HTML content into page
        $("#" + id).html(content_tmpl);

        $logger.warn('page_visit');

        this.dataEditors = [];
        this.$inputButtonDiv = $('#input-button');
        this.$deleteButtonSpan = $('#data-source-delete');

        this.$deleteButtonSpan.find('button').on('click', (e) => {
            e.stopPropagation();
            this.deleteDataEditor(null, $(e.target).data('delete-editor-id'));
        });

        // initialize Ace Editors

        this.editor = ace.edit("editor");
        this.editor.setTheme("ace/theme/monokai");
        this.editor.getSession().setMode("ace/mode/yaml");
        this.editor.setShowPrintMargin(false);
        this.editor.setFontSize(14);

        this.outputEditor = ace.edit("output");
        this.outputEditor.setTheme("ace/theme/monokai");
        this.outputEditor.getSession().setMode("ace/mode/text");
        this.outputEditor.setShowPrintMargin(false);
        this.outputEditor.setReadOnly(true);
        this.outputEditor.setOption('selectionStyle', "line");
        this.outputEditor.setFontSize(14);

        this.rmlEditor = ace.edit("rml");
        this.rmlEditor.setTheme("ace/theme/monokai");
        this.rmlEditor.getSession().setMode("ace/mode/text");
        this.rmlEditor.setShowPrintMargin(false);
        this.rmlEditor.setReadOnly(true);
        this.rmlEditor.setOption('selectionStyle', "line");
        this.rmlEditor.setFontSize(14);

        this.yaml = undefined;

        document.getElementById("btn").onclick = this.toRML.bind(this);
        document.getElementById("ld-btn").onclick = this.runMappingRemote.bind(this);

        this.loadExamples('examples', _GLOBAL.examples);
        let stored = persister.get('latestExample');
        if (stored) {
            this.doAlert('We found a previous edited state in our LocalStorage you used to successfully generate RDF! I hope you don\'t mind we loaded that one for you ;).', 'info', 10000);
            this.loadExample(stored);
        } else {
            this.loadExample(_GLOBAL.examples[0]);
        }

        let layout = persister.get('layout');
        if (layout) {
            this.updateLayout(layout);
        } else {
            this.updateLayout('3x1');
        }
        $('#layout-22').click(() => {
            this.updateLayout('2x2');
        });
        $('#layout-31').click(() => {
            this.updateLayout('3x1');
        });

        $('#data-create').on('click', () => {
            let dataPath = prompt("Create a new data path", "source_" + this.dataEditors.length + '.csv');
            if (dataPath === null) {
                return;
            }

            let extension = dataPath.split('.').pop();
            let type = 'text';
            switch (extension) {
                case 'json':
                    type = 'json';
                    break;
            }

            let newIndex = this.dataEditors.length > 0 ? this.dataEditors[this.dataEditors.length - 1].index + 1 : 0;
            let dataEditor = this.createDataEditor({path: dataPath, type, value: ''}, newIndex);
            this.dataEditors.push(dataEditor);
            dataEditor.dropdownA.click();
        });

        $('#data-dl').on('click', () => {
            let activeEditor = null;
            this.dataEditors.forEach(dataEditor => {
                if (dataEditor.elem.hasClass('active')) {
                    activeEditor = dataEditor;
                }
            });
            this.downloadString(activeEditor.editor.getValue(), activeEditor.type, activeEditor.path);
        });

        $('#yarrrml-dl').on('click', () => {
            this.downloadString(editor.getValue(), 'text', 'yarrrml.yaml');
        });

        $('#turtle-dl').on('click', () => {
            this.downloadString(this.outputEditor.getValue(), 'text/turtle', 'output.ttl');
        });

        $('#rml-dl').on('click', () => {
            this.downloadString(this.rmlEditor.getValue(), 'text/turtle', 'output.rml.ttl');
        });


    }

    toRML() {
        this.yaml = this.editor.getValue();
        const y2r = new yarrrml();
        const triples = this.generateRML(y2r);
        if (!triples) {
            return;
        }

        triples.sort((a, b) => {
            return a.subject.localeCompare(b.subject);
        });

        const writer = N3.Writer({
            prefixes: {
                rr: 'http://www.w3.org/ns/r2rml#',
                rml: 'http://semweb.mmlab.be/ns/rml#',
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                ql: 'http://semweb.mmlab.be/ns/ql#',
                map: y2r.baseIRI,
            }
        });

        writer.addTriples(triples);
        writer.end((error, result) => {
            this.rmlEditor.setValue(result);
            $logger.warn('rml_generated', {yarrrml: this.yaml, rml: result});
            this.doAlert('RML mapping file updated!', 'success');
        });
    }

    toYARRRML() {
        this.yaml = this.editor.setValue(this.yaml);
        this.editor.getSession().setMode("ace/mode/yaml");
        this.editor.setReadOnly(false);

        document.getElementById("btn").onclick = this.toRML.bind(this);
        document.getElementById("btn").innerHTML = 'Show RML';
    };

    runMappingRemote() {
        this.yaml = this.editor.getValue();
        const triples = this.generateRML();
        if (!triples) {
            return;
        }

        const output = [];

        const writer = N3.Writer();
        writer.addTriples(triples);
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
            fetch("http://tw06v069.ugent.be/rmlmapper/process", {
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
                parser.parse(data.output, (err, triple) => {
                    if (triple) {
                        outWriter.addTriple(triple);
                    } else {
                        outWriter.end((err, outTtl) => {
                            this.outputEditor.setValue(outTtl);
                            $logger.warn('ttl_generated', {output, ttl: data, yarrrml: this.yaml});
                            this.doAlert('Output updated!', 'success');

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
                                yarrrml: this.yaml,
                                data: persistData
                            });
                        });
                    }
                });
            }).catch(err => {
                $logger.error('yarrml_invalid', {yarrrml: this.yaml});
                console.log(err);
                this.doAlert('Couldn\'t run the YARRRML, check the source.', 'danger');
            });
        });
    };

    updateLayout(layout) {
        const inputDiv = $('#div-input-data');
        const yarrrmlDiv = $('#div-yarrrml');
        const outputDiv = $('#div-output-data');
        const rmlDiv = $('#div-rml');
        const btn22 = $('#layout-22');
        const btn31 = $('#layout-31');
        switch (layout) {
            case '2x2':
                //<div class="col-md-4" id="div-output-data">
                inputDiv.attr('class', 'col-md-6');
                yarrrmlDiv.attr('class', 'col-md-6');
                outputDiv.attr('class', 'col-md-6');
                rmlDiv.attr('class', 'col-md-6');
                btn22.hide();
                btn31.show();
                persister.set('layout', '2x2');
                return;
            default:
                inputDiv.attr('class', 'col-md-4');
                yarrrmlDiv.attr('class', 'col-md-4');
                outputDiv.attr('class', 'col-md-4');
                rmlDiv.attr('class', 'col-md-12');
                btn22.show();
                btn31.hide();
                persister.set('layout', '3x1');
                return;
        }
    }

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

    createEditor(id, type = 'text', value = null, selectValue = null) {
        const dataEditor = ace.edit(id);
        dataEditor.setTheme("ace/theme/monokai");
        dataEditor.setShowPrintMargin(false);
        dataEditor.setFontSize(14);
        dataEditor.setValue(value, selectValue);
        require('brace/mode/' + type); // this is done to require types that are not required yet
        dataEditor.getSession().setMode("ace/mode/" + type);
        dataEditor.setReadOnly(false);
        return dataEditor;
    }

    destroyEditors() {
        $('#data').html('');
        $('#dropdown-data-chooser').html('');
        this.dataEditors = [];
    }

    loadExample(example, reset = false) {
        this.destroyEditors();
        let selectValue = reset ? null : -1;
        this.yaml = example.yarrrml;
        this.editor.setValue(this.yaml, selectValue);
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
            this.doAlert(`Reloaded the "${example.label}" example`, 'success');
        }
    }

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
        $('#dropdown-data-chooser').append($dropdownA);
        let $dataValue = $(`<div class="ace-editor tab-pane" data-matey-label="${dataPart.path}" id="dataeditor-${index}"><pre><code>${value}</code></pre></div>`);
        $('#data').append($dataValue);
        let input = this.createInputButton(dataPart);
        $dropdownA.on('click', e => {
            this.$inputButtonDiv.html(input);
            this.updateDeleteButton(index);

            e.preventDefault();
            $dropdownA.tab('show');
        });

        return {
            editor: this.createEditor(`dataeditor-${index}`, dataPart.type, value, selectValue),
            path: dataPart.path,
            type: dataPart.type,
            elem: $dataValue,
            input: input,
            dropdownA: $dropdownA,
            index
        };
    }

    updateDeleteButton(id) {
        if (this.dataEditors.length === 0) {
            this.$deleteButtonSpan.hide();
        } else {
            this.$deleteButtonSpan.show();
            this.$deleteButtonSpan.find('button').data('delete-editor-id', id);
        }
    }

    createInputButton(dataPart, id) {
        return $(`<span>Input: ${dataPart.path}</span>`);
    }

    deleteDataEditor(dataPart, index) {
        this.dataEditors.forEach((dataEditor, myIndex) => {
            if (dataEditor.index === index) {
                dataEditor.elem.remove();
                dataEditor.dropdownA.remove();
                dataEditor.input.remove();
                this.dataEditors.splice(myIndex, 1);
                return;
            }
        });

        if (this.dataEditors.length > 0) {
            this.dataEditors[0].dropdownA.click();
        } else {
            this.$inputButtonDiv.html('Input: data');
            this.updateDeleteButton(null);
        }
    }

    getYamlPrefixes() {
        this.yaml = this.editor.getValue();
        let prefixes = {};

        prefixes.rdf = _GLOBAL.prefixes.rdf;

        Object.keys(_GLOBAL.prefixes).forEach(pre => {
            if (this.yaml.indexOf(`${pre}:`) >= 0) {
                prefixes[pre] = _GLOBAL.prefixes[pre];
            }
        });

        try {
            let json = YAML.parse(this.yaml);
            if (json.prefixes) {
                prefixes = Object.assign({}, prefixes, json.prefixes);
            }
        } catch (e) {
            // nothing
        }

        return prefixes;
    }

    generateRML(y2r = null) {
        this.yaml = this.editor.getValue();
        if (!y2r) {
            y2r = new yarrrml();
        }
        let quads;
        try {
            quads = y2r.convert(this.yaml);
        } catch (e) {
            $logger.error('yarrml_invalid', {yarrrml: this.yaml});
            this.doAlert('Couldn\'t generate the RML mapping file, check the source.', 'danger');
            return null;
        }

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

    doAlert(message, type = 'primary', timeout = 2000) {
        let $alert = $(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
${message}
  <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
</div>`
        );
        $('#alerts').append($alert);
        setTimeout(() => {
            $alert.alert('close');
        }, timeout);
    }

    downloadString(text, fileType, fileName) {
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
     Returns the content of the Linked Data editor
     */
    getLD() {
        return this.outputEditor.getValue();
    }

    /**
     Returns the content of the RML editor
     */
    getRML() {
        return this.rmlEditor.getValue();
    }

    /**
     Returns the content of the RML editor
     */
    getYARRRML() {
        return this.editor.getValue();
    }

    /**
     Returns the content of the Data editor
     */
    getData() {
        return this.editor.getValue();
    }
}

module.exports = new Matey();