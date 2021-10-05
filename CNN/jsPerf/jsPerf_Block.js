export { init, testCorrectness, disposeTensors };

//import * as ValueMax from "../ValueMax.js";
//import * as ValueRange from "../Unpacker/ValueRange.js";
//import * as ParamDesc from "../Unpacker/ParamDesc.js";
//import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as TensorTools from "../util/TensorTools.js";
import * as Block from "../Conv/Block.js";
import * as Block_Reference from "./Ref/Block_Reference.js";
import * as Block_TestParams from "./Ref/Block_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 


/**
 * Test CNN Block.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/15055/0/colorfulcakechen-cnn-block-c853a5e0e99cb69685bdb85a004c}
 */

/**
 * A test set.
 */
class HeightWidthDepth {

  /**
   * @param {number} height            image height
   * @param {number} width             image width
   * @param {number} depth             image channel count
   */
  constructor( height, width, depth ) {

    this.disposeTensors();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;
  }

  disposeTensors() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }

    this.block_PerformanceTest_release();
  }

  block_PerformanceTest_init() {
      
//!!! ...unfinished... (2021/09/28)


    let pointwise_4to8_FiltersArray =
    [
       1,  4,  2,  3, -3, -2,  4,  1,
       2,  3, -3, -2,  4,  1,  1,  4,
      -3, -2,  4,  1,  1,  4,  2,  3,
       4,  1,  1,  4,  2,  3, -3, -2,
    ];

    let pointwise_4to8_BiasesArray =
    [ 3, 4, 5, 6, 7, 8, 9, 10, ];

    // (If value too large (out of float32 range), the result will strange. So, use smaller and negative value.)
    let depthwise_8to16_FiltersArray =
    [
       1, -9, -5,  7,  2,  8,  4,  1, -3,  7, -6,  9,  4, -6,  8, -2,
       2,  8,  4,  1, -3,  7, -6,  9,  4, -6,  8, -2,  5,  5, -7, -3,
      -3,  7, -6,  9,  4, -6,  8, -2,  5,  5, -7, -3,  6,  4,  9,  5,

       4, -6,  8, -2,  5,  5, -7, -3,  6,  4,  9,  5,  7,  3, -3,  4,
       5,  5, -7, -3,  6,  4,  9,  5,  7,  3, -3,  4, -8,  2,  1, -8,
       6,  4,  9,  5,  7,  3, -3,  4, -8,  2,  1, -8, -9,  1, -2,  6,

       7,  3, -3,  4, -8,  2,  1, -8, -9,  1, -2,  6,  1, -9, -5,  7,
      -8,  2,  1, -8, -9,  1, -2,  6,  1, -9, -5,  7,  2,  8,  4,  1,
      -9,  1, -2,  6,  1, -9, -5,  7,  2,  8,  4,  1, -3,  7, -6,  9,
    ];

    let depthwise_8to16_BiasesArray =
    [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, ];

    let depthwise_4to128_FiltersArray = [ ... new Array( 3 * 3 * 4 * 32 ).keys() ]; // filterHeight * filterWidth * inChannel * channelMultiplier
    let depthwise_Xto128_BiasesArray =  [ ... new Array(         4 * 32 ).keys() ]; // inChannel * channelMultiplier

    let depthwise_8to8_FiltersArray =
    [
       1, -9, -5,  7,  2,  8,  4,  1,
       2,  8,  4,  1, -3,  7, -6,  9,
      -3,  7, -6,  9,  4, -6,  8, -2,

       4, -6,  8, -2,  5,  5, -7, -3,
       5,  5, -7, -3,  6,  4,  9,  5,
       6,  4,  9,  5,  7,  3, -3,  4,

       7,  3, -3,  4, -8,  2,  1, -8,
      -8,  2,  1, -8, -9,  1, -2,  6,
      -9,  1, -2,  6,  1, -9, -5,  7,
    ];

    let depthwise_8to8_BiasesArray =
    [ 101, 102, 103, 104, 105, 106, 107, 108, ];

    let pointwise_16to4_FiltersArray =
    [
      11, 21, 31, 41,
      12, 22, 32, 42,
      13, 23, 33, 43,
      14, 24, 34, 44,
      15, 25, 35, 45,
      16, 26, 36, 46,
      17, 27, 37, 47,
      18, 28, 38, 48,
      19, 29, 39, 49,
      20, 30, 40, 50,
      21, 31, 41, 51,
      22, 32, 42, 52,
      23, 33, 43, 53,
      24, 34, 44, 54,
      25, 35, 45, 55,
      26, 36, 46, 56,
    ];

    let pointwise_8to4_FiltersArray =
    [
      11, 21, 31, 41,
      12, 22, 32, 42,
      13, 23, 33, 43,
      14, 24, 34, 44,
      15, 25, 35, 45,
      16, 26, 36, 46,
      17, 27, 37, 47,
      18, 28, 38, 48,
    ];

    let pointwise_4to128_FiltersArray =   [ ... new Array(   4 * 128 ).keys() ]; // inChannel * outChannel
    let pointwise_128to128_FiltersArray = [ ... new Array( 128 * 128 ).keys() ]; // inChannel * outChannel

    let pointwise_Xto4_BiasesArray =
    [ 201, 202, 203, 204, ];

    let pointwise_Xto128_BiasesArray =    [ ... new Array( 128 ).keys() ];       // outChannel

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeTensors();

    // Larger input image for performance testing.
    let inputTensorCount = 2;
    this.testPerformance_ImageDataArray = new Array( inputTensorCount );
    this.dataTensor3dArray = tf.tidy( () => {
      let dataTensor3dArray = new Array( inputTensorCount );

      let shape = [ this.height, this.width, this.depth ];
      let length = tf.util.sizeFromShape( shape );

      for ( let i = 0; i < dataTensor3dArray.length; ++i ) {
        let numberBegin = ( i * length );
        let numberEnd = numberBegin + length;

        let t = tf.range( numberBegin, numberEnd, 1 );
        let dataTensor3d = tf.reshape( t, shape );
        dataTensor3dArray[ i ] = dataTensor3d;

        this.testPerformance_ImageDataArray[ i ] = {
          height: this.height, width: this.width, depth: this.depth,
          dataArray: dataTensor3d.dataSync()
        };
      }

      return dataTensor3dArray;
    });


    // sourceHeight, sourceWidth, sourceChannelCount, stepCountRequested, pointwise1ChannelCountRate,
    // depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd, nWhetherShuffleChannel, bKeepInputTensor
    //

//!!! ...unfinished... (2021/09/28)

    // The block performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
    //

    // Test Case: (pointwise1 (bias, COS), depthwise (channelMultiplier = 1, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_Xxx =
    new Block_TestParams.Base().set_By_ParamsScattered(
      
//!!! ...unfinished... (2021/09/28)

      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          1,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
      false,
       true
    );


    // Different Block objects.
    //
    // ( bKeepInputTensor )
    this.block_list = [

//!!! ...unfinished... (2021/09/28)

      // The Block for performance testing.
      this.block_Xxx
        = Block_Reference.Base.Block_create(
            testCase_pointwise1_4to8_bias_COS_depthwise_8to8_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput,
            channelShuffler_ConcatPointwiseConv ),

    ];

  }

  block_PerformanceTest_release() {
    if ( this.block_list ) {
      for ( let i = 0; i < this.block_list.length; ++i ) {
        let block = this.block_list[ i ];
        block.disposeTensors();
      }
      this.block_list = this.pointDepthPoint_DConv = null;
    }
  }

