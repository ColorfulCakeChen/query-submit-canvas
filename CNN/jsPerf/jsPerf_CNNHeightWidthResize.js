import * as HeightWidthDepth from "./HeightWidthDepth.js";
//import * as TensorTools from "../util/TensorTools.js";

/**
 * Test different resize implementation for CNN.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-height-width-resize}
 * @see {@link https://colorfulcakechen.github.io/query-submit-canvas/CNN/jsPerf/TestFilters2D.html}
 */

let testCase_Height = 101;
let testCase_Width = 101;
let testCase_Depth = 24;

//globalThis.testSet_101x101x24 = new HeightWidthDepth.Base( 101, 101, 24 ); // height, width, depth

globalThis.testCaseLoader = async function () {

  await tf.setBackend("webgl");  // WebGL seems crashed.
  console.log("library WebGL ready.");

  console.log("library WebGL compiling...");  // For pre-compile tensorflow.js GPU code. (and Test correctness.)
  globalThis.testCase = new HeightWidthDepth.Base( testCase_Height, testCase_Width, testCase_Depth );
  let resultProfilesWebGL = await globalThis.testCase.generateProfiles();
  globalThis.testCase.disposeTensors();
  console.log("library WebGL compiling done.");

  //await tf.setBackend("wasm")  // WASM seems no ResizeNearestNeighbor.
  await tf.setBackend("cpu");
  //await tf.ready();
  console.log("library CPU ready.");

  console.log("library CPU compiling...");  // For pre-compile tensorflow.js GPU code. (and Test correctness.)
  globalThis.testCase = new HeightWidthDepth.Base( testCase_Height, testCase_Width, testCase_Depth );
  let resultProfilesCPU = await globalThis.testCase.generateProfiles();
  // DO NOT dispose it so that jsPerf can use it.
  //globalThis.testCase.disposeTensors();
  console.log("library CPU compiling done.");

  // Display to web page.
  publishProfiles( "profilesHTMLTable", resultProfilesWebGL, resultProfilesCPU );
}

/**
 * Publish the profiles to HTML table.
 * 
 * @param {string}   strResultHTMLTableName  the HTML table name for display execution time.
 * @param {Object[]} profilesWebGL           the array of profiles for execution time of WebGL.
 * @param {Object[]} profilesCPU             the array of profiles for execution time of CPU.
 */
function publishProfiles( strResultHTMLTableName, profilesWebGL, profilesCPU ) {

  if ( !document )
    return;

  if ( !strResultHTMLTableName )
    return;

  let htmlTable = document.getElementById( strResultHTMLTableName );
  if ( !htmlTable )
    return;

  /**
   * @param {HTMLTable}         htmlTable The HTML table as display target.
   * @param {string}            th_OR_td  "th" for table header, "td" for table body.
   * @param {string[]|number[]} dataArray The data to be displaye 
   */
  function addOneLineCells( htmlTable, th_OR_td, dataArray ) {
    let oneLine = document.createElement( "tr" );

    let count = dataArray.length;
    for ( let i = 0; i < count; ++i ) {
      let data = dataArray[ i ];
      let oneCell = document.createElement( th_OR_td );
      oneCell.appendChild( document.createTextNode( data ) )
      oneLine.appendChild( oneCell );
    }
    htmlTable.appendChild( oneLine );
  }

  // Table header (top line).
  addOneLineCells( htmlTable, "th", [
    "title",
    "backendName", "kernelMs", "wallMs",
    "backendName", "kernelMs", "wallMs",
    "newBytes", "newTensors", "peakBytes" ] );

  let profileCount = profilesWebGL.length;
  for ( let i = 0; i < profileCount; ++i ) {

    let profileWebGL = profilesWebGL[ i ];
    let profileCPU = profilesCPU[ i ];

    addOneLineCells( htmlTable, "td", [
      profileWebGL.title,
      profileWebGL.backendName, profileWebGL.kernelMs, profileWebGL.wallMs,
      profileCPU.backendName, profileCPU.kernelMs, profileCPU.wallMs,
      profileWebGL.newBytes, profileWebGL.newTensors, profileWebGL.peakBytes ] );
  }

}
