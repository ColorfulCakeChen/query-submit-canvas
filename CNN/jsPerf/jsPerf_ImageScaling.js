export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../util/TensorTools.js";
//import * as BatchIdCalculator from "./BatchIdCalculator.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

/**
 * Test Image Scaling.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/25367/91/colorfulcakechen-image-scaling-07b4c844e55ccc9fd16f38c0}
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
    this.init( output_height, output_width, output_channelCount, largerFactor );


    //!!! (2023/05/26 Temp Remarked) For test performance if not download from GPU.
    this.bDownloadFromGPU_default = true;
    //this.bDownloadFromGPU_default = false;
  }

  /** */
  init( output_height, output_width, output_channelCount, largerFactor ) {
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

    const contextAttributes = { willReadFrequently: true };

    let input_ImageData;
    {
      let ctx = input_Canvas.getContext( "2d", contextAttributes );
      input_ImageData = this.input_ImageData
        = ctx.getImageData( 0 , 0, input_width, input_height );

      HeightWidthDepth.ImageData_init_fill( input_ImageData );
      ctx.putImageData( input_ImageData, 0 , 0 );
    }

    const input_OffscreenCanvas = this.input_OffscreenCanvas
      = new OffscreenCanvas( input_width, input_height );

    {
      let ctx = input_OffscreenCanvas.getContext( "2d", contextAttributes );
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
    this.input_ImageData = undefined;
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
  testImageScaling_by_Tensor_from_Canvas(
    bDownloadFromGPU = this.bDownloadFromGPU_default ) {
      return HeightWidthDepth.scale_by_Tensor_from_Canvas
      .call( this, this.input_Canvas, bDownloadFromGPU );
  }

  /** */
  testImageScaling_by_Tensor_from_Canvas_ImageData(
    bDownloadFromGPU = this.bDownloadFromGPU_default ) {
      return HeightWidthDepth.scale_by_Tensor_from_Canvas_ImageData
      .call( this, this.input_Canvas, bDownloadFromGPU );
  }

  /** */
  testImageScaling_by_Tensor_from_Canvas_TypedArray(
    bDownloadFromGPU = this.bDownloadFromGPU_default ) {
      return HeightWidthDepth.scale_by_Tensor_from_Canvas_TypedArray
      .call( this, this.input_Canvas, bDownloadFromGPU );
  }


  /** */
  testImageScaling_by_OffscreenCanvas_from_OffscreenCanvas() {
    return HeightWidthDepth.scale_by_OffscreenCanvas_from_Canvas
      .call( this, this.input_OffscreenCanvas );
  }

  /** */
  testImageScaling_by_OffscreenCanvas_from_OffscreenCanvas_ImageData() {
    return HeightWidthDepth.scale_by_OffscreenCanvas_from_Canvas_ImageData
      .call( this, this.input_OffscreenCanvas );
  }

  /** */
  testImageScaling_by_Tensor_from_OffscreenCanvas(
    bDownloadFromGPU = this.bDownloadFromGPU_default ) {
    return HeightWidthDepth.scale_by_Tensor_from_Canvas
      .call( this, this.input_OffscreenCanvas, bDownloadFromGPU );
  }

  /** */
  testImageScaling_by_Tensor_from_OffscreenCanvas_ImageData(
    bDownloadFromGPU = this.bDownloadFromGPU_default ) {
    return HeightWidthDepth.scale_by_Tensor_from_Canvas_ImageData
      .call( this, this.input_OffscreenCanvas, bDownloadFromGPU );
  }

  /** */
  testImageScaling_by_Tensor_from_OffscreenCanvas_TypedArray(
    bDownloadFromGPU = this.bDownloadFromGPU_default ) {
    return HeightWidthDepth.scale_by_Tensor_from_Canvas_TypedArray
      .call( this, this.input_OffscreenCanvas, bDownloadFromGPU );
  }


  /**
   * @return {TypedArray}
   */
  static scale_by_OffscreenCanvas_from_Canvas( input_Canvas ) {
    let output_ImageData = NeuralNet.ScaleFiller
      .createImageData_by_scale_Canvas(
        input_Canvas, this.output_shape_height_width );

    return output_ImageData.data;
  }

  /** */
  static scale_by_OffscreenCanvas_from_Canvas_ImageData( input_Canvas ) {
    let input_ctx = input_Canvas.getContext( "2d" );
    let input_ImageData = input_ctx.getImageData(
      0, 0, input_Canvas.width, input_Canvas.height );

    let output_ImageData = NeuralNet.ScaleFiller
      .createImageData_by_scale_ImageData(
        input_ImageData, this.output_shape_height_width );

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
  static scale_by_Tensor_from_Canvas( input_Canvas, bDownloadFromGPU ) {
    let output_tensor;
    try {
      output_tensor = NeuralNet.ScaleFiller.createTensor_by_scale_PixelData(
        input_Canvas,
        this.output_channelCount,
        this.output_shape_height_width );

      if ( bDownloadFromGPU ) {
        let output_TypedArray = output_tensor.dataSync();
        return output_TypedArray;
      }

    } finally {
      if ( output_tensor ) {
        output_tensor.dispose();
        output_tensor = null;
      }
    }
  }

  /** */
  static scale_by_Tensor_from_Canvas_ImageData( input_Canvas, bDownloadFromGPU ) {
    let input_ctx = input_Canvas.getContext( "2d" );
    let input_ImageData = input_ctx.getImageData(
      0, 0, input_Canvas.width, input_Canvas.height );

    let output_tensor;
    try {
      output_tensor = NeuralNet.ScaleFiller.createTensor_by_scale_PixelData(
        input_ImageData,
        this.output_channelCount,
        this.output_shape_height_width );

      if ( bDownloadFromGPU ) {
        let output_TypedArray = output_tensor.dataSync();
        return output_TypedArray;
      }

    } finally {
      if ( output_tensor ) {
        output_tensor.dispose();
        output_tensor = null;
      }
    }
  }

  /** */
  static scale_by_Tensor_from_Canvas_TypedArray( input_Canvas, bDownloadFromGPU ) {
    let input_ctx = input_Canvas.getContext( "2d" );
    let input_ImageData = input_ctx.getImageData(
      0, 0, input_Canvas.width, input_Canvas.height );

    let output_tensor;
    try {
      output_tensor = NeuralNet.ScaleFiller.createTensor_by_scale_TypedArray(
        input_ImageData.data,
        input_ImageData.height, input_ImageData.width, this.output_channelCount,
        this.output_shape_height_width );

      if ( bDownloadFromGPU ) {
        let output_TypedArray = output_tensor.dataSync();
        return output_TypedArray;
      }

    } finally {
      if ( output_tensor ) {
        output_tensor.dispose();
        output_tensor = null;
      }
    }
  }


  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {
    const funcNameInMessage = "testCorrectness";

    const output_height_original = this.output_height;
    const output_width_original = this.output_width;
    const output_channelCount_original = this.output_channelCount;
    const largerFactor_original = this.largerFactor;

    const TestCaseNameArray = [
      "testImageScaling_by_OffscreenCanvas_from_Canvas",
      "testImageScaling_by_OffscreenCanvas_from_Canvas_ImageData",
      "testImageScaling_by_Tensor_from_Canvas",
      "testImageScaling_by_Tensor_from_Canvas_ImageData",
      "testImageScaling_by_Tensor_from_Canvas_TypedArray",

      "testImageScaling_by_OffscreenCanvas_from_OffscreenCanvas",
      "testImageScaling_by_OffscreenCanvas_from_OffscreenCanvas_ImageData",
      "testImageScaling_by_Tensor_from_OffscreenCanvas",
      "testImageScaling_by_Tensor_from_OffscreenCanvas_ImageData",
      "testImageScaling_by_Tensor_from_OffscreenCanvas_TypedArray",
    ];

    let testCaseId, testCaseName;
    try {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      yield;

      let asserter_Equal;
      try {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        // (Also for pre-compiling WebGL shaders.)
        {
          const acceptableDifferenceRate = 0.05; //0.1; //0.01;
          const acceptableDifference = 3;

          asserter_Equal = TensorTools.Asserter_Equal.Pool.get_or_create_by(
            acceptableDifferenceRate, acceptableDifference );

          // Correctness testing uses smaller shape.
          {
            const output_height_temp = 2;
            const output_width_temp = 3;
            const output_channelCount_temp = 4;
            const largerFactor_temp = 3;

            this.init( output_height_temp, output_width_temp,
              output_channelCount_temp, largerFactor_temp );
            this.ImageScaling_PerformanceTest_init();
          }

          let output_TypedArray_previous;
          let output_TypedArray;
          for ( testCaseId = 0;
            testCaseId < TestCaseNameArray.length; ++testCaseId ) {

            testCaseName = TestCaseNameArray[ testCaseId ];

            // Every test case should have the same result.
            const bDownloadFromGPU = true;
            output_TypedArray = this[ testCaseName ]( bDownloadFromGPU );
            if ( output_TypedArray_previous ) {
              let lhsNumberArray = output_TypedArray_previous;
              let rhsNumberArray = output_TypedArray;
              let lhsNumberArrayName = `output_of_${TestCaseNameArray[ testCaseId - 1 ]}`;
              let rhsNumberArrayName = `output_of_${TestCaseNameArray[ testCaseId ]}`;

              let prefixMsg = `testCaseId=${testCaseId},`;
              let postfixMsg = "";

              asserter_Equal.assert_NumberArray_NumberArray(
                lhsNumberArray, rhsNumberArray,
                prefixMsg,
                lhsNumberArrayName, rhsNumberArrayName,
                postfixMsg );
            }

            output_TypedArray_previous = output_TypedArray;
          }
        }

        let memoryInfo_testCorrectness_after = tf.memory();

        if ( memoryInfo_testCorrectness_after.numTensors != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `testCorrectness() memory leak. `
            + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
            + `should be (${memoryInfo_testCorrectness_before.numTensors} `
          );

      } finally {
        if ( asserter_Equal ) {
          asserter_Equal.disposeResources_and_recycleToPool();
          asserter_Equal = null;
        }
      }

      Pool.Asserter.assert_Pool_issuedCount(
        "jsPerf_ImageScaling.HeightWidthDepth.testCorrectness()",
        pool_all_issuedCount_before );
      yield;

    } catch ( e ) {
      let backendName = tf.getBackend();
      let msg = `jsPerf_ImageScaling.HeightWidthDepth`
        + `.${funcNameInMessage}(): `
        + `backendName=${backendName}, `
        + `testCaseId=${testCaseId}, `
        + `testCaseName=${testCaseName}. `
        + `${e}`;

      console.log( msg );
      alert( `${msg}` );

      debugger;
      throw e;
    }

    try {
      // After correctness testing done, use large shape for performance testing.
      this.init(
        output_height_original, output_width_original,
        output_channelCount_original, largerFactor_original );
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
