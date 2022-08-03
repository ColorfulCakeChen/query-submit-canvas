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
import * as BatchIdCalculator from "./BatchIdCalculator.js";
import * as Block from "../Conv/Block.js";
import * as ChannelShuffler from "../Conv/ChannelShuffler.js";
import * as TensorPlaceholder from "../Conv/TensorPlaceholder.js";
import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as Depthwise from "../Conv/Depthwise.js";
import * as Pointwise from "../Conv/Pointwise.js";
import * as Block_Reference from "./Ref/Block_Reference.js";
import * as Block_TestParams from "./Ref/Block_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 
import * as NumberImage from "./Ref/NumberImage.js"; 
import * as jsPerf_FloatValue_ScaleTranslate from "./jsPerf_FloatValue_ScaleTranslate.js";
import * as jsPerf_FloatValue_Bounds from "./jsPerf_FloatValue_Bounds.js";
import * as jsPerf_Operation from "./jsPerf_Operation.js";

/**
 * Test CNN Block.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/11973/1401/colorfulcakechen-cnn-block-463360cf7324d7983e74c14486ea}
 */

/**
 * 
 */
 class PerformanceTestCase {
  constructor( testCaseId, testCaseName, blockTestParams, block, testCorrectnessInfo ) {
    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.blockTestParams = blockTestParams;
    this.block = block;
    this.testCorrectnessInfo = testCorrectnessInfo;
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
      let testCorrectnessInfo = Block_Reference.TestCorrectnessInfo.Pool.get_or_create_by();
      testCorrectnessInfo.prepareBy(
        this.testPerformance_imageSourceBag,
        blockTestParams,
        this.testPerformance_channelShufflerBag );

      let {
        imageInArraySelected, channelShuffler_ConcatPointwiseConv
      } = testCorrectnessInfo;
 
      let block = BlockReference_Base.block_create( blockTestParams,
        imageInArraySelected[ 0 ].boundsArraySet.output0,
        imageInArraySelected[ 1 ]?.boundsArraySet.output0,
        channelShuffler_ConcatPointwiseConv );

      let aPerformanceTestCase = new PerformanceTestCase(
        blockTestParams.id, testCaseName, blockTestParams, block, testCorrectnessInfo );

      this.testCaseMap.set( testCaseName, aPerformanceTestCase );

      console.log( `Block.${testCaseName}: tensorWeightCount = { `
        + `Extracted: ${block.tensorWeightCountExtracted}, `
        + `Total: ${block.tensorWeightCountTotal} }` );

    } catch ( e ) {
      debugger;
      throw e;
    }
  }

  block_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeResources();

    // Larger input image for performance testing.
    this.testPerformance_imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by();
    this.testPerformance_channelShufflerBag = ChannelShuffler.Bag.Pool.get_or_create_by( ChannelShuffler.ConcatPointwiseConv.Pool );

    if ( this.testCaseMap )
      this.testCaseMap.clear();
    else
      this.testCaseMap = new Map();

    // input0_height, input0_width, input0_channelCount,
    // nConvBlockTypeId,
    // pointwise1ChannelCount
    // depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    // depthwiseActivationId,
    // pointwise20ChannelCount, pointwise20ActivationId,
    // nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    // nActivationId,
    // bKeepInputTensor
    //
    //
    // The block for performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
    //


    // Test Case 0: (pointwise1 (bias, COS), depthwise (channelMultiplier = 1, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "DConv_1_bias_COS_AddInputToOutput",
      new Block_TestParams.Base( 0 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
            8,
            1,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      )
    );

    // Test Case 1: (pointwise1 (bias, COS), depthwise (avg pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "Avg_bias_COS_AddInputToOutput",
      new Block_TestParams.Base( 1 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
            8,
          Block.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG,
                  3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      )
    );

    // Test Case 2: (pointwise1 (bias, COS), depthwise (max pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "Max_bias_COS_AddInputToOutput",
      new Block_TestParams.Base( 2 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
            8,
          Block.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,
                  3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      )
    );

    // Test Case 3: (pointwise1 (bias, COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "DConv_2_bias_COS_AddInputToOutput",
      new Block_TestParams.Base( 3 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
            8,
            2,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
    );

    // Test Case 4: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS), AddInputToOutput)
    this.block_PerformanceTest_addCase(
      "DConv_2_COS_AddInputToOutput",
      new Block_TestParams.Base( 4 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
            8,
            2,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      )
    );

    // Test Case 5: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS))
    this.block_PerformanceTest_addCase(
      "DConv_2_COS",
      new Block_TestParams.Base( 5 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
            8,
            2,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
            4, Block.Params.pointwise20ActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      )
    );

    // Test Case 6: (pointwise1 (none), depthwise (channelMultiplier = 32, strides = 1, pad = same, bias, COS), pointwise2 (bias))
    this.block_PerformanceTest_addCase(
      "DConv_32_bias_COS_P128_bias",
      new Block_TestParams.Base( 6 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
            0,
          32,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
          128, Block.Params.pointwise20ActivationId.valueDesc.Ids.NONE,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      )
    );

    // Test Case 7: (pointwise1 (bias, COS), depthwise (none), pointwise2 (bias))
    this.block_PerformanceTest_addCase(
      "P128_bias_COS_P128_bias",
      new Block_TestParams.Base( 7 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
          128,
            0,     3, 3, 1, Block.Params.depthwiseActivationId.valueDesc.Ids.CLIP_BY_VALUE_N2_P2,
          128, Block.Params.pointwise20ActivationId.valueDesc.Ids.NONE,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      )
    );

  }

  block_PerformanceTest_release() {
    if ( this.testCaseMap ) {
      for ( let name_testCase of this.testCaseMap.entries() ) {
        let name = name_testCase[ 0 ];
        let testCase = name_testCase[ 1 ];
        testCase.block.disposeResources_and_recycleToPool();
        testCase.testCorrectnessInfo.disposeResources_and_recycleToPool();
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

  test_FloatValue() {
    jsPerf_FloatValue_ScaleTranslate.testCorrectness();
    jsPerf_FloatValue_Bounds.testCorrectness();
  }

  test_Weights_Float32Array_RestrictedClone() {

    let inputArray = new Float32Array( [
      undefined, null, "", "A", "2", Number.NaN,
      Number.NEGATIVE_INFINITY,
           -Math.pow( 2, +25 ), -Math.pow( 2, +24 ), -Math.pow( 2, +23 ),
           -Math.pow( 2, -23 ), -Math.pow( 2, -24 ), -Math.pow( 2, -25 ),
                             0,
           +Math.pow( 2, -25 ), +Math.pow( 2, -24 ), +Math.pow( 2, -23 ),
           +Math.pow( 2, +23 ), +Math.pow( 2, +24 ), +Math.pow( 2, +25 ),
      Number.POSITIVE_INFINITY,
    ] );

    const POSITIVE_MAX = Weights.Base.ValueBounds.upper;
    const NEGATIVE_MIN = Weights.Base.ValueBounds.lower;

    let verifyArray = new Float32Array( [
      0, 0, 0, 0, 2, 0,
       NEGATIVE_MIN,
       NEGATIVE_MIN,  NEGATIVE_MIN, -( 2 ** +23 ),
      -( 2 ** -23 ), -( 2 ** -24 ), -( 2 ** -25 ),
                  0,
      +( 2 ** -25 ), +( 2 ** -24 ), +( 2 ** -23 ),
      +( 2 ** +23 ),  POSITIVE_MAX,  POSITIVE_MAX,
       POSITIVE_MAX,
    ] );

    let outputArray = Weights.Base.ValueBounds.Float32Array_RestrictedClone( inputArray );

    if ( inputArray.length != outputArray.length )
      throw Error( `test_Weights_Float32Array_RestrictedClone(): `
        + `inputArray.length ( ${inputArray.length} ) `
        + `should be the same as outputArray.length ( ${outputArray.length} ).`
      );

    for ( let i = 0; i < inputArray.length; ++i ) {
      let inputElement = inputArray[ i ];
      let verifyElement = verifyArray[ i ];
      let outputElement = outputArray[ i ];

      if ( outputElement !== verifyElement )
        throw Error( `test_Weights_Float32Array_RestrictedClone(): `
          + `Weights.Base.ValueBounds.Float32Array_RestrictedClone( inputArray[ ${i} ] = ${inputElement} ) `
          + `should be ( ${verifyElement} ) but got ( ${outputElement} ).`
        );

      let outputElementSingle = Weights.Base.ValueBounds.clamp_or_zeroIfNaN( inputElement );

      if ( outputElementSingle !== verifyElement )
        throw Error( `test_Weights_Float32Array_RestrictedClone(): `
          + `Weights.Base.ValueBounds.clamp_or_zeroIfNaN( inputArray[ ${i} ] = ${inputElement} ) `
          + `should be ( ${verifyElement} ) but got ( ${outputElementSingle} ).`
        );
    }
  }

  test_ValueRange_valueInputOutputGenerator() {
    let valuePair = {};

    // Test ValueRange.Bool().valueInputOutputGenerator().
    {
      let paramDesc = Block.Params.bKeepInputTensor;

      for ( let offsetMultiplier = -100; offsetMultiplier <= +100; ++offsetMultiplier ) {
        for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( valuePair, offsetMultiplier ) ) {
          let adjustedInput = paramDesc.valueDesc.range.adjust( pair.valueInput )

          if ( adjustedInput != pair.valueOutput )
            throw Error( `ValueRange.Bool().valueInputOutputGenerator( ${offsetMultiplier} ): `
              + `this.adjust( ${pair.valueInput} ) return ( ${adjustedInput} ) should be ( ${pair.valueOutput} ).` );
        }
      }
    }

    // Test ValueRange.Int().valueInputOutputGenerator().
    {
      let paramDesc = Block.Params.pointwise20ChannelCount;

      for ( let offsetMultiplier = -10; offsetMultiplier <= +10; ++offsetMultiplier ) {
        
        let valueOutMinMax;
        {
          let dice = Math.random();
          if ( dice < 0.5 ) {
            valueOutMinMax = [
              RandTools.getRandomIntInclusive( paramDesc.valueDesc.range.min, paramDesc.valueDesc.range.max ),
              RandTools.getRandomIntInclusive( paramDesc.valueDesc.range.min, paramDesc.valueDesc.range.max ),
            ];
          }
        }

        for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( valuePair, offsetMultiplier, valueOutMinMax ) ) {
          let adjustedInput = paramDesc.valueDesc.range.adjust( pair.valueInput )

          if ( adjustedInput != pair.valueOutput )
            throw Error( `ValueRange.Int( ${paramDesc.min}, ${paramDesc.max} ).valueInputOutputGenerator( ${offsetMultiplier} ): `
              + `this.adjust( ${pair.valueInput} ) return ( ${adjustedInput} ) should be ( ${pair.valueOutput} ).` );
        }
      }

    }
  }

  test_Operation() {
    jsPerf_Operation.testCorrectness();
  }

  // Testing whether the results of different implementation are the same.
  * testCorrectness() {

//!!! (2022/08/03 Temp Remarked) For speed-up PerformanceTest
    if ( 0 ) {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      Pool.Asserter.assert_Pool_issuedCount_same_after_as_before( "jsPerf_Block.HeightWidthDepth.testCorrectness()", () => {
        this.test_FloatValue();
        this.test_Weights_Float32Array_RestrictedClone();
        this.test_ValueRange_valueInputOutputGenerator();
        this.test_Operation();
      }, this );

      yield;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag and channelShufflerBag.

        {
          // Note: imageSourceBag and channelShufflerBag should not be created outside tidy() because tidy() will dispose tensors
          //       dynamically created in them.
          let imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by();
          let channelShufflerBag = ChannelShuffler.Bag.Pool.get_or_create_by( ChannelShuffler.ConcatPointwiseConv.Pool );

          let testParams = Block_TestParams.Base.Pool.get_or_create_by();
          let testParamsGenerator = testParams.ParamsGenerator();
          let testReference = Block_Reference.Base.Pool.get_or_create_by();

          let batchIdCalculator = new BatchIdCalculator.Base( 100 * 1000 );

          try {
            for ( let testParams of testParamsGenerator ) {
              let bDisplayed = batchIdCalculator.checkAndDisplay( testParams.id );
              if ( bDisplayed )
                yield; // Since just entering a new batch section, take a break so that memory garbage collector could be activated to work.

              testReference.testCorrectness( imageSourceBag, testParams, channelShufflerBag );
            }

          // Q: Why not catch exception inside Block_Reference.testCorrectness()?
          // A: To catch testParamsGenerator's exception.
          } catch ( e ) {
            let backendName = tf.getBackend();
            let msg = `jsPerf_Block.js: testCorrectness(): backendName=${backendName}, `
              + `Block, (yieldCount == ${testParams.yieldCount}), testParams.id == ${testParams.id}`;

            console.log( msg );
            alert( `${msg}\n${e}` );

            //debugger;
            throw e;
          }

          batchIdCalculator.checkAndDisplay( testParams.id );

          testReference.disposeResources_and_recycleToPool(); testReference = null;
          testParams.disposeResources_and_recycleToPool(); testParams = null;
          channelShufflerBag.disposeResources_and_recycleToPool(); channelShufflerBag = null;
          imageSourceBag.disposeResources_and_recycleToPool(); imageSourceBag = null;
        }

        let memoryInfo_testCorrectness_after = tf.memory();

        if ( memoryInfo_testCorrectness_after.numTensors != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `testCorrectness() memory leak. `
            + `result tensor count ( ${memoryInfo_testCorrectness_after.numTensors} ) `
            + `should be ( ${memoryInfo_testCorrectness_before.numTensors} ) `
          );
      }

      Pool.Asserter.assert_Pool_issuedCount( "jsPerf_Block.HeightWidthDepth.testCorrectness()", pool_all_issuedCount_before );
      yield;
    }

    try {
      // After correctness testing done, create all Block for performance testing.
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
//  globalThis.testSet_110x120x4 = new HeightWidthDepth( 110, 120, depth ); // height, width, depth

  // Using mobile phone's resolution ( 2160 * 1080 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1920 * 1080 ).
  globalThis.testSet_110x120x4 = new HeightWidthDepth( 108, 192, depth ); // height, width, depth

  globalThis.testSet_110x120x4_All = [
    globalThis.testSet_110x120x4
  ];
}

function* testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_110x120x4_All.length; ++i ) {
    let testSet = globalThis.testSet_110x120x4_All[ i ];
    yield* testSet.testCorrectness();
  }
}

function testDifferentDisposeStrategy_All() {
  for ( let i = 0; i < globalThis.testSet_110x120x4_All.length; ++i ) {
    let testSet = globalThis.testSet_110x120x4_All[ i ];
    testSet.testDifferentDisposeStrategy_All();
  }
}

function disposeResources() {
  if ( globalThis.testSet_110x120x4_All ) {
    for ( let i = 0; i < globalThis.testSet_110x120x4_All.length; ++i ) {
      let testSet = globalThis.testSet_110x120x4_All[ i ];
      if ( testSet )
        testSet.disposeResources();
    }

    globalThis.testSet_110x120x4_All = null;
  }

  globalThis.testSet_110x120x4
    = null;
}
