export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as RandTools from "../util/RandTools.js";
//import * as BatchIdCalculator from "./BatchIdCalculator.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

/**
 * Test Image Scaling.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/25367/46/colorfulcakechen-image-scaling-a97651f747cab19f24a68991}
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

    this.output_shape_height_width = [ output_height, output_width ];

    this.output_valueCount
      = output_height * output_width * output_channelCount;

    this.largerFactor = largerFactor;

    this.input_height = output_height * largerFactor;
    this.input_width = output_width * largerFactor;
    this.input_channelCount = output_channelCount;

    this.input_shape
      = [ this.input_height, this.input_width, this.input_channelCount ];

    this.input_valueCount
      = this.input_height * this.input_width * this.input_channelCount;
  }

  /** */
  disposeResources() {
    this.ImageScaling_PerformanceTest_release();
  }

  /** */
  ImageScaling_PerformanceTest_init() {
    this.disposeResources();

    const input_height = this.input_height;
    const input_width = this.input_width;
    const input_channelCount = this.input_channelCount;
    const input_valueCount = this.input_valueCount;

    let input_Canvas = this.input_Canvas = document.createElement( "canvas" );
    input_Canvas.height = input_height;
    input_Canvas.width = input_width;

    let input_ImageData;
    {
      let contextAttributes = { willReadFrequently: true };
      let ctx = input_Canvas.getContext( "2d", contextAttributes );
      input_ImageData
        = ctx.getImageData( imageData, 0 , 0, input_width, input_height );

      HeightWidthDepth.ImageData_init_fill( input_ImageData );
      ctx.putImageData( input_ImageData, 0 , 0 );
    }

    const input_OffscreenCanvas = this.input_OffscreenCanvas
      = new OffscreenCanvas( input_width, input_height );

    {
      let ctx = input_OffscreenCanvas.getContext( "2d" );
      ctx.putImageData( input_ImageData, 0 , 0 );
    }

  }

  /** Fill input data. */
  static ImageData_init_fill( theImageData ) {

    // Restrict data value between [ 0, ( vocabularyCountPerChannel - 1 ) ].
    const input_valueBegin = 10;
    const input_valueStep = 10; //1;
    const input_randomOffset = { min: -10, max: +10 };
    const input_divisorForRemainder = 256; //vocabularyCountPerInputChannel;

    const input_channelCount = 4; // RGBA
    RandTools.fill_numberArray(
      theImageData.data,
      theImageData.height, theImageData.width, input_channelCount,
      input_valueBegin, input_valueStep,
      input_randomOffset.min, input_randomOffset.max,
      input_divisorForRemainder );
  }

  /** */
  ImageScaling_PerformanceTest_release() {
    this.input_OffscreenCanvas = undefined;
    this.input_Canvas = undefined;
  }


  /** */
  testImageScaling_by_OffscreenCanvas_from_Canvas() {
    return HeightWidthDepth.scale_by_OffscreenCanvas_from_Canvas
      .call( this, this.input_Canvas );
  }

  /** */
  testImageScaling_by_OffscreenCanvas_from_Canvas_ImageData() {
    return HeightWidthDepth.scale_by_OffscreenCanvas_from_Canvas_ImageData
      .call( this, this.input_Canvas );
  }

  /** */
  testImageScaling_by_Tensor_from_Canvas() {
    return HeightWidthDepth.scale_by_Tensor_from_Canvas
      .call( this, this.input_Canvas );
  }

  /** */
  testImageScaling_by_Tensor_from__Canvas_ImageData() {
    return HeightWidthDepth.scale_by_Tensor_from_Canvas_ImageData
      .call( this, this.input_Canvas );
  }

  /** */
  testImageScaling_by_Tensor_from_Canvas_TypedArray() {
    return HeightWidthDepth.scale_by_Tensor_from_Canvas_TypedArray
      .call( this, this.input_Canvas );
  }


  /**
   * @return {TypedArray}
   */
  static scale_by_OffscreenCanvas_from_Canvas( input_Canvas ) {
    let offscreenCanvas
      = new OffscreenCanvas( this.output_width, this.output_height );

    // Note: "webgl" Rendering Context does not have .drawImage(),
    //       .getImageData(), .putImageData().
    let offscreenCanvas_ctx = offscreenCanvas.getContext( "2d" );
    offscreenCanvas_ctx.drawImage( input_Canvas,
      0, 0, input_Canvas.width, input_Canvas.height,
      0, 0, this.output_width, this.output_height
    );

    let output_ImageData = offscreenCanvas_ctx.getImageData(
      0, 0, this.output_width, this.output_height );

    return output_ImageData.data;
  }

  /** */
  static scale_by_OffscreenCanvas_from_Canvas_ImageData( input_Canvas ) {
    let input_ctx = input_Canvas.getContext( "2d" );
    let input_ImageData = input_ctx.getImageData(
      0, 0, input_Canvas.width, input_Canvas.height );

    let output_ImageData = NeuralNet.ScaleFiller
      .createImageData_by_scale_ImageData(
        input_ImageData, this.input_shape );

    return output_ImageData.data;
  }

