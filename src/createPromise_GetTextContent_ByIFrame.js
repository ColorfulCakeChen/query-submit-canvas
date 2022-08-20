/**
 * Load .textContent by iframe from specified HTML elemen of specified (same origin)
 * web page.
 *
 * @param {string} iframeSrcURL
 *   The web page to be loaded. An iframe will be used to load it. After .textContent
 * has been extracted, the iframe will be released.
 *
 * @param {string} elementIdInsideIFrame
 *   The HTML element id. When the web page has been loaded, the .textContent of the
 * the HTML element with this id will be extracted.
 *
 * @return {Promise}
 *   Return a Promise. When the Promise resolve, the .textContent of the HTML element
 * will be returned.
 */
function createPromise_GetTextContent_ByIFrame(iframeSrcURL, elementIdInsideIFrame) {
  return new Promise(function(resolve, reject) {
    let theIFrame = document.createElement("iframe");
    theIFrame.style.display = "none";
    theIFrame.src           = iframeSrcURL;
    theIFrame.sandbox       ="allow-same-origin";
    theIFrame.onload        = function() { resolve(theIFrame); }
    document.body.appendChild(theIFrame);         // Load the URL by iframe.

  }).then(function(theIFrame) {
    let theTextContent = theIFrame.contentDocument
      .getElementById(elementIdInsideIFrame).textContent;
    theIFrame.parentNode.removeChild(theIFrame);  // Release the iframe.
    return theTextContent;
  });
}
