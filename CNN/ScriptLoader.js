export {createPromise};

/**
 * @param {string}  url      The URL of the script to be loaded.
 * @param {boolean} isModule If true, the script will be loaded as javascript module.
 * @return A promise. It resolves when the script is loaded.
 */
function createPromise(url, isModule) {
  return new Promise((resolve, reject) => {
    let attributes = { src:url, onload:e=>resolve(e), onerror:e=>reject(e) };
    if (isModule)
      attributes.type = "module";

    document.head.appendChild(Object.assign(document.createElement("script"), attributes));
  });
}