//!!! ...unfinished... (2021/09/28)

  // Test apply by Xxx
  test_Xxx() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_DConv_1_bias_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  // Testing whether the results of different implementation are the same.
  testCorrectness() {

    tf.tidy( () => {

      let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

      // Test different input image width (even and odd).
      let originalImageSizeArray = [
        { height: 3, width: 4, depth: 4 },
        { height: 3, width: 5, depth: 4 },
      ];

      for ( let originalImageSize of originalImageSizeArray ) {

//!!! ...unfinished... (2021/09/28)

        // Note: imageSourceBag should not be created outside tidy() because tidy() will dispose tensors
        //       dynamically created in them.
        let imageSourceBag = new ImageSourceBag.Base( originalImageSize.height, originalImageSize.width );

        let testParams = new Block_TestParams.Base();
        let testParamsGenerator = testParams.ParamsGenerator( originalImageSize.height, originalImageSize.width );
        let testReference = new Block_Reference.Base();

        let batchMessageInterval = 30 * 1000; //100 * 1000; // Every so many test cases, display a message.
        let testParams;

        try {
          for ( let testParams of testParamsGenerator ) {
            if ( ( testParams.id % batchMessageInterval ) == 0 ) {
              console.log( `${tf.getBackend()}, `
                + `input image ( height, width ) = ( ${imageSourceBag.originalHeight}, ${imageSourceBag.originalWidth} ), `
                + `testParams.id between [${testParams.id} - ${testParams.id + batchMessageInterval - 1}] ...` );
            }

            testReference.testCorrectness( imageSourceBag, testParams );
          }

        } catch ( e ) {
          let backendName = tf.getBackend();
          console.log( `backendName=${backendName}, `
            + `Block this.testParams.id = ${this.testParams.id}` );
          throw e;
        }

        imageSourceBag.disposeTensors();
      }

      let memoryInfo_testCorrectness_after = tf.memory();

      tf.util.assert( ( memoryInfo_testCorrectness_after.numTensors == memoryInfo_testCorrectness_before.numTensors ),
        `testCorrectness() memory leak. `
          + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
          + `should be (${memoryInfo_testCorrectness_before.numTensors} `
          + `` );
    });

    // After correctness testing done, create all Block for performance testing.
    this.block_PerformanceTest_init();
  }

}


function init() {
  //console.log("jsPerf_Block.js, init()");

  disposeTensors();

  let depth = 4;

  // Using mobile phone's resolution ( 2160 * 1080 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1920 * 1080 ).
  globalThis.testSet_108x192x4 = new HeightWidthDepth( 108, 192, depth ); // height, width, depth

  globalThis.testSet_All = [
    globalThis.testSet_108x192x4
  ];
}

function testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
    let testSet = globalThis.testSet_All[ i ];
    testSet.testCorrectness();
  }
}

function disposeTensors() {
  if ( globalThis.testSet_All ) {
    for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
      let testSet = globalThis.testSet_All[ i ];
      if ( testSet )
        testSet.disposeTensors();
    }

    globalThis.testSet_All = null;
  }

  globalThis.testSet_108x192x4
    = null;
}
