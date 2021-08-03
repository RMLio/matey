const ttlRead = require("@graphy/content.ttl.read");
const rdfTree = require("@graphy/memory.dataset.fast");
const ttlWrite = require("@graphy/content.ttl.write");
const fs = require("fs");
const handlebars = require("handlebars");
const $ = require("jquery");

module.exports = {
  prettifyRDF,
  loadRemote,
  downloadString,
  doAlert
}

/**
 * Makes text with RDF triples prettier
 * @param {String} rdf unprettified RDF
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
 * @param {String} url of remote source
 * @returns {Promise} promise containing fetched value if resolved
 */
function loadRemote(url) {
  let xhr = new XMLHttpRequest();
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
 * @param {String} text string that serves as content for file
 * @param {String} fileType Specifies type of text for file. Can be 'json', 'text' or 'text/turtle'
 * @param {String} fileName name of file to be downloaded
 */
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

/**
 * Creates an HTML element for an alert message and displays is in the page for a certain time period
 * @param message the alert message to be displayed
 * @param type of alert
 * @param timeout how long alert has to stay open
 */
function doAlert(message, type = 'primary', timeout = 2000) {

  // read HTML template for alert element
  let htmlSource = fs.readFileSync(__dirname + '/../../assets/html/alert.html', 'utf8');
  let htmlTmpl = handlebars.compile(htmlSource);
  let html = htmlTmpl({
    type: type,
    message: message
  });

  let $alert = $(html);

  $('#alerts-matey').append($alert);

  setTimeout(() => {
    $alert.alert('close');
  }, timeout);
}