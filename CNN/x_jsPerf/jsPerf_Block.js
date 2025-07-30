export { init, testCorrectness, testDifferentDisposeStrategy_All, disposeResources };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
//import * as ValueMax from "../util/ValueMax.js";
import * as RandTools from "../util/RandTools.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as BatchIdCalculator from "../x_tester/Ref/BatchIdCalculator.js";
import * as Block from "../Conv/Block.js";
import * as ChannelShuffler from "../Conv/ChannelShuffler.js";
// import * as TensorPlaceholder from "../Conv/TensorPlaceholder.js";
// import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
// import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
// import * as Depthwise from "../Conv/Depthwise.js";
// import * as Pointwise from "../Conv/Pointwise.js";
import * as Block_Reference from "../x_tester/Ref/Block_Reference.js";
import * as Block_TestParams from "../x_tester/Ref/Block_TestParams.js"; 
import * as ImageSourceBag from "../x_tester/Ref/ImageSourceBag.js"; 
// import * as NumberImage from "../x_tester/Ref/NumberImage.js"; 

/**
 * Test CNN Block.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/11973/1504/colorfulcakechen-cnn-block-3569f0d8a3260ea9a08d9c50affc}
 */

/**
 * 
 */
class PerformanceTestCase extends Recyclable.Root {

  /**
   * Used as default PerformanceTestCase provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "PerformanceTestCase.Pool",
    PerformanceTestCase );

  /** */
  constructor(
    testCaseId, testCaseName, blockTestParams, testCorrectnessInfo ) {
    super();
    this.#setAsConstructor_self(
      testCaseId, testCaseName, blockTestParams, testCorrectnessInfo
    );
  }

  /** @override */
  setAsConstructor(
    testCaseId, testCaseName, blockTestParams, testCorrectnessInfo ) {
    super.setAsConstructor();
    this.#setAsConstructor_self(
      testCaseId, testCaseName, blockTestParams, testCorrectnessInfo
    );
  }

  /**  */
  #setAsConstructor_self(
    testCaseId, testCaseName, blockTestParams, testCorrectnessInfo ) {
    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.blockTestParams = blockTestParams;
    this.block = undefined;
    this.testCorrectnessInfo = testCorrectnessInfo;
  }

  /**
   * 
   */
  prepare( testCaseName ) {

    try {
      const blockTestParams = this.blockTestParams;
      const testCorrectnessInfo = this.testCorrectnessInfo;

      let {
        imageInArraySelected, channelShuffler_ConcatPointwiseConv
      } = testCorrectnessInfo;
 
      let block = Block_Reference.Base.block_create(
        null,                              // parentNameable
        `Block_Reference_${testCaseName}`, // blockName
        blockTestParams,
        imageInArraySelected[ 0 ].boundsArraySet.output0,
        imageInArraySelected[ 1 ]?.boundsArraySet.output0,
        channelShuffler_ConcatPointwiseConv );

      this.block = block;

      console.log( `Block.${this.testCaseName}: tensorWeightCount = { `
        + `Extracted: ${block.tensorWeightCountExtracted}, `
        + `Total: ${block.tensorWeightCountTotal} }` );

    } catch ( e ) {
      debugger;
      throw e;
    }
  }

  /** @override */
  disposeResources() {

    this.testCorrectnessInfo?.disposeResources_and_recycleToPool();
    this.testCorrectnessInfo = null;

    this.block?.disposeResources_and_recycleToPool();
    this.block = null;

    this.blockTestParams?.disposeResources_and_recycleToPool();
    this.blockTestParams = null;

    this.testCaseName = undefined;
    this.testCaseId = undefined;

    super.disposeResources();
  }

}

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

    this.disposeResources();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;
    this.concatenatedShape = [ height, width, depth ];
    this.outputGroupCount = 2; // Only support two convolution groups.
  }

  disposeResources() {
    this.block_PerformanceTest_release();
  }

  /**
   * 
   */
  block_PerformanceTest_addCase( testCaseName, blockTestParams ) {
    try {
      let testCorrectnessInfo
        = Block_Reference.TestCorrectnessInfo.Pool.get_or_create_by();

      testCorrectnessInfo.prepareBy(
        this.testPerformance_imageSourceBag,
        blockTestParams,
        this.testPerformance_channelShufflerBag );

      let aPerformanceTestCase = PerformanceTestCase.Pool.get_or_create_by(
        blockTestParams.id, testCaseName,
        blockTestParams, testCorrectnessInfo );

      this.testCaseMap.set( testCaseName, aPerformanceTestCase );

    } catch ( e ) {
      debugger;
      throw e;
    }
  }

  block_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger
    // different input image from correctness testing.
    this.disposeResources();

    // Larger input image for performance testing.
    this.testPerformance_imageSourceBag
      = ImageSourceBag.Base.Pool.get_or_create_by();
    this.testPerformance_channelShufflerBag
      = ChannelShuffler.Bag.Pool.get_or_create_by(
          ChannelShuffler.ConcatPointwiseConv.Pool );

    if ( this.testCaseMap )
      this.testCaseMap.clear();
    else
      this.testCaseMap = new Map();

    // input0_height, input0_width, input0_channelCount,
    // nConvBlockTypeId,
    // pointwise1ChannelCount
    // depthwise_AvgMax_Or_ChannelMultiplier,
    // depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    // depthwiseActivationId,
    // pointwise20ChannelCount, pointwise20ActivationId,
    // nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    // nActivationId,
    // bKeepInputTensor, bTableLog
    //
    //
    // The block for performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will
    //       be destroyed.
    //
    const bKeepInputTensor = true;
    const bTableLog = false;

    // Test Case 0: (pointwise1 (bias, COS), depthwise (channelMultiplier = 1, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "DConv_1_bias_COS_AddInputToOutput",
      Block_TestParams.Base.Pool.get_or_create_by( 0 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
            8,
            1,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      )
    );

    // Test Case 1: (pointwise1 (bias, COS), depthwise (avg pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "Avg_bias_COS_AddInputToOutput",
      Block_TestParams.Base.Pool.get_or_create_by( 1 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
            8,
          Block.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG,
                  3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      )
    );

    // Test Case 2: (pointwise1 (bias, COS), depthwise (max pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "Max_bias_COS_AddInputToOutput",
      Block_TestParams.Base.Pool.get_or_create_by( 2 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
            8,
          Block.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,
                  3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      )
    );

    // Test Case 3: (pointwise1 (bias, COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "DConv_2_bias_COS_AddInputToOutput",
      Block_TestParams.Base.Pool.get_or_create_by( 3 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
            8,
            2,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      )
    );

    // Test Case 4: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "DConv_2_COS_AddInputToOutput",
      Block_TestParams.Base.Pool.get_or_create_by( 4 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
            8,
            2,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      )
    );

    // Test Case 5: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS))
    this.block_PerformanceTest_addCase(
      "DConv_2_COS",
      Block_TestParams.Base.Pool.get_or_create_by( 5 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
            8,
            2,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      )
    );

    // Test Case 6: (pointwise1 (none), depthwise (channelMultiplier = 16, strides = 1, pad = same, bias, COS), pointwise2 (bias))
    this.block_PerformanceTest_addCase(
      "DConv_16_bias_COS_P64_bias",
      Block_TestParams.Base.Pool.get_or_create_by( 6 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
            0,
           16,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
           64, Block.Params.pointwise20ActivationId.valueDesc.Ids.NONE,

        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      )
    );

    // Test Case 7: (pointwise1 (bias, COS), depthwise (none), pointwise2 (bias))
    this.block_PerformanceTest_addCase(
      "P64_bias_COS_P64_bias",
      Block_TestParams.Base.Pool.get_or_create_by( 7 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
           64,
            0,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
           64, Block.Params.pointwise20ActivationId.valueDesc.Ids.NONE,

        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      )
    );

  }

  /** Release testCase.block, but keep testCase. */
  block_PerformanceTest_release_block() {
    if ( this.testCaseMap ) {
      for ( let testCase of this.testCaseMap.values() ) {
        if ( testCase.block ) {
          testCase.block.disposeResources_and_recycleToPool();
          testCase.block = null;
        }
      }
    }
  }

  /** */
  block_PerformanceTest_release() {
    if ( this.testCaseMap ) {
      for ( let testCase of this.testCaseMap.values() ) {
        testCase.disposeResources_and_recycleToPool();
      }
      this.testCaseMap.clear();
    }

    this.testPerformance_imageSourceBag?.disposeResources_and_recycleToPool();
    this.testPerformance_imageSourceBag = null;

    this.testPerformance_channelShufflerBag?.disposeResources_and_recycleToPool();
    this.testPerformance_channelShufflerBag = null;
  }

  /** Test apply by Xxx */
  testBlock_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );

    // First time test this case. Release all other test cases' block
    // (so that there will be enough memory). Create the specified block.
    if ( !testCase.block ) {
      this.block_PerformanceTest_release_block();
      testCase.prepare( testCaseName );
    }

    let block = testCase.block;

    let {
      inputTensor3dArray, outputTensor3dArray
    } = testCase.testCorrectnessInfo;

    {
      block.input0.realTensor = inputTensor3dArray[ 0 ];
      if ( block.input1 )
        block.input1.realTensor = inputTensor3dArray[ 1 ];

      block.apply();

      outputTensor3dArray[ 0 ] = block.output0.realTensor;
      outputTensor3dArray[ 1 ] = block.output1?.realTensor;
    }

    tf.dispose( outputTensor3dArray );
  }

  // Testing whether the results of different implementation are the same.
  * testCorrectness() {
    try {
      // After correctness testing done, create all Block for performance
      // testing.
      this.block_PerformanceTest_init();
    } catch ( e ) {
      debugger;
      throw e;
    }
  }

  testDifferentDisposeStrategy_All() {
//     this.testDifferentDisposeStrategy_ConcatReshapeTransposeReshapeSplit();
  }

//   testDifferentDisposeStrategy( functionTable, thisArg ) {
//     tf.tidy( () => {
//       let funcPrev;
//       let tArrayPrev;
//
//       for ( let i = 0; i < functionTable.length; ++i ) {
//         let func = functionTable[ i ];//
//         let memoryInfoPrev = tf.memory();
//         let tArray = func.call( thisArg, this.dataTensor3dArray );
//         let memoryInfo = tf.memory();
//
//         if ( memoryInfo.numTensors != ( memoryInfoPrev.numTensors + tArray.length ) )
//           throw Error( `${func.name}() memory leak` );
//
//         if ( tArrayPrev ) {
//           if( !TensorTools.Comparator.isTensorArrayEqual( tArrayPrev, tArray ) )
//             throw Error( `${funcPrev.name}() != ${func.name}()` );
//         }
//
//         tf.dispose( tArrayPrev );
//
//         funcPrev = func;
//         tArrayPrev = tArray;
//       }
//     });
//   }

}

function init() {
  //console.log("jsPerf_Block.js, init()");

  disposeResources();

  let depth = 4;

  // Using mobile phone's resolution ( 2160 * 1080 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1920 * 1080 ).
  globalThis.testSet_108x192x4 = new HeightWidthDepth(
    108, 192, depth ); // height, width, depth

  globalThis.testSet_108x192x4_All = [
    globalThis.testSet_108x192x4
  ];
}

function* testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_108x192x4_All.length; ++i ) {
    let testSet = globalThis.testSet_108x192x4_All[ i ];
    yield* testSet.testCorrectness();
  }
}

function testDifferentDisposeStrategy_All() {
  for ( let i = 0; i < globalThis.testSet_108x192x4_All.length; ++i ) {
    let testSet = globalThis.testSet_108x192x4_All[ i ];
    testSet.testDifferentDisposeStrategy_All();
  }
}

function disposeResources() {
  if ( globalThis.testSet_108x192x4_All ) {
    for ( let i = 0; i < globalThis.testSet_108x192x4_All.length; ++i ) {
      let testSet = globalThis.testSet_108x192x4_All[ i ];
      if ( testSet )
        testSet.disposeResources();
    }

    globalThis.testSet_108x192x4_All = null;
  }

  globalThis.testSet_108x192x4
    = null;
}
