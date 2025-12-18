import yarrrml from "@rmlio/yarrrml-parser/lib/rml-generator";
import { Writer } from "n3";

import { prettifyRDF } from "./util/util";
import quadsSorter from "./sorters/quadssorter";

import yamlPrefixes from './resources/prefixes.json';

/**
 * Class for handling the conversion from YARRRML to RML
 */
class YarrrmlHandler {

  /**
   * Constructor
   * @param {Front} front 
   * @param {Logger} logger 
   */
  constructor(front, logger) {
    this.front = front;
    this.logger = logger;
    this.yamlPrefixes = yamlPrefixes;
  }

  /**
   * Converts inserted YARRRML rules to RML rules.
   * @param {String} yaml - YARRRML rules in YAML format
   * @returns {Promise<String>} promise that resolves if RML was successfully generated, and rejects otherwise
   */
  convertYARRRMLtoRML(yaml) {
    return new Promise((resolve, reject) => {
      try {
        const y2r = new yarrrml();
        const quads = this.generateRMLQuads(yaml, y2r);
        if (!quads) {
          resolve('');
        }

        quads.sort(quadsSorter);

        const writer = new Writer({
          prefixes: {
            rr: 'http://www.w3.org/ns/r2rml#',
            rml: 'http://semweb.mmlab.be/ns/rml#',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
            ql: 'http://semweb.mmlab.be/ns/ql#',
            map: y2r.baseIRI,
            ...this.getYamlPrefixes(yaml)
          }
        });

        writer.addQuads(quads);
        writer.end(async (error, result) => {
          // try to prettify result
          try {
            result = await prettifyRDF(result);
          } catch (e) {
            this.logger.error('prettify_failed', e)
          }
	
          resolve(result);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Extracts used prefixes from YARRRML rules.
   * @param {String} yaml - YARRRML rules in YAML format
   * @returns {Object} containing prefixes for YAML rules mapped on their full corresponding IRIs.
   */
  getYamlPrefixes(yaml) {
    let prefixes = {};

    prefixes.rdf = this.yamlPrefixes.rdf;

    Object.keys(this.yamlPrefixes).forEach(pre => {
      if (yaml.indexOf(`${pre}:`) >= 0) {
        prefixes[pre] = this.yamlPrefixes[pre];
      }
    });

    try {
      const json = YAML.parse(yaml);
      if (json.prefixes) {
        prefixes = Object.assign({}, prefixes, json.prefixes);
      }
    } catch (e) {
      // nothing
    }

    return prefixes;
  }

  /**
   * Converts YARRRML rules into RML rules, and returns the generated quads.
   * @param {String} yaml - YARRRML rules in YAML format
   * @param {yarrrml} y2r - object that is used to convert YARRRML into RML
   * @returns {Array} array containing generated RDF quads
   * @throws {ParseException} exception that gets thrown when input YARRRML is invalid
   */
  generateRMLQuads(yaml, y2r = null) {
    if (!y2r) {
      y2r = new yarrrml();
    }
    let quads;
    try {
      quads = y2r.convert(yaml);
    } catch (e) {
      this.logger.error('yarrml_invalid', {yarrrml: yaml});
      this.front.doAlert('Couldn\'t generate the RML mapping file, check the source.', 'danger');
      return null;
    }
    return quads;
  }

}

export default YarrrmlHandler;
