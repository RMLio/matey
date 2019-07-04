/*global $ */

// include all necessary dependencies

let $ = require('jquery');
require('popper.js');
require('bootstrap');
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

        // insert HTML body content into page

        let img_22_uri = urify(path.join('assets/img', '22.png'));
        let img_31_uri = urify(path.join('assets/img', '31.png'));

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
</div> 
       `);

        $logger.warn('page_visit');

        this.dataEditors = [];
        this.$inputButtonDiv = $('#input-button');
        this.$deleteButtonSpan = $('#data-source-delete');

        this.$deleteButtonSpan.find('button').on('click', (e) => {
            e.stopPropagation();
            deleteDataEditor(null, $(e.target).data('delete-editor-id'));
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

        this.yaml = null;


    }



}

module.exports = new Matey();