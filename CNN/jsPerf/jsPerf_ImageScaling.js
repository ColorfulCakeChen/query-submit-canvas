export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as RandTools from "../util/RandTools.js";
//import * as BatchIdCalculator from "./BatchIdCalculator.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

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

    this.output_shape_height_width = [ output_height, output_width ];

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
  testImageScaling_ByOffscreenCanvas_2d_from_Canvas() {
    HeightWidthDepth.testImageScaling_ByOffscreenCanvas_from_Canvas( "2d" );
  }

  /** */
  testImageScaling_ByOffscreenCanvas_2d_from_ImageData() {
    HeightWidthDepth.testImageScaling_ByOffscreenCanvas_from_ImageData( "2d" );
  }

  /** */
  testImageScaling_ByOffscreenCanvas_webgl_from_Canvas() {
    HeightWidthDepth.testImageScaling_ByOffscreenCanvas_from_Canvas( "webgl" );
  }

  /** */
  testImageScaling_ByOffscreenCanvas_webgl_from_ImageData() {
    HeightWidthDepth.testImageScaling_ByOffscreenCanvas_from_ImageData( "webgl" );
  }

//!!! ...unfinished... (2023/05/25) need inside async function.
//   /** */
//   testImageScaling_ByOffscreenCanvas_bitmaprenderer() {
//     const input_Canvas = this.input_Canvas;
//
//     let input_ImageBitmap = await createImageBitmap( input_Canvas );
//
//     let offscreenCanvas
//       = new OffscreenCanvas( this.output_width, this.output_height );
//
//     let offscreenCanvas_ctx = offscreenCanvas.getContext( "bitmaprenderer" );
//     offscreenCanvas_ctx.transferFromImageBitmap( input_ImageBitmap );
//
// //!!! ...unfinished... (2023/05/25) whether necessary?
//     input_ImageBitmap.close();
//
//     let output_ImageData = offscreenCanvas_ctx.getImageData(
//       0, 0, this.output_width, this.output_height );
//   }

  /** */
  testImageScaling_ByTensor3d_from_Canvas() {

//!!! ...unfinished... (2023/05/25)

  }

  /** */
  testImageScaling_ByTensor3d_from_ImageData() {

//!!! ...unfinished... (2023/05/25)

    const input_Canvas = this.input_Canvas;

    let input_ctx = input_Canvas.getContext( "2d" );
    let input_ImageData = input_ctx.getImageData(
      0, 0, input_Canvas.width, input_Canvas.height );

//!!! (2023/05/25 Remarked)
//    let input_tensor;
    let output_tensor;
    try {

//!!! (2023/05/25 Remarked)
//       let input_shape = [ input_Canvas.height, input_Canvas.width,
//         this.output_channelCount ];
//
//       input_tensor = tf.tensor3d( input_ImageData, input_shape, "int32" );

      output_tensor
        = NeuralNet_ScaleFiller.createTensor_by_scale_TypedArray(
            input_ImageData.data,
            input_Canvas.height, input_Canvas.width, this.output_channelCount,
            this.output_shape_height_width );

      let output_TypedArray = output_tensor.dataSync();

    } finally {

//!!! (2023/05/25 Remarked)
//       if ( input_tensor ) {
//         input_tensor.dispose();
//         input_tensor = null;
//       }

      if ( output_tensor ) {
        output_tensor.dispose();
        output_tensor = null;
      }
    }
  }


  /** */
  static testImageScaling_ByOffscreenCanvas_from_Canvas( contextType ) {
    const input_Canvas = this.input_Canvas;

    let offscreenCanvas
      = new OffscreenCanvas( this.output_width, this.output_height );

    let offscreenCanvas_ctx = offscreenCanvas.getContext( contextType );
    offscreenCanvas_ctx.drawImage( input_Canvas,
      0, 0, input_Canvas.width, input_Canvas.height,
      0, 0, this.output_width, this.output_height
    );

    let output_ImageData = offscreenCanvas_ctx.getImageData(
      0, 0, this.output_width, this.output_height );
  }

  /** */
  static testImageScaling_ByOffscreenCanvas_from_ImageData( contextType ) {
    const input_Canvas = this.input_Canvas;

    let input_ctx = input_Canvas.getContext( "2d" );
    let input_ImageData = input_ctx.getImageData(
      0, 0, input_Canvas.width, input_Canvas.height );

    let input_offscreenCanvas;
    {
      input_offscreenCanvas
        = new OffscreenCanvas( this.input_width, this.input_height );

      let input_offscreenCanvas_ctx = offscreenCanvas.getContext( contextType );
      input_offscreenCanvas_ctx.putImageData( input_ImageData, 0, 0 );
    }

    let output_offscreenCanvas;
    {
      output_offscreenCanvas
        = new OffscreenCanvas( this.output_width, this.output_height );

      let output_offscreenCanvas_ctx = offscreenCanvas.getContext( contextType );
        output_offscreenCanvas_ctx.drawImage( input_offscreenCanvas,
        0, 0, input_offscreenCanvas.width, input_offscreenCanvas.height,
        0, 0, this.output_width, this.output_height
      );

      let output_ImageData = output_offscreenCanvas_ctx.getImageData(
        0, 0, this.output_width, this.output_height );
    }
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
