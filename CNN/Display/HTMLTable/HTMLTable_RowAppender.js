export { HTMLTable_RowAppender as RowAppender };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

//!!! ...unfinished... (2022/09/24)

/**
 * Append table row into a HTMLTable.
 *
 *
 * @member {string} htmlTableElementId
 *   the HTML table element id for displaying data.
 *
 */
class HTMLTable_RowAppender extends Recyclable.Root {

  /**
   * Used as default HTMLTable.RowAppender provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "HTMLTable.RowAppender.Pool",
    HTMLTable_RowAppender, HTMLTable_RowAppender.setAsConstructor );

  /** */
  constructor( htmlTableElementId ) {
    super();
    HTMLTable_RowAppender.setAsConstructor_self.call( this, htmlTableElementId );
  }

  /** @override */
  static setAsConstructor( weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId ) {
    super.setAsConstructor();
    HTMLTable_RowAppender.setAsConstructor_self.call( this, htmlTableElementId );
    return this;
  }

  /** @override */
  static setAsConstructor_self( htmlTableElementId ) {
    this.htmlTableElementId = htmlTableElementId;
  }

  /** @override */
  disposeResources() {
    this.htmlTableElementId = undefined;
    this.htmlTableElement = undefined;
    super.disposeResources();
  }

  /** If .htmlTableElement undefined, preare it by .htmlTableElementId.  */
  HTMLTableElement_ensure() {
    if ( this.htmlTableElement )
      return; // Already prepared readily.

    if ( !document )
      return;
  
    if ( !this.htmlTableElementId )
      return;
  
    this.htmlTableElement = document.getElementById( this.htmlTableElementId );
  }

}


/**
 * Publish the profiles to HTML table.
 * 
 * @param {string}   strResultHTMLTableName  the HTML table name for display execution time.
 * @param {Object[]} profilesWebGL           the array of profiles for execution time of WebGL.
 * @param {Object[]} profilesWASM            the array of profiles for execution time of WASM.
 * @param {Object[]} profilesCPU             the array of profiles for execution time of CPU.
 */
 function publishProfiles( strResultHTMLTableName, profilesWebGL, profilesWASM, profilesCPU ) {

  if ( !document )
    return;

  if ( !strResultHTMLTableName )
    return;

  let htmlTable = document.getElementById( strResultHTMLTableName );
  if ( !htmlTable )
    return;

  /**
   * @param {HTMLNode}         htmlNode The HTML table (or thead, or tbody) as display target.
   * @param {string}            th_OR_td  "th" for table header, "td" for table body.
   * @param {string[]|number[]} dataArray The data to be displaye 
   */
  function addOneLineCells( htmlNode, th_OR_td, dataArray ) {
    let cellElementName;
    let oneLine = document.createElement( "tr" );

    let count = dataArray.length;
    for ( let i = 0; i < count; ++i ) {
      let data = dataArray[ i ];

      if ( 0 == i )
        cellElementName = "th"; // First column always use <th>
      else
        cellElementName = th_OR_td;

      let oneCell = document.createElement( cellElementName );
      oneCell.appendChild( document.createTextNode( data ) )
      oneLine.appendChild( oneCell );
    }
    htmlNode.appendChild( oneLine );
  }

  let thead = document.createElement( "thead" );
  let tbody = document.createElement( "tbody" );

  htmlTable.appendChild( thead );
  htmlTable.appendChild( tbody );

  // Table header (top line).
  addOneLineCells( thead, "th", [
    "TestName",
    "kernelMs", "wallMs",
    //"newBytes", "newTensors", // If not zero, there is memory leak.
    "peakBytes"
  ] );

  let digitsCount = 4;

  let profileCount = profilesWebGL.length;
  for ( let i = 0; i < profileCount; ++i ) {

    let profileWebGL = profilesWebGL[ i ];
//    let profileWASM = profilesWASM[ i ];

    addOneLineCells( tbody, "td", [
      `(${profileWebGL.backendName}) ${profileWebGL.title}`,
      profileWebGL.kernelMs.toFixed( digitsCount ), profileWebGL.wallMs.toFixed( digitsCount ),
      //profileWebGL.newBytes, profileWebGL.newTensors, // If not zero, there is memory leak.
      profileWebGL.peakBytes
    ] );

    let profileCPU = profilesCPU[ i ];

    addOneLineCells( tbody, "td", [
      `(${profileCPU.backendName})`,
      profileCPU.kernelMs.toFixed( digitsCount ), profileCPU.wallMs.toFixed( digitsCount ),
      //"", "",
      ""
    ] );
  }

}
