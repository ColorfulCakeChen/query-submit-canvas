export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as Pool_Asserter from "../util/Pool_Asserter.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as BatchIdCalculator from "./BatchIdCalculator.js";
import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as Stage from "../Conv/Stage.js";
import * as Stage_Reference from "./Ref/Stage_Reference.js";
import * as Stage_TestParams from "./Ref/Stage_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 
import * as NumberImage from "./Ref/NumberImage.js"; 

/**
 * Test CNN Stage.
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

    this.disposeResources();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;
  }

  disposeResources() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }

    this.block_PerformanceTest_release();
  }

  block_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeResources();

    // Larger input image for performance testing.
    let inputTensorCount = 1;
    this.testPerformance_NumberImageArray = Recyclable.OwnerArray.Pool.get_or_create_by( inputTensorCount );
    this.dataTensor3dArray = tf.tidy( () => {
      let inputScaleBoundsArray = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by( this.depth );

      let dataTensor3dArray = new Array( inputTensorCount );

      let shape = [ this.height, this.width, this.depth ];
      let elementCount = tf.util.sizeFromShape( shape );

      for ( let i = 0; i < dataTensor3dArray.length; ++i ) {
        let numberBegin = ( i * elementCount );
        let numberEnd = numberBegin + elementCount;

        let image = this.testPerformance_NumberImageArray[ i ] = NumberImage.Base.Pool.get_or_create_by(
          this.height, this.width, this.depth, undefined,
          inputScaleBoundsArray, null, BoundsArraySet.InputsOutputs, Weights.Base.ValueBounds );

        for ( let j = 0; j < elementCount; ++j ) {
          image.dataArray[ j ] = numberBegin + j;
        }

        dataTensor3dArray[ i ] = tf.tensor( image.dataArray, shape );
      }

      inputScaleBoundsArray.disposeResources_and_recycleToPool();
      inputScaleBoundsArray = null;

      return dataTensor3dArray;
    });

    let stepCountRequested = 10;
    let nSqueezeExcitationChannelCountDivisor = 4;

    // sourceHeight, sourceWidth, sourceChannelCount,
    // nConvStageTypeId,
    // blockCountRequested,
    // bPointwise1,
    // depthwiseFilterHeight, depthwiseFilterWidth,
    // bPointwise2ActivatedAtStageEnd,
    // nSqueezeExcitationChannelCountDivisor,
    // nActivationId,
    // bKeepInputTensor
    //
    // The stage performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
    //

    if ( this.testCaseMap )
      this.testCaseMap.clear();
    else
      this.testCaseMap = new Map();

    // Test Case 1: (MobileNetV1, ( bPointwise1 == true ))
    this.testCaseMap.set( "MobileNetV1_bPointwise1_true", { testParams: 
      ( new Stage_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        true
      ) } );

    // Test Case 2: (MobileNetV1_padValid, ( bPointwise1 == true ))
    this.testCaseMap.set( "MobileNetV1_padValid_bPointwise1_true", { testParams: 
      ( new Stage_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        true
      ) } );

    // Test Case 3: (MobileNetV2_Thin, ( bPointwise1 == true ))
    this.testCaseMap.set( "MobileNetV2_Thin_bPointwise1_true", { testParams: 
      ( new Stage_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        true
      ) } );

    // Test Case 4: (MobileNetV2, ( bPointwise1 == true ))
    this.testCaseMap.set( "MobileNetV2_bPointwise1_true", { testParams: 
      ( new Stage_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        true
      ) } );

    // Test Case 5: (ShuffleNetV2, ( bPointwise1 == true ))
    this.testCaseMap.set( "ShuffleV2_bPointwise1_true", { testParams: 
      ( new Stage_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        true
      ) } );

    // Test Case 6: (ShuffleNetV2_byPointwise22, ( bPointwise1 == true ))
    this.testCaseMap.set( "ShuffleV2_byPointwise22_bPointwise1_true", { testParams: 
      ( new Stage_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE22,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        true
      ) } );

    // Test Case 7: (ShuffleNetV2_byMobileNetV1, ( bPointwise1 == true ))
    this.testCaseMap.set( "ShuffleNetV2_byMobileNetV1_bPointwise1_true", { testParams: 
      ( new Stage_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        true
      ) } );

    // Test Case 8: (ShuffleNetV2_byMobileNetV1_padValid, ( bPointwise1 == true ))
    this.testCaseMap.set( "ShuffleNetV2_byMobileNetV1_padValid_bPointwise1_true", { testParams: 
      ( new Stage_TestParams.Base() ).set_By_ParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        true
      ) } );


    // Create the different Stage objects for performance testing.
    for ( let name_testCase of this.testCaseMap.entries() ) {
      let name = name_testCase[ 0 ];
      let testCase = name_testCase[ 1 ];
      if ( !testCase.stage ) {
        testCase.stage = Stage_Reference.Base.Stage_create( testCase.testParams );
      }

      console.log( `Stage.${name}: tensorWeightCount = { Extracted: ${testCase.block.tensorWeightCountExtracted}, ` 
        + `Total: ${testCase.block.tensorWeightCountTotal} }` );
    }

  }

  block_PerformanceTest_release() {
    if ( this.testCaseMap ) {
      for ( let name_testCase of this.testCaseMap.entries() ) {
        let name = name_testCase[ 0 ];
        let testCase = name_testCase[ 1 ];
        if ( testCase.stage ) {
          testCase.stage.disposeResources_and_recycleToPool();
        }
      }
      this.testCaseMap.clear();
    }

    if ( this.testPerformance_NumberImageArray ) {
      this.testPerformance_NumberImageArray.disposeResources_and_recycleToPool();
      this.testPerformance_NumberImageArray = null;
    }
  }

  /** Test apply by Xxx */
  testStage_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );
    let block = testCase.block;
    let outputTensor3d = block.apply( this.dataTensor3dArray[ 0 ] );
    tf.dispose( outputTensor3d );
  }

  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {

    {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      //Pool_Asserter.assert_Pool_issuedCount_same_after_as_before( "jsPerf_Stage.HeightWidthDepth.testCorrectness()", () => {
      //}, this );

      yield;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        {
          // Note: imageSourceBag should not be created outside tidy() because tidy() will dispose tensors
          //       dynamically created in them.
          let imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by();

          let testParams = Stage_TestParams.Base.Pool.get_or_create_by();
          let testParamsGenerator = testParams.ParamsGenerator();
          let testReference = Stage_Reference.Base.Pool.get_or_create_by();

          let batchIdCalculator = new BatchIdCalculator.Base( 50 * 1000 );

          try {
            for ( testParams of testParamsGenerator ) {
              let bDisplayed = batchIdCalculator.checkAndDisplay( testParams.id );
              if ( bDisplayed )
                yield; // Since just entering a new batch section, take a break so that memory garbage collector could be activated to work.

              testReference.testCorrectness( imageSourceBag, testParams );
            }

          } catch ( e ) {
            let backendName = tf.getBackend();
            let msg = `jsPerf_Stage.js: testCorrectness(): backendName=${backendName}, `
              + `Stage, (yieldCount == ${testParams.yieldCount}), testParams.id == ${testParams.id}`;

            console.log( msg );
            alert( `${msg}\n${e}` );

            //debugger;
            throw e;
          }

          batchIdCalculator.checkAndDisplay( testParams.id );

          testReference.disposeResources_and_recycleToPool(); testReference = null;
          testParams.disposeResources_and_recycleToPool(); testParams = null;
          imageSourceBag.disposeResources_and_recycleToPool(); imageSourceBag = null;
        }

        let memoryInfo_testCorrectness_after = tf.memory();

        if ( memoryInfo_testCorrectness_after.numTensors != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `testCorrectness() memory leak. `
            + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
            + `should be (${memoryInfo_testCorrectness_before.numTensors} `
            + `` );
      }

      Pool_Asserter.assert_Pool_issuedCount( "jsPerf_Block.HeightWidthDepth.testCorrectness()", pool_all_issuedCount_before );
      yield;
    }

    try {
      // After correctness testing done, create all Stage for performance testing.
      this.block_PerformanceTest_init();
    } catch ( e ) {
      debugger;
      throw e;
    }
  }

}


function init() {
  //console.log("jsPerf_Stage.js, init()");

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
