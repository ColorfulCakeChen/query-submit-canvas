import * as HeightWidthDepth from "./HeightWidthDepth.js";
//import * as TensorTools from "../util/TensorTools.js";

/**
 * Test different resize implementation for CNN.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-height-width-resize}
 */

let testCase_Height = 101;
let testCase_Width = 101;
let testCase_Depth = 24;

//globalThis.testSet_101x101x24 = new HeightWidthDepth.Base( 101, 101, 24 ); // height, width, depth

async function testCaseLoader() {

  await tf.setBackend("webgl");  // WebGL seems crashed.
  console.log("library WebGL ready.");

  console.log("library WebGL compiling...");  // For pre-compile tensorflow.js GPU code. (and Test correctness.)
  globalThis.testCase = new HeightWidthDepth.Base( testCase_Height, testCase_Width, testCase_Depth );
  await globalThis.testCase.testResultSame();
  globalThis.testCase.disposeTensors();
  console.log("library WebGL compiling done.");

  //await tf.setBackend("wasm")  // WASM seems no ResizeNearestNeighbor.
  await tf.setBackend("cpu");
  //await tf.ready();
  console.log("library CPU ready.");

  console.log("library CPU compiling...");  // For pre-compile tensorflow.js GPU code. (and Test correctness.)
  globalThis.testCase = new HeightWidthDepth.Base( testCase_Height, testCase_Width, testCase_Depth );
  await globalThis.testCase.testResultSame();
  // DO NOT dispose it so that jsPerf can use it.
  //globalThis.testCase.disposeTensors();
  console.log("library CPU compiling done.");
}


