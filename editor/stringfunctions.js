/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

class StringFunctions {

  constructor() {
    this.namespace = 'http://example.com/idlab/functions/string/';
  }

  toUpperCase(str) {
    return str.toUpperCase();
  }

  toLowerCase(str) {
    return str.toLowerCase();
  }
}

module.exports = {
  StringFunctions: StringFunctions
};