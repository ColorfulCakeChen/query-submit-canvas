/**
 * 動態透過 IFrame 載入同源(Same Origin)網頁中的特定元素的文字內容。
 *
 * @param iframeSrcURL 傳入要被載入內容的網址。會使用 iframe 載入該網址的內容。並在完成後，該 iframe 會被移除與釋放。
 * @param elementIdInsideIFrame 傳入元素編號。在使用 iframe 載入指定的網頁後，會取得該該網頁中該編號元素的文字內容。
 *
 * @return 傳回 Promise，該 Promise resolve 時，會傳入指定網址中指定編號元素的文字內容。
 */
function createPromise_GetTextContent_ByIFrame(iframeSrcURL, elementIdInsideIFrame) {
  return new Promise(function(resolve, reject) {
    var theIFrame = document.createElement("iframe");
    theIFrame.style.display = "none";
    theIFrame.src           = iframeSrcURL;
    theIFrame.sandbox       ="allow-same-origin";
    theIFrame.onload        = function() { resolve(theIFrame); }
    document.body.appendChild(theIFrame);         // Load the URL by iframe.

  }).then(function(theIFrame) {
    var theTextContent = theIFrame.contentDocument.getElementById(elementIdInsideIFrame).textContent;
    theIFrame.parentNode.removeChild(theIFrame);  // Release the iframe.
    return theTextContent;
  });
}
