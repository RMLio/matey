/**
 * Sorting function for array of RDF quads. The quads are sorted by subject, object, predicate and graph respectively.
 * @param {n3.Quad} a first quad
 * @param {n3.Quad} b second quad
 * @returns {number} 1, -1 or 0 depending on how a is sorted to b alphabetically
 */
function quads_sorter(a, b) {
  return ['subject', 'predicate', 'object', 'graph'].map(o => {
    return a[o].id > b[o].id ? 1 : a[o].id < b[o].id ? (-1) : 0;
  }).reduce((p, n) => p ? p : n, 0);
}

module.exports = quads_sorter;