(function (w,d,s,urlArray,TextAreaElementTooltip){

  function createPromiseLoadScript(url) {
    return new Promise((resolve, reject) => {
      d.head.appendChild(Object.assign(d.createElement(s),{ src:url, onload:e=>resolve(e), onerror:e=>reject(e) }));
  }

  /*alert("hi1");*/
  let theTextArea = d.querySelector("textarea[title='"+TextAreaElementTooltip+"']");

  if (urlArray.length <= 0) {
    theTextArea.value = "No Library needs to load.";
    theTextArea.dispatchEvent(new Event("input")); /* None to be loaded. Done. */
  }

  let i = 0;

  function onLoadFailed(e) {
    /*alert(`Library ({$i}/{$u.length}) loading FAILED! {$e} ({$u[i]})`);*/
    theTextArea.value = `Library ({$i}/{$urlArray.length}) loading FAILED! {$e} ({$urlArray[i]})`;
  }

  function onLoadOk(e) {
    /*alert(`Library ({$i}/{$urlArray.length}) loaded: ({$urlArray[i]})`);*/
    if (i > 0) {
      if (i >= urlArray.length) {
        theTextArea.value = `Library ({$i}/{$urlArray.length}) loaded. Done.`;
        theTextArea.dispatchEvent(new Event("input")); /* The last one is loaded. Done. */
      } else {
        theTextArea.value = `Library ({$i}/{$urlArray.length}) loaded: ({$urlArray[i]})`;
      }
    }
    /*theTextArea.value = `Library ({$i}/{$urlArray.length}) loading: ({$urlArray[i]})`;*/
    createPromiseLoadScript(urlArray[i]).then(onLoadOk).catch(onLoadFailed);
    ++i;
  }

  onLoadOk(null);  /* Start to load the first one. */

})(window,document,'script',
