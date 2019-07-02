let stringfunctions = require('./stringfunctions.js');
const N3 = require("n3");

let functionTriples = `@prefix fno: <http://semweb.datasciencelab.be/ns/function#> .
@prefix lib: <http://example.com/library#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix anime: <http://users.ugent.be/~bjdmeest/function/anime.ttl#> .

@prefix : <http://example.com/idlab/functions/string/> .

########################
### String functions ###
########################

:toUpperCase a fno:Function ;
  fno:name "to Uppercase" ;
  rdfs:label "to Uppercase" ;
  dcterms:description "Returns the input with all letters in upper case." ;
  fno:expects ( :valueParam ) ;
  fno:output ( :stringOut ) ;
  lib:providedBy [
    lib:localLibrary "./stringfunctions.js";
    lib:class "StringFunctions";
    lib:method "toUpperCase"
  ].

:toLowerCase a fno:Function ;
  fno:name "to Lowercase" ;
  rdfs:label "to Lowercase" ;
  dcterms:description "Returns the input with all letters in lower case." ;
  fno:expects ( :valueParam ) ;
  fno:output ( :stringOut ) ;
  lib:providedBy [
    lib:localLibrary "./stringfunctions.js";
    lib:class "StringFunctions";
    lib:method "toLowerCase"
  ].

:valueParam a fno:Parameter ;
  fno:name "input value" ;
  rdfs:label "input value" ;
  fno:type xsd:string ;
  fno:predicate :valueParameter .

:stringOut a fno:Output ;
  fno:name "output string" ;
  rdfs:label "output string" ;
  fno:type xsd:string ;
  fno:predicate :stringOutput .
`;

function getFunctionDescriptions(cb) {
  const parser = new N3.Parser();
  let store = new N3.Store();

  parser.parse(functionTriples, (err, triple) => {
    if (triple) {
      store.addTriple(triple.subject, triple.predicate, triple.object);
    } else {
      cb(store);
    }
  });
}

module.exports = {
  getFunctionDescriptions,
  functionMap: {
    './stringfunctions.js': stringfunctions
  }
};