//!!! ...unfinished... (2023/05/25) need inside async function.
//   /** */
//   static scale_by_OffscreenCanvas_from_Canvas_bitmaprenderer( input_Canvas ) {
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
//
//     return output_ImageData.data;
//   }

  /** */
  static scale_by_Tensor_from_Canvas( input_Canvas ) {
    let output_tensor;
    try {
      output_tensor = NeuralNet.ScaleFiller.createTensor_by_scale_PixelData(
        input_Canvas,
        this.output_channelCount,
        this.output_shape_height_width );

      let output_TypedArray = output_tensor.dataSync();
      return output_TypedArray;

    } finally {
      if ( output_tensor ) {
        output_tensor.dispose();
        output_tensor = null;
      }
    }
  }

  /** */
  static scale_by_Tensor_from_Canvas_ImageData( input_Canvas ) {
    let input_ctx = input_Canvas.getContext( "2d" );
    let input_ImageData = input_ctx.getImageData(
      0, 0, input_Canvas.width, input_Canvas.height );

    let output_tensor;
    try {
      output_tensor = NeuralNet.ScaleFiller.createTensor_by_scale_PixelData(
        input_ImageData,
        this.output_channelCount,
        this.output_shape_height_width );

      let output_TypedArray = output_tensor.dataSync();
      return output_TypedArray;

    } finally {
      if ( output_tensor ) {
        output_tensor.dispose();
        output_tensor = null;
      }
    }
  }

  /** */
  static scale_by_Tensor_from_Canvas_TypedArray( input_Canvas ) {
    let input_ctx = input_Canvas.getContext( "2d" );
    let input_ImageData = input_ctx.getImageData(
      0, 0, input_Canvas.width, input_Canvas.height );

    let output_tensor;
    try {
      output_tensor = NeuralNet.ScaleFiller.createTensor_by_scale_TypedArray(
        input_ImageData.data,
        input_ImageData.height, input_ImageData.width, this.output_channelCount,
        this.output_shape_height_width );

      let output_TypedArray = output_tensor.dataSync();
      return output_TypedArray;

    } finally {
      if ( output_tensor ) {
        output_tensor.dispose();
        output_tensor = null;
      }
    }
  }


  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {

    {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      yield;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        // For pre-compiling WebGL shaders.
        {
          try {
            // After correctness testing done, create all ImageScaling for performance testing.
            this.ImageScaling_PerformanceTest_init();
          } catch ( e ) {
            debugger;
            throw e;
          }

          this.testImageScaling_by_Tensor_from_Canvas();
          this.testImageScaling_by_Tensor_from_Canvas_ImageData();
          this.testImageScaling_by_Tensor_from_Canvas_TypedArray();
        }

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

  // Using mobile phone's resolution ( 1080 * 2160 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1080 * 1920 ).
  const height = 108;
  const width = 192;
  const channelCount = 4;
  const largerFactor = 15;

  globalThis.testSet_108x192x4
    = new HeightWidthDepth( height, width, channelCount, largerFactor );

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
