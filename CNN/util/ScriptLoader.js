export { createPromise };

/**
 * @param {string}  url
 *   The URL of the script to be loaded. A HTMLScriptElement will be created in
 * document's head to load the script.
 *
 * @param {boolean} isModule
 *   If true, the script will be loaded as javascript module.
 *
 * @param {string} htmlElementId
 *   If specified, it will become the id of the created HTMLScriptElement. And
 * it will be used to determine whether the script has been loaded to prevent
 * loading twice.
 *
 * @return {Promise}
 *   It resolves when the script is loaded.
 */
function createPromise( url, isModule, htmlElementId ) {
  if ( htmlElementId ) {
    let scriptElement = document.getElementById( htmlElementId );
    if ( scriptElement )
      return Promise.resolve();
  }

  //console.log( "Loading \"" + url + "\"" );
  return new Promise( ( resolve, reject ) => {
    let attributes
      = { src: url, onload: e => resolve( e ), onerror: e => reject( e ) };

    if ( isModule )
      attributes.type = "module";

    if ( htmlElementId )
      attributes.id = htmlElementId;

    document.head.appendChild(
      Object.assign( document.createElement( "script" ), attributes ) );
  } );
}
