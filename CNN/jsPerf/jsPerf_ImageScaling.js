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
   * @param {number} height       target image height
   * @param {number} width        target image width
   * @param {number} depth        target image channel count
   * @param {number} largerFactor input image is how large of target.
   */
  constructor( height, width, depth, largerFactor ) {

    this.disposeResources();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;

    this.largerFactor = largerFactor;

    this.source_height = height * largerFactor;
    this.source_width = width * largerFactor;
    this.source_valueCount = this.source_height * this.source_width * depth;
  }

  /** */
  disposeResources() {
    this.ImageScaling_PerformanceTest_release();
  }

  /** */
  ImageScaling_PerformanceTest_init() {

    this.disposeResources();

  }

  ImageScaling_PerformanceTest_release() {

  }

  /** Test apply by Xxx */
  testEmbedding_ByName( testCaseName ) {
//!!!
    let testCase = this.testCaseMap.get( testCaseName );
    let embedding = testCase.embedding;
    let outputTensor3d = embedding.apply( testCase.inputTensor3d );
    tf.dispose( outputTensor3d );
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

  let depth = 4;

  // Using mobile phone's resolution ( 1080 * 2160 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1080 * 1920 ).
  globalThis.testSet_108x192x4 = new HeightWidthDepth( 108, 192, depth ); // height, width, depth

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
