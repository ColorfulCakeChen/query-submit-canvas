export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as RandTools from "../util/RandTools.js";
import * as BatchIdCalculator from "./BatchIdCalculator.js";

/**
 * Test Image Scaling.
 *
!!! * @see {@link https://www.measurethat.net/Benchmarks/Show/11003/175/colorfulcakechen-cnn-embedding-c5491acc04be23e0d98eb425}
 */

/**
 * A test set.
 */
class HeightWidthDepth {

  /**
   * @param {number} output_height        output image height
   * @param {number} output_width         output image width
   * @param {number} output_channelCount  output image channel count
   * @param {number} largerFactor  input image is how large of output.
   */
  constructor( output_height, output_width, output_channelCount, largerFactor ) {

    this.disposeResources();

    this.output_height = output_height;
    this.output_width = output_width;
    this.output_channelCount = output_channelCount;

    this.output_valueCount
      = output_height * output_width * output_channelCount;

    this.largerFactor = largerFactor;

    this.input_height = height * largerFactor;
    this.input_width = width * largerFactor;

    this.input_valueCount
      = this.input_height * this.input_width * channelCount;
  }

  /** */
  disposeResources() {
    this.ImageScaling_PerformanceTest_release();
  }

  /** */
  ImageScaling_PerformanceTest_init() {
    this.disposeResources();

    this.input_Canvas = document.createElement( "canvas" );
    this.input_Canvas.height = input_height;
    this.input_Canvas.width = input_width;

    let contextAttributes = { willReadFrequently: true };
    let ctx = this.input_Canvas.getContext( "2d", contextAttributes );
    //ctx.putImageData( imageData, 0 , 0 );
  }

  ImageScaling_PerformanceTest_release() {
  }

  /** */
  testImageScaling_ByOffscreenCanvas_2d() {

    let ctx = this.input_Canvas.getContext( "2d" );
    let imageData = ctx.getImageData(
      0, 0, this.input_Canvas.width, this.input_Canvas.height );

    let offscreenCanvas
      = new OffscreenCanvas( this.output_width, this.output_height );

//!!!
    let testCase = this.testCaseMap.get( testCaseName );
    let embedding = testCase.embedding;
    let outputTensor3d = embedding.apply( testCase.inputTensor3d );
    tf.dispose( outputTensor3d );
  }

  /** */
  testImageScaling_ByOffscreenCanvas_webgl() {

//!!! ...unfinished... (2023/05/25)

  }


  /** */
  testImageScaling_ByOffscreenCanvas_bitmaprenderer() {

//!!! ...unfinished... (2023/05/25)

  }


  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {

    {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      yield;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        // Do nothing.

        let memoryInfo_testCorrectness_after = tf.memory();

        if ( memoryInfo_testCorrectness_after.numTensors != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `testCorrectness() memory leak. `
            + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
            + `should be (${memoryInfo_testCorrectness_before.numTensors} `
          );
      }

      Pool.Asserter.assert_Pool_issuedCount(
        "jsPerf_ImageScaling.HeightWidthDepth.testCorrectness()",
        pool_all_issuedCount_before );
      yield;
    }

    try {
      // After correctness testing done, create all ImageScaling for performance testing.
      this.ImageScaling_PerformanceTest_init();
    } catch ( e ) {
      debugger;
      throw e;
    }
  }

}


function init() {
  //console.log("jsPerf_ImageScaling.js, init()");

  disposeResources();

  let channelCount = 4;

  // Using mobile phone's resolution ( 1080 * 2160 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1080 * 1920 ).
  globalThis.testSet_108x192x4 = new HeightWidthDepth( 108, 192, channelCount ); // height, width, channelCount

  globalThis.testSet_All = [
    globalThis.testSet_108x192x4
  ];
}

function* testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
    let testSet = globalThis.testSet_All[ i ];
    yield* testSet.testCorrectness();
  }
}

function disposeResources() {
  if ( globalThis.testSet_All ) {
    for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
      let testSet = globalThis.testSet_All[ i ];
      if ( testSet )
        testSet.disposeResources();
    }

    globalThis.testSet_All = null;
  }

  globalThis.testSet_108x192x4
    = null;
}
