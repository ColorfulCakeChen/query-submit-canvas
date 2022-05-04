export { init, testCorrectness, disposeTensors };

//import * as TensorTools from "../util/TensorTools.js";
//import * as ValueMax from "../ValueMax.js";
//import * as ValueRange from "../Unpacker/ValueRange.js";
//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Block from "../Conv/Block.js";
import * as Block_Reference from "./Ref/Block_Reference.js";
import * as Block_TestParams from "./Ref/Block_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 


/**
 * Test CNN Block.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/15055/90/colorfulcakechen-cnn-block-a4bc81be0a8974ea17d20da05fdf}
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
      
    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeTensors();

    // Larger input image for performance testing.
    let inputTensorCount = 1;
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

//!!! ...unfinished... (2021/10/12 Remarked)
//     this.performanceTestNames = [
//       "NotShuffleNet_NotMobileNet_Pointwise1Rate_0",
//       "NotShuffleNet_NotMobileNet_Pointwise1Rate_1",
//       "NotShuffleNet_NotMobileNet_Pointwise1Rate_2",
//
//       "MobileNet_Step_N_Pointwise1Rate_0",
//       "MobileNet_Step_N_Pointwise1Rate_1",
//       "MobileNet_Step_N_Pointwise1Rate_2",
//
//       "ShuffleNetV2_Step_N_Pointwise1Rate_0",
//       "ShuffleNetV2_Step_N_Pointwise1Rate_1",
//       "ShuffleNetV2_Step_N_Pointwise1Rate_2",
//
//       "ShuffleNetV2_ByPointwise22_Step_N_Pointwise1Rate_0",
//       "ShuffleNetV2_ByPointwise22_Step_N_Pointwise1Rate_1",
//       "ShuffleNetV2_ByPointwise22_Step_N_Pointwise1Rate_2",
//     ];

    // sourceHeight, sourceWidth, sourceChannelCount, stepCountRequested, pointwise1ChannelCountRate,
    // depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd,
    // nWhetherShuffleChannel, bKeepInputTensor
    //
    //
    // The block performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
    //

//!!! ...unfinished... (2021/10/11) Perhaps, drop MobileNetV2_Pointwise1Rate_0, MobileNetV2_Pointwise1Rate_1,
// ShuffleNetV2_Pointwise1Rate_1, ShuffleNetV2_Pointwise1Rate_2, ShuffleNetV2_ByPointwise22_Pointwise1Rate_2.
// Because they are unfair.

    this.testCaseMap = new Map();

    // Test Case 1: (NotShuffleNet_NotMobileNet, pointwise1ChannelCountRate 0)
    this.testCaseMap.set( "NotShuffleNet_NotMobileNet_Pointwise1Rate_0", { testParams: 
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, 1, 0,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.NONE,
        true
      ) } );

    // Test Case 2: (NotShuffleNet_NotMobileNet, pointwise1ChannelCountRate 1)
    this.testCaseMap.set( "NotShuffleNet_NotMobileNet_Pointwise1Rate_1", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, 1, 1,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.NONE,
        true
      ) } );

    // Test Case 3: (NotShuffleNet_NotMobileNet, pointwise1ChannelCountRate 2)
    this.testCaseMap.set( "NotShuffleNet_NotMobileNet_Pointwise1Rate_2", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, 1, 2,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.NONE,
        true
      ) } );


    // For calculate the step count.
    let stepCountRequested;
    for ( let name_testCase of this.testCaseMap.entries() ) {
      let name = name_testCase[ 0 ];
      let testCase = name_testCase[ 1 ];
      if ( !testCase.block ) {
        testCase.block = Block_Reference.Base.Block_create( testCase.testParams );
        stepCountRequested = testCase.block.stepCount;
      }
    }

    // Test Case 4: (MobileNet, Step N, pointwise1ChannelCountRate 0)
    this.testCaseMap.set( "MobileNet_Step_N_Pointwise1Rate_0", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 0,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.NONE,
        true
      ) } );

    // Test Case 5: (MobileNet, Step N, pointwise1ChannelCountRate 1)
    this.testCaseMap.set( "MobileNet_Step_N_Pointwise1Rate_1", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 1,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.NONE,
        true
      ) } );

    // Test Case 6: (MobileNet, Step N, pointwise1ChannelCountRate 2)
    this.testCaseMap.set( "MobileNet_Step_N_Pointwise1Rate_2", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 2,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.NONE,
        true
      ) } );


    // Test Case 7: (ShuffleNetV2, Step N, pointwise1ChannelCountRate 0)
    this.testCaseMap.set( "ShuffleNetV2_Step_N_Pointwise1Rate_0", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 0,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_CHANNEL_SHUFFLER,
        true
      ) } );

    // Test Case 8: (ShuffleNetV2, Step N, pointwise1ChannelCountRate 1)
    this.testCaseMap.set( "ShuffleNetV2_Step_N_Pointwise1Rate_1", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 1,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_CHANNEL_SHUFFLER,
        true
      ) } );

    // Test Case 9: (ShuffleNetV2, Step N, pointwise1ChannelCountRate 2)
    this.testCaseMap.set( "ShuffleNetV2_Step_N_Pointwise1Rate_2", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 2,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_CHANNEL_SHUFFLER,
        true
      ) } );


    // Test Case 10: (ShuffleNetV2_ByPointwise22, Step N, pointwise1ChannelCountRate 0)
    this.testCaseMap.set( "ShuffleNetV2_ByPointwise22_Step_N_Pointwise1Rate_0", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 0,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_POINTWISE22,
        true
      ) } );

    // Test Case 11: (ShuffleNetV2_ByPointwise22, Step N, pointwise1ChannelCountRate 1)
    this.testCaseMap.set( "ShuffleNetV2_ByPointwise22_Step_N_Pointwise1Rate_1", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 1,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_POINTWISE22,
        true
      ) } );

    // Test Case 12: (ShuffleNetV2_ByPointwise22, Step N, pointwise1ChannelCountRate 2)
    this.testCaseMap.set( "ShuffleNetV2_ByPointwise22_Step_N_Pointwise1Rate_2", { testParams:
      ( new Block_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth, stepCountRequested, 2,
        3, ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
        ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_POINTWISE22,
        true
      ) } );


    // Create the different Block objects for performance testing.
    for ( let name_testCase of this.testCaseMap.entries() ) {
      let name = name_testCase[ 0 ];
      let testCase = name_testCase[ 1 ];
      if ( !testCase.block ) {
        testCase.block = Block_Reference.Base.Block_create( testCase.testParams );
      }

      console.log( `Block.${name}: tensorWeightCount = { Extracted: ${testCase.block.tensorWeightCountExtracted}, ` 
        + `Total: ${testCase.block.tensorWeightCountTotal} }` );
    }

  }

  block_PerformanceTest_release() {
    if ( this.testCaseMap ) {
      for ( let name_testCase of this.testCaseMap.entries() ) {
        let name = name_testCase[ 0 ];
        let testCase = name_testCase[ 1 ];
        if ( testCase.block ) {
          testCase.block.disposeTensors();
        }
      }
      this.testCaseMap = null;
    }
  }

  // Test apply by Xxx
  testBlock_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );
    let block = testCase.block;
    let outputTensor3d = block.apply( this.dataTensor3dArray[ 0 ] );
    tf.dispose( outputTensor3d );
  }

//!!! ...unfinished... (2022/05/04)
// assert pointwise2's bias for MobileNet with ( bPointwise1 == true ) in multiple blocks situation.

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

        // Note: imageSourceBag should not be created outside tidy() because tidy() will dispose tensors
        //       dynamically created in them.
        let imageSourceBag = new ImageSourceBag.Base( originalImageSize.height, originalImageSize.width );

        let testParams = new Block_TestParams.Base();
        let testParamsGenerator = testParams.ParamsGenerator( originalImageSize.height, originalImageSize.width, originalImageSize.depth );
        let testReference = new Block_Reference.Base();

        let batchMessageInterval = 10 * 1000; // Every so many test cases, display a message.

        try {
          for ( testParams of testParamsGenerator ) {
            if ( ( testParams.id % batchMessageInterval ) == 0 ) {
              console.log( `${tf.getBackend()}, `
                + `input image ( height, width ) = ( ${imageSourceBag.originalHeight}, ${imageSourceBag.originalWidth} ), `
                + `testParams.id between [${testParams.id} - ${testParams.id + batchMessageInterval - 1}] ...` );
            }

            testReference.testCorrectness( imageSourceBag, testParams );
          }

        } catch ( e ) {
          let backendName = tf.getBackend();
          console.log( `jsPerf_Block.js: testCorrectness(): backendName=${backendName}, `
            + `Block testParams.id == ${testParams.id}` );
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
