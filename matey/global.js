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

module.exports = _GLOBAL;