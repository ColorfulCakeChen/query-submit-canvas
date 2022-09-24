export { HTMLTable_Appender as Appender };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

//!!! ...unfinished... (2022/09/24)

/**
 * Appender table row into a HTMLTable.
 *
 *
 * @member {string} strHTMLTableName
 *   the HTML table name for displaying data.
 *
 */
class HTMLTable_Appender extends Recyclable.Root {

  /**
   * Used as default HTMLTable.Appender provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "HTMLTable.Appender.Pool",
    HTMLTable_Appender, HTMLTable_Appender.setAsConstructor );

  /** */
  constructor( weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId ) {
    super();
    HTMLTable_Appender.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId
    );
  }

  /** @override */
  static setAsConstructor( weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId ) {
    super.setAsConstructor();
    HTMLTable_Appender.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId ) {

    this.evolutionVersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
      weightsSpreadsheetId, weightsAPIKey );

    this.workerProxies = NeuralWorker.Proxies.Pool.get_or_create_by(
      nNeuralWorker_ModeId );
  }

  /** @override */
  disposeResources() {
    this.workerProxies_dispose();
    this.evolutionVersusSummary_dispose();

    super.disposeResources();
  }

  get weightsSpreadsheetId() {
    return this.evolutionVersusSummary.weightsSpreadsheetId;
  }

  get weightsAPIKey( ) {
    return this.evolutionVersusSummary.weightsAPIKey;
  }

  get nNeuralWorker_ModeId() {
    return this.workerProxies.nNeuralWorker_ModeId;
  }

  /** */
  workerProxies_dispose() {
    if ( this.workerProxies ) {
      this.workerProxies.disposeResources_and_recycleToPool();
      this.workerProxies = null;
    }
  }

  /** */
  evolutionVersusSummary_dispose() {
    if ( this.evolutionVersusSummary ) {
      this.evolutionVersusSummary.disposeResources_and_recycleToPool();
      this.evolutionVersusSummary = null;
    }
  }

  /** Load all differential evolution versus weights ranges. */
  async evolutionVersusSummary_load_async() {

    this.evolutionVersusSummary.rangeArray_load_async();

//!!! ...unfinished... (2022/09/24)


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
