import * as HeightWidthDepth from "./HeightWidthDepth.js";
import * as PartTime from "../PartTime.js";
import * as ValueMax from "../ValueMax.js";
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

/** Aggregate all progress about WebGL an CPU.  */
class Progress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new ValueMax.Percentage.Concrete(), // Increased when executing by WebGL.
      new ValueMax.Percentage.Concrete(), // Increased when executing by WASM.
      new ValueMax.Percentage.Concrete(), // Increased when executing by CPU.
    ];

    super(children);
    [ this.WebGL, this.WASM, this.CPU ] = children;
  }
}

/** Profile test case.  */
globalThis.testCaseLoader = async function () {

  let progress = new Progress();
  let progressReceiver = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy("TestProgressBar");

  let resultProfilesWebGL;
  {
    await tf.setBackend("webgl");  // WebGL seems crashed jsPerf.
    console.log("library WebGL ready.");

    console.log("library WebGL compiling...");  // For pre-compile tensorflow.js GPU codes. (and Test correctness.)

    globalThis.testCase = new HeightWidthDepth.Base(
      testCase_Height, testCase_Width, testCase_Depth, progress, progress.WebGL, progressReceiver );

    resultProfilesWebGL = await globalThis.testCase.generateProfiles();
    globalThis.testCase.disposeTensors();
    console.log("library WebGL compiling done.");
  }

  let resultProfilesWASM;
  {
    await tf.setBackend("wasm")  // WASM seems no ResizeNearestNeighbor.
    console.log("library WASM ready.");

    console.log("library WASM compiling...");  // For pre-compile tensorflow.js WASM codes. (and Test correctness.)

    globalThis.testCase = new HeightWidthDepth.Base(
      testCase_Height, testCase_Width, testCase_Depth, progress, progress.WASM, progressReceiver );

    resultProfilesWASM = await globalThis.testCase.generateProfiles();
    globalThis.testCase.disposeTensors();
    console.log("library WASM compiling done.");
  }

  let resultProfilesCPU;
  {
    await tf.setBackend("cpu");
    //await tf.ready();
    console.log("library CPU ready.");

    console.log("library CPU compiling...");  // For pre-compile tensorflow.js CPU codes. (and Test correctness.)

    globalThis.testCase = new HeightWidthDepth.Base(
      testCase_Height, testCase_Width, testCase_Depth, progress, progress.CPU, progressReceiver );

    resultProfilesCPU = await globalThis.testCase.generateProfiles();
    // DO NOT dispose it so that jsPerf can use it.
    //globalThis.testCase.disposeTensors();
    console.log("library CPU compiling done.");
  }

  // Display to web page.
  publishProfiles( "profilesHTMLTable", resultProfilesWebGL, resultProfilesWASM, resultProfilesCPU );
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
   * @param {HTMLTable}         htmlTable The HTML table as display target.
   * @param {string}            th_OR_td  "th" for table header, "td" for table body.
   * @param {string[]|number[]} dataArray The data to be displaye 
   */
  function addOneLineCells( htmlTable, th_OR_td, dataArray ) {
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
    htmlTable.appendChild( oneLine );
  }

  // Table header (top line).
  addOneLineCells( htmlTable, "th", [
    "TestName",
    "backend", "kernelMs", "wallMs",
    "backend", "kernelMs", "wallMs",
    "backend", "kernelMs", "wallMs",
    "newBytes", "newTensors", "peakBytes" ] );

  let profileCount = profilesWebGL.length;
  for ( let i = 0; i < profileCount; ++i ) {

    let profileWebGL = profilesWebGL[ i ];
    let profileWASM = profilesWASM[ i ];
    let profileCPU = profilesCPU[ i ];

    addOneLineCells( htmlTable, "td", [
      profileWebGL.title,
      profileWebGL.backendName, profileWebGL.kernelMs, profileWebGL.wallMs,
      profileWASM.backendName, profileWASM.kernelMs, profileWASM.wallMs,
      profileCPU.backendName, profileCPU.kernelMs, profileCPU.wallMs,
      profileWebGL.newBytes, profileWebGL.newTensors, profileWebGL.peakBytes ] );
  }

}
