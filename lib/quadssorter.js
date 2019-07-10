/**
 * Sorting function for array of RDF quads. The quads are sorted by subject, object, predicate and graph respectively.
 * @param a first quad
 * @param b second quad
 * @returns {number} 1, -1 or 0 depending on how a is sorted to b alphabetically
 */
function quads_sorter(a, b) {
  return ['subject', 'predicate', 'object', 'graph'].map(o => {
    return a[o] > b[o] ? 1 : a[o] < b[o] ? (-1) : 0;
  }).reduce((p, n) => p ? p : n, 0);
}

module.exports = quads_sorter;