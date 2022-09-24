export { HTMLTable_RowAppender as RowAppender };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 * Append table row into a HTMLTable.
 *
 *
 * @member {string} htmlTableElementId
 *   The HTML table element id for displaying data.
 *
 * @member {number} digitsCount
 *   For number data, it will be converted to text by toFix() with digitsCount (i.e.
 * the number of digits to appear after the decimal point).
 */
class HTMLTable_RowAppender extends Recyclable.Root {

  /**
   * Used as default HTMLTable.RowAppender provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "HTMLTable.RowAppender.Pool",
    HTMLTable_RowAppender, HTMLTable_RowAppender.setAsConstructor );

  /** */
  constructor( htmlTableElementId, digitsCount = 2 ) {
    super();
    HTMLTable_RowAppender.setAsConstructor_self.call( this,
      htmlTableElementId, digitsCount );
  }

  /** @override */
  static setAsConstructor( htmlTableElementId, digitsCount ) {
    super.setAsConstructor();
    HTMLTable_RowAppender.setAsConstructor_self.call( this,
      htmlTableElementId, digitsCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( htmlTableElementId, digitsCount ) {
    this.htmlTableElementId = htmlTableElementId;
    this.digitsCount = digitsCount;
  }

  /** @override */
  disposeResources() {
    this.digitsCount = undefined;
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

  /**
   * @param {string[]|number[]} dataArray
   *   Append the data as the last row of the table header.
   */
  tHeader_append( dataArray ) {
    this.HTMLTableElement_ensure();
    HTMLTable_RowAppender.addOneLineCells.call( this,
      this.htmlTableElement.tHead, dataArray );
  }

  /**
   * @param {string[]|number[]} dataArray
   *   Append the data as the last row of the table body.
   */
  tBodies_append( dataArray ) {
    this.HTMLTableElement_ensure();
    HTMLTable_RowAppender.addOneLineCells.call( this,
      this.htmlTableElement.tBodies, dataArray );
  }

  /**
   * @param {Node} htmlNode
   *   The HTML DOM Node which will the new row will be inserted. For HTML table,
   * it could be .tHead or .tBodies or .tFoot.
   *
   * @param {string[]|number[]} dataArray
   *   The data to be displaye 
   */
  static addOneLineCells( htmlNode, dataArray ) {
    let oneLine = document.createElement( "tr" );

    let th_OR_td; // "th" for table header cell, "td" for table data cell.
    let data, dataText;
    for ( let i = 0; i < dataArray.length; ++i ) {
      data = dataArray[ i ];

      if ( 0 == i )
        th_OR_td = "th"; // First column always use <th>
      else
        th_OR_td = "td";

      let oneCell = document.createElement( th_OR_td );

      if ( typeof data === "number" )
        dataText = data.toFixed( this.digitsCount );
      else
        dataText = data;

      oneCell.appendChild( document.createTextNode( dataText ) );
      oneLine.appendChild( oneCell );
    }

    htmlNode.appendChild( oneLine );
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
