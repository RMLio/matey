const ttlRead = require("@graphy/content.ttl.read");
const rdfTree = require("@graphy/memory.dataset.fast");
const ttlWrite = require("@graphy/content.ttl.write");

module.exports = {
  prettifyRDF,
  loadRemote,
  downloadString
}

/**
 * Makes text with RDF triples prettier
 * @param {String} rdf - unprettified RDF
 * @returns {Promise} promise of prettified RDF
 */
function prettifyRDF(rdf) {
  return new Promise(function (resolve, reject) {
    let prettyRdf = '';
    ttlRead(rdf)
      .pipe(rdfTree())
      .pipe(ttlWrite())
      .on('data', data => prettyRdf += data)
      .on('end', () => resolve(prettyRdf))
      .on('error', (e) => reject(e));
  });
}

/**
 * Fetch a remote source with given URL asynchronously and return promise of fetched data
 * @param {String} url - of remote source
 * @returns {Promise} promise containing fetched value if resolved
 */
function loadRemote(url) {
  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.open('GET', url);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.responseText);
        } else {
          reject(xhr.responseText);
        }
      }
    };
    xhr.send();
  });
}

/**
 * Downloads the given text as a file with the given type and name.
 * @param {String} text - string that serves as content for file
 * @param {String} fileType - Specifies type of text for file. Can be 'json', 'text' or 'text/turtle'
 * @param {String} fileName - name of file to be downloaded
 */
function downloadString(text, fileType, fileName) {
  const blob = new Blob([text], {type: fileType});
  const a = document.createElement('a');

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