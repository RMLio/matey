/*global $ */

let $ = require('jquery');
let popper = require('popper.js');
let bootstrap = require('bootstrap');
let ace = require('brace');

require('brace/theme/monokai');
require('brace/mode/yaml');
require('brace/mode/json');
require('brace/mode/text');


let yarrrml = require('@rmlio/yarrrml-parser/lib/yarrrml2rml');
let N3 = require('n3');
let $logger = require('beaver-logger');
let Persister = require('./persister');
let persister = new Persister();

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

let _GLOBAL = {};
_GLOBAL.prefixes = {
  "as": "https://www.w3.org/ns/activitystreams#",
  "dqv": "http://www.w3.org/ns/dqv#",
  "duv": "https://www.w3.org/TR/vocab-duv#",
  "cat": "http://www.w3.org/ns/dcat#",
  "qb": "http://purl.org/linked-data/cube#",
  "grddl": "http://www.w3.org/2003/g/data-view#",
  "ldp": "http://www.w3.org/ns/ldp#",
  "oa": "http://www.w3.org/ns/oa#",
  "ma": "http://www.w3.org/ns/ma-ont#",
  "owl": "http://www.w3.org/2002/07/owl#",
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "rdfa": "http://www.w3.org/ns/rdfa#",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "rif": "http://www.w3.org/2007/rif#",
  "rr": "http://www.w3.org/ns/r2rml#",
  "skos": "http://www.w3.org/2004/02/skos/core#",
  "skosxl": "http://www.w3.org/2008/05/skos-xl#",
  "wdr": "http://www.w3.org/2007/05/powder#",
  "void": "http://rdfs.org/ns/void#",
  "wdrs": "http://www.w3.org/2007/05/powder-s#",
  "xhv": "http://www.w3.org/1999/xhtml/vocab#",
  "xml": "http://www.w3.org/XML/1998/namespace",
  "xsd": "http://www.w3.org/2001/XMLSchema#",
  "prov": "http://www.w3.org/ns/prov#",
  "sd": "http://www.w3.org/ns/sparql-service-description#",
  "org": "http://www.w3.org/ns/org#",
  "gldp": "http://www.w3.org/ns/people#",
  "cnt": "http://www.w3.org/2008/content#",
  "dcat": "http://www.w3.org/ns/dcat#",
  "earl": "http://www.w3.org/ns/earl#",
  "ht": "http://www.w3.org/2006/http#",
  "ptr": "http://www.w3.org/2009/pointers#",
  "cc": "http://creativecommons.org/ns#",
  "ctag": "http://commontag.org/ns#",
  "dc": "http://purl.org/dc/terms/",
  "dc11": "http://purl.org/dc/elements/1.1/",
  "dcterms": "http://purl.org/dc/terms/",
  "foaf": "http://xmlns.com/foaf/0.1/",
  "gr": "http://purl.org/goodrelations/v1#",
  "ical": "http://www.w3.org/2002/12/cal/icaltzd#",
  "og": "http://ogp.me/ns#",
  "rev": "http://purl.org/stuff/rev#",
  "sioc": "http://rdfs.org/sioc/ns#",
  "v": "http://rdf.data-vocabulary.org/#",
  "vcard": "http://www.w3.org/2006/vcard/ns#",
  "schema": "http://schema.org/",
  "describedby": "http://www.w3.org/2007/05/powder-s#describedby",
  "license": "http://www.w3.org/1999/xhtml/vocab#license",
  "role": "http://www.w3.org/1999/xhtml/vocab#role",
  "ssn": "http://www.w3.org/ns/ssn/",
  "sosa": "http://www.w3.org/ns/sosa/",
  "time": "http://www.w3.org/2006/time#"
};
_GLOBAL.examples = [
  {
    label: 'People (JSON)',
    icon: 'user',
    yarrrml: `prefixes:
  ex: "http://example.com/"

mappings:
  person:
    sources:
      - [\'data.json~jsonpath\', \'$.persons[*]\']
    s: http://example.com/$(firstname)
    po:
      - [a, foaf:Person]
      - [ex:name, $(firstname)]`,
    data: [{
      path: 'data.json', type: 'json', value: `{
      "persons": [
        {"firstname": "John", "lastname": "Doe"},
        {"firstname": "Jane", "lastname": "Smith"},
        {"firstname": "Sarah", "lastname": "Bladinck"}
      ]
      }`
    }]
  },
  {
    label: 'Advanced',
    icon: 'cogs',
    yarrrml: `prefixes:
  ex: "http://example.com/"

mappings:
  person:
    sources:
      - ['persons.json~jsonpath', '$.persons[*]']
    s: http://example.com/person/$(firstname)
    po:
      - [a, foaf:Person]
      - [ex:name, $(firstname)]
      - p: ex:likes
        o:
         - mapping: movie
           condition:
            function: equal
            parameters:
              - [str1, $(movie)]
              - [str2, $(slug)]
  movie:
    sources:
      - ['movies.csv~csv']
    s: http://example.com/movie/$(slug)
    po:
      - [a, schema:Movie]
      - [schema:name, $(title)]
      - [ex:year, $(year)]
`,
    data: [{
      path: 'persons.json', type: 'json', value: `{
        "persons": [
          {
            "firstname": "John",
            "lastname": "Doe",
            "movie":"wam"
          },
          {
            "firstname": "Jane",
            "lastname": "Smith",
            "movie":"wam"
          },
          {
            "firstname": "Sarah",
            "lastname": "Bladinck",
            "movie":"fotr"
          }
        ]
      }`
    }, {
      path: 'movies.csv', type: 'text', value: `slug,title,year
sw,Star Wars,1977
fotr,The Fellowship of the Ring,2001
wam,We Are Marshall,2006`
    }]
  },
  {
    label: 'Facebook',
    icon: 'facebook',
    yarrrml: `prefixes:
  cocacola-fb: http://coca-cola.com/facebook/
  emit: http://coca-cola.com/emit/
  prov-said: http://semweb.datasciencelab.be/ns/prov-said/
  ov: http://open.vocab.org/terms/
  tsioc: http://rdfs.org/sioc/types#
  fabio: http://purl.org/spar/fabio/

base: http://example.com/base#

sources:
  api:
    access: data.json
    referenceFormulation: jsonpath
    iterator: "$.data[*]"

mappings:
  facebook_post:
    source:
      - api
    subject: cocacola-fb:$(id)
    predicateobjects:
      - [a, [prov:Entity, ov:MicroblogPost, schema:SocialMediaPosting, tsioc:MicroblogPost]]
      - [[prov:label, schema:articleBody], $(message)]
      - [schema:mainEntityOfPage, $(permalink_url), schema:URL]
      - [prov:wasAttributedTo, http://coca-cola.com/#me~iri]
      - predicate: prov:wasGeneratedBy
        object:
          mapping: emit
          condition:
            function: equal
            parameters:
              - [str1, $(id)]
              - [str2, $(id)]
  emit:
    source:
      - api
    subject: emit:$(id)
    predicateobjects:
      - [a, prov:Activity]
      - [prov:type, prov-said:EmitMessage~iri]
      - [prov:wasStartedBy, http://coca-cola.com/#me~iri]
      - [[prov:startedAtTime, prov:endedAtTime], $(created_time)]`,
    data: [
      {
        path: 'data.json',
        type: 'json',
        value: `{
  "data": [
    {
      "created_time": "2018-11-21T01:12:24+0000",
      "message": "What’s the one thing that never fails to make you smile? 😀 #RefreshTheFee",
      "id": "820882001277849_313056145953449",
      "permalink_url": "https://www.facebook.com/CocaColaUnitedStates/videos/313056145953449/"
    },
    {
      "created_time": "2018-11-13T01:03:11+0000",
      "message": "This #WorldKindnessDay, we’re spreading a little love and positivity. ➡️ to 😃. #RefreshTheFeed",
      "id": "820882001277849_2242864155746286",
      "permalink_url": "https://www.facebook.com/CocaColaUnitedStates/posts/2242864155746286"
    },
    {
      "created_time": "2018-11-13T01:02:00+0000",
      "message": "Spread kindness. Share the ❤️️. #WorldKindnessDay #RefreshTheFeed",
      "id": "820882001277849_2169022539814557",
      "permalink_url": "https://www.facebook.com/CocaColaUnitedStates/videos/2169022539814557/"
    }
  ]
}`
      }
    ]
  }
];

let editor = {};

editor.init = function (id) {

    // add style sheets to <head>

    let path = require('path');
    let urify = require('urify');
    let style_uri = urify(path.join('matey/assets', 'style.css'));

    $('head').prepend(`
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="${style_uri}">
    `);

    // add ace editors to <body>

    let img_22_uri = urify(path.join('matey/assets/img', '22.png'));
    let img_31_uri = urify(path.join('matey/assets/img', '31.png'));

    $("#" + id).html(`
      <div class="container">
        <a class="anchor" id="edit"></a>
        <div class="navbar navbar-expand-sm navbar-light bg-light">
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse">
                <div class="navbar-nav mr-auto">
                    <span class="navbar-text">Reload example:&nbsp;</span>
                    <div id="examples" class="btn-group" role="group"></div>
                </div>
                <span class="navbar-text">Actions:&nbsp;</span>
                <div id="buttons" class="btn-group" role="group">
                    <button id="btn" type="button" class="btn btn-primary">Generate RML</button>
                    <button id="ld-btn" type="button" class="btn btn-success">Generate LD</button>
                </div>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span class="navbar-text">Layout:&nbsp;</span>
                <div id="layout" style="opacity: 0.5">
                    <button id="layout-22" type="button" class="btn"><img src="${img_22_uri}" alt="Two by two layout"/></button>
                    <button id="layout-31" style="display: none" type="button" class="btn"><img src="${img_31_uri}"
                                                                                                alt="Three by one layout"/></button>
                </div>
            </div>
        </div>

        <div id="alert-container">
            <div style="padding: 5px">
                <div id="alerts"></div>
            </div>
        </div>
    </div>
    <div style="margin: 15px">
        <div class="row mb-3">
            <div class="col-md-4" id="div-input-data">
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle rounded-0" id="input-button"
                            style="background-color: #2F3129; border-width: 0" type="button"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Input: Data
                    </button>
                    <span id="data-source-delete">
                        <button class="btn btn-danger btn-sm" data-remove_id="' + id + '">&times;</button>
                    </span>
                    <div class="dropdown-menu rounded-0" aria-labelledby="dropdownMenuButton">
                        <div class="nav" id="dropdown-data-chooser">
                        </div>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item rounded-0" href="#" id="data-create">Create new source</a>
                        <a class="dropdown-item rounded-0" href="#" id="data-dl">Download</a>
                    </div>
                </div>
                <div id="data" class="tab-content">
                </div>
            </div>
            <div class="col-md-4" id="div-yarrrml">
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle rounded-0"
                            style="background-color: #2F3129; border-width: 0" type="button"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Input: YARRRML
                    </button>
                    <div class="dropdown-menu rounded-0" aria-labelledby="dropdownMenuButton">
                        <a class="dropdown-item rounded-0" href="#" id="yarrrml-dl">Download</a>
                    </div>
                </div>
                <div id="editor" class="ace-editor"><pre><code>prefixes:
  ex: "http://example.com/"

mappings:
  person:
   sources:
    - ['data.json~jsonpath', '$.persons[*]']
   s: http://example.com/$(firstname)
   po:
    - [a, foaf:Person]
    - [ex:name, $(firstname)]</code></pre>
                </div>
            </div>
            <div class="col-md-4" id="div-output-data">
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle rounded-0"
                            style="background-color: #2F3129; border-width: 0" type="button"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Output: Turtle/TriG
                    </button>
                    <div class="dropdown-menu rounded-0" aria-labelledby="dropdownMenuButton">
                        <a class="dropdown-item rounded-0" href="#" id="turtle-dl">Download</a>
                    </div>
                </div>
                <div id="output" class="ace-editor">
                    <pre><code></code></pre>
                </div>
            </div>
            <div class="col-md-12" style="min-height: 120px;" id="div-rml">
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle rounded-0"
                            style="background-color: #2F3129; border-width: 0" type="button"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Output: RML
                    </button>
                    <div class="dropdown-menu rounded-0" aria-labelledby="dropdownMenuButton">
                        <a class="dropdown-item rounded-0" href="#" id="rml-dl">Download</a>
                    </div>
                </div>
                <div id="rml" class="ace-editor">
                    <pre><code></code></pre>
                </div>
            </div>
        </div>
    </div>`
  );

  $logger.warn('page_visit');

  let dataEditors = [];
  let $inputButtonDiv = $('#input-button');
  let $deleteButtonSpan = $('#data-source-delete');

  $deleteButtonSpan.find('button').on('click', (e) => {
    e.stopPropagation();
    deleteDataEditor(null, $(e.target).data('delete-editor-id'));
  });

  const editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/yaml");
  editor.setShowPrintMargin(false);
  editor.setFontSize(14);

  const outputEditor = ace.edit("output");
  outputEditor.setTheme("ace/theme/monokai");
  outputEditor.getSession().setMode("ace/mode/text");
  outputEditor.setShowPrintMargin(false);
  outputEditor.setReadOnly(true);
  outputEditor.setOption('selectionStyle', "line");
  outputEditor.setFontSize(14);

  const rmlEditor = ace.edit("rml");
  rmlEditor.setTheme("ace/theme/monokai");
  rmlEditor.getSession().setMode("ace/mode/text");
  rmlEditor.setShowPrintMargin(false);
  rmlEditor.setReadOnly(true);
  rmlEditor.setOption('selectionStyle', "line");
  rmlEditor.setFontSize(14);

  let yaml;

  const toRML = function () {
    yaml = editor.getValue();
    const y2r = new yarrrml();
    const triples = generateRML(y2r);
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
      rmlEditor.setValue(result);
      $logger.warn('rml_generated', {yarrrml: yaml, rml: result});
      doAlert('RML mapping file updated!', 'success');
    });
  };

  const toYARRRML = function () {
    yaml = editor.setValue(yaml);
    editor.getSession().setMode("ace/mode/yaml");
    editor.setReadOnly(false);

    document.getElementById("btn").onclick = toRML;
    document.getElementById("btn").innerHTML = 'Show RML';
  };

  document.getElementById("btn").onclick = toRML;

  const runMappingRemote = () => {
    yaml = editor.getValue();
    const triples = generateRML();
    if (!triples) {
      return;
    }

    const output = [];

    const writer = N3.Writer();
    writer.addTriples(triples);
    writer.end((err, rmlDoc) => {
      const sources = {};
      dataEditors.forEach(dataEditor => {
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
        const prefixes = getYamlPrefixes();
        const outWriter = new N3.Writer({format: 'turtle', prefixes});
        parser.parse(data.output, function (err, triple) {
          if (triple) {
            outWriter.addTriple(triple);
          } else {
            outWriter.end((err, outTtl) => {
              outputEditor.setValue(outTtl);
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
          }
        });
      }).catch(err => {
        $logger.error('yarrml_invalid', {yarrrml: yaml});
        console.log(e);
        doAlert('Couldn\'t run the YARRRML, check the source.', 'danger');
      });
    });
  };

  document.getElementById("ld-btn").onclick = runMappingRemote;

  loadExamples('examples', _GLOBAL.examples);
  let stored = persister.get('latestExample');
  if (stored) {
    doAlert('We found a previous edited state in our LocalStorage you used to successfully generate RDF! I hope you don\'t mind we loaded that one for you ;).', 'info', 10000);
    loadExample(stored);
  } else {
    loadExample(_GLOBAL.examples[0]);
  }

  let layout = persister.get('layout');
  if (layout) {
    updateLayout(layout);
  } else {
    updateLayout('3x1');
  }
  $('#layout-22').click(() => {
    updateLayout('2x2');
  });
  $('#layout-31').click(() => {
    updateLayout('3x1');
  });

  $('#data-create').on('click', () => {
    let dataPath = prompt("Create a new data path", "source_" + dataEditors.length + '.csv');
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

    let newIndex = dataEditors.length > 0 ? dataEditors[dataEditors.length - 1].index + 1 : 0;
    let dataEditor = createDataEditor({path: dataPath, type, value: ''}, newIndex);
    dataEditors.push(dataEditor);
    dataEditor.dropdownA.click();
  });

  $('#data-dl').on('click', () => {
    let activeEditor = null;
    dataEditors.forEach(dataEditor => {
      if (dataEditor.elem.hasClass('active')) {
        activeEditor = dataEditor;
      }
    });
    downloadString(activeEditor.editor.getValue(), activeEditor.type, activeEditor.path);
  });

  $('#yarrrml-dl').on('click', () => {
    downloadString(editor.getValue(), 'text', 'yarrrml.yaml');
  });

  $('#turtle-dl').on('click', () => {
    downloadString(outputEditor.getValue(), 'text/turtle', 'output.ttl');
  });

  $('#rml-dl').on('click', () => {
    downloadString(rmlEditor.getValue(), 'text/turtle', 'output.rml.ttl');
  });

  function updateLayout(layout) {
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


  function loadExamples(id, examples) {
    let $el = $('#' + id);
    examples.forEach((example) => {
      let $button = $('<button type="button" class="btn btn-secondary">' + (example.icon ? '<span class="icon-' + example.icon + '"></span>&nbsp;' : '') + example.label + '</button>');
      $el.append($button);
      $button.on('click', function () {
        loadExample(example, true);
      })
    });
  }

  function createEditor(id, type = 'text', value = null, selectValue = null) {
    const dataEditor = ace.edit(id);
    dataEditor.setTheme("ace/theme/monokai");
    dataEditor.setShowPrintMargin(false);
    dataEditor.setFontSize(14);
    dataEditor.setValue(value, selectValue);
    require('brace/mode/' + type);
    dataEditor.getSession().setMode("ace/mode/" + type);
    dataEditor.setReadOnly(false);
    return dataEditor;
  }

  function destroyEditors() {
    $('#data').html('');
    $('#dropdown-data-chooser').html('');
    dataEditors = [];
  }

  function loadExample(example, reset = false) {
    destroyEditors();
    let selectValue = reset ? null : -1;
    yaml = example.yarrrml;
    editor.setValue(yaml, selectValue);
    editor.getSession().setMode("ace/mode/yaml");
    editor.setReadOnly(false);

    let dataParts = example.data;
    let firstEditor = null;
    dataParts.forEach((dataPart, index) => {
      let editor = createDataEditor(dataPart, index, selectValue);
      if (!firstEditor) {
        firstEditor = editor;
      }

      dataEditors.push(editor);
    });

    firstEditor.dropdownA.click();

    if (reset) {
      doAlert(`Reloaded the "${example.label}" example`, 'success');
    }
  }

  function createDataEditor(dataPart, index, selectValue = null) {
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
    let input = createInputButton(dataPart);
    $dropdownA.on('click', e => {
      $inputButtonDiv.html(input);
      updateDeleteButton(index);

      e.preventDefault();
      $dropdownA.tab('show');
    });

    return {
      editor: createEditor(`dataeditor-${index}`, dataPart.type, value, selectValue),
      path: dataPart.path,
      type: dataPart.type,
      elem: $dataValue,
      input: input,
      dropdownA: $dropdownA,
      index
    };
  }

  function updateDeleteButton(id) {
    if (dataEditors.length === 0) {
      $deleteButtonSpan.hide();
    } else {
      $deleteButtonSpan.show();
      $deleteButtonSpan.find('button').data('delete-editor-id', id);
    }
  }

  function createInputButton(dataPart, id) {
    return $(`<span>Input: ${dataPart.path}</span>`);
  }

  function deleteDataEditor(dataPart, index) {
    dataEditors.forEach((dataEditor, myIndex) => {
      if (dataEditor.index === index) {
        dataEditor.elem.remove();
        dataEditor.dropdownA.remove();
        dataEditor.input.remove();
        dataEditors.splice(myIndex, 1);
        return;
      }
    });

    if (dataEditors.length > 0) {
      dataEditors[0].dropdownA.click();
    } else {
      $inputButtonDiv.html('Input: data');
      updateDeleteButton(null);
    }
  }

  function getYamlPrefixes() {
    yaml = editor.getValue();
    let prefixes = {};

    prefixes.rdf = _GLOBAL.prefixes.rdf;

    Object.keys(_GLOBAL.prefixes).forEach(pre => {
      if (yaml.indexOf(`${pre}:`) >= 0) {
        prefixes[pre] = _GLOBAL.prefixes[pre];
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

  function generateRML(y2r = null) {
    yaml = editor.getValue();
    if (!y2r) {
      y2r = new yarrrml();
    }
    let quads;
    try {
      quads = y2r.convert(yaml);
    } catch (e) {
      $logger.error('yarrml_invalid', {yarrrml: yaml});
      doAlert('Couldn\'t generate the RML mapping file, check the source.', 'danger');
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

  function doAlert(message, type = 'primary', timeout = 2000) {
    let $alert = $(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
${message}
  <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
</div>`);
    $('#alerts').append($alert);
    setTimeout(() => {
      $alert.alert('close');
    }, timeout);
  }

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
};

module.exports = editor;
