(function (w,d,s,u,TextAreaElementTooltip){

  function createPromiseLoadScript(url) {
    return new Promise((resolve, reject) => {
      d.head.appendChild(Object.assign(d.createElement(s),{ src:url, onload:e=>resolve(e), onerror:e=>reject(e) }));
  }

  /*alert("hi1");*/
  var theTextArea = d.querySelector("textarea[title='"+TextAreaElementTooltip+"']");

  if (u.length <= 0) {
    theTextArea.value = "No Library needs to load.";
    theTextArea.dispatchEvent(new Event("input")); /* None to be loaded. Done. */
  }

  let i = 0, p = createPromiseLoadScript(u[i]);
  p.then(e => {
    /*alert('Library ({$i}/{$u.length}) loaded: ({$u[i]})');*/
    if (i >= u.length - 1) {
      theTextArea.value = 'Library ({$i}/{$u.length}) loaded. Done.';
      theTextArea.dispatchEvent(new Event("input")); /* The last one is loaded. */
    } else {
      theTextArea.value = 'Library ({$i}/{$u.length}) loaded: ({$u[i]})';
      ++i;
      p=createPromiseLoadScript(u[i]);
    }
  }).catch(e => {
    /*alert('Library ({$i}/{$u.length}) loading FAILED! {$e} ({$u[i]})');*/
    theTextArea.value = 'Library ({$i}/{$u.length}) loading FAILED! {$e} ({$u[i]})';
  });
    } else {
      p=createPromiseLoadScript(u[i]);
    
    /*alert("hi2");*/
    });
    ;
  }

  (new Promise((resolve, reject) => {
    d.head.appendChild(Object.assign(d.createElement(s),
      { src:u, onload:e=>resolve(e), onerror:e=>reject(e) }));
    /*alert("hi2");*/
  })).then(e => {
    /*alert("Library loading done!");*/
    theTextArea.value = "Library loading done!";
    theTextArea.dispatchEvent(new Event("input"));
  }).catch(e => {
    /*alert("Library loading failed! " + e + " (" + u + ")");*/
    theTextArea.value = "Library loading failed! " + e + " (" + u + ")";
  });
})(window,document,'script',' 
