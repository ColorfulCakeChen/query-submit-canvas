export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as Stage from "../Conv/Stage.js";
import * as Stage_Reference from "../x_tester/Ref/Stage_Reference.js";
import * as Stage_TestParams from "../x_tester/Ref/Stage_TestParams.js"; 
import * as ImageSourceBag from "../x_tester/Ref/ImageSourceBag.js"; 
import * as NumberImage from "../x_tester/Ref/NumberImage.js"; 
import * as BatchIdCalculator from "../x_tester/Ref/BatchIdCalculator.js";

/**
 * Test CNN Stage.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/15055/405/colorfulcakechen-cnn-stage-4d36f0e2ffd053a25457d9b614c6}
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

  /**
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The input number image provider. It is just be referenced, and will NOT
   * be owned by this test case.
   */
  constructor(
    testCaseId, testCaseName, stageTestParams, imageSourceBag ) {
    super();
    this.#setAsConstructor_self(
      testCaseId, testCaseName, stageTestParams, imageSourceBag
    );
  }

  /** @override */
  setAsConstructor(
    testCaseId, testCaseName, stageTestParams, imageSourceBag ) {
    super.setAsConstructor();
    this.#setAsConstructor_self(
      testCaseId, testCaseName, stageTestParams, imageSourceBag
    );
  }

  /**  */
  #setAsConstructor_self(
    testCaseId, testCaseName, stageTestParams, imageSourceBag ) {
    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.stageTestParams = stageTestParams;
    this.imageSourceBag = imageSourceBag;
    this.stage = undefined;
    this.inputTensor3d = undefined;
  }

  /**
   * 
   */
  prepare() {

    try {
      {
        // Note: Do NOT release the tensor3d because it is owned and manged
        //       by ImageSourceBag.
        this.inputTensor3d = null;

        this.stage?.disposeResources_and_recycleToPool();
        this.stage = null;
      }

      const stageTestParams = this.stageTestParams;
      const imageSourceBag = this.imageSourceBag;

      // Pre-create performance test case's input image.
      let inputImage = imageSourceBag.getImage_by(
        stageTestParams.out.input_height,
        stageTestParams.out.input_width,
        stageTestParams.out.input_channelCount );

      // Pre-create performance test case's input tensor.
      let inputTensor3d = imageSourceBag.getTensor3d_by(
        stageTestParams.out.input_height,
        stageTestParams.out.input_width,
        stageTestParams.out.input_channelCount );

      let stage = Stage_Reference.Base.Stage_create(
        null,                                   // parentNameable
        `Stage_Reference_${this.testCaseName}`, // stageName
        stageTestParams, inputImage.boundsArraySet.output0 );

      this.stage = stage;
      this.inputTensor3d = inputTensor3d;

      console.log( `Stage.${this.testCaseName}: tensorWeightCount = { `
        + `Extracted: ${stage.tensorWeightCountExtracted}, `
        + `Total: ${stage.tensorWeightCountTotal} }` );

    } catch ( e ) {
      debugger;
      throw e;
    }
  }

  /** @override */
  disposeResources() {

    // Note: Do NOT release the tensor3d because it is owned and manged
    //       by ImageSourceBag.
    this.inputTensor3d = null;

    this.stage?.disposeResources_and_recycleToPool();
    this.stage = null;

    this.imageSourceBag = null;

    this.stageTestParams?.disposeResources_and_recycleToPool();
    this.stageTestParams = null;

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
   * @param {number} height  image height
   * @param {number} width   image width
   * @param {number} depth   image channel count
   */
  constructor( height, width, depth ) {

    this.disposeResources();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;
  }

  disposeResources() {
    this.stage_PerformanceTest_release();
  }

  /**
   * 
   */
  stage_PerformanceTest_addCase( testCaseName, stageTestParams ) {
    try {
      let aPerformanceTestCase = PerformanceTestCase.Pool.get_or_create_by(
        stageTestParams.id, testCaseName,
        stageTestParams, this.testPerformance_imageSourceBag );

      this.testCaseMap.set( testCaseName, aPerformanceTestCase );

    } catch ( e ) {
      debugger;
      throw e;
    }
  }

  stage_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger
    // different input image from correctness testing.
    this.disposeResources();

    // Larger input image for performance testing.
    this.testPerformance_imageSourceBag
      = ImageSourceBag.Base.Pool.get_or_create_by();

    if ( this.testCaseMap )
      this.testCaseMap.clear();
    else
      this.testCaseMap = new Map();

    let blockCountRequested = 10;
    let nSqueezeExcitationChannelCountDivisor = 2;

    // input_height, input_width, input_channelCount,
    // nConvStageTypeId,
    // blockCountRequested,
    // bPointwise1,
    // depthwiseFilterHeight, depthwiseFilterWidth,
    // nSqueezeExcitationChannelCountDivisor,
    // nActivationId,
    // bKeepInputTensor,
    // bTableLog
    //
    // The stage performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will
    //       be destroyed.
    //
    const bKeepInputTensor = true;
    const bTableLog = false;

    // Test Case 0: (MobileNetV1, ( bPointwise1 == true ))
    this.stage_PerformanceTest_addCase(
      "MobileNetV1_bPointwise1_true",
      Stage_TestParams.Base.Pool.get_or_create_by( 0 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1,
        blockCountRequested, true,
        3, 3, nSqueezeExcitationChannelCountDivisor,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      ) );

    // Test Case 1: (MobileNetV1_padValid, ( bPointwise1 == true ))
    this.stage_PerformanceTest_addCase(
      "MobileNetV1_padValid_bPointwise1_true",
      Stage_TestParams.Base.Pool.get_or_create_by( 1 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID,
        blockCountRequested, true,
        3, 3, nSqueezeExcitationChannelCountDivisor,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      ) );

    // Test Case 2: (MobileNetV2_Thin, ( bPointwise1 == true ))
    this.stage_PerformanceTest_addCase(
      "MobileNetV2_Thin_bPointwise1_true",
      Stage_TestParams.Base.Pool.get_or_create_by( 2 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN,
        blockCountRequested, true,
        3, 3, nSqueezeExcitationChannelCountDivisor,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      ) );

    // Test Case 3: (MobileNetV2, ( bPointwise1 == true ))
    this.stage_PerformanceTest_addCase(
      "MobileNetV2_bPointwise1_true",
      Stage_TestParams.Base.Pool.get_or_create_by( 3 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2,
        blockCountRequested, true,
        3, 3, nSqueezeExcitationChannelCountDivisor,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      ) );

    // Test Case 4: (ShuffleNetV2, ( bPointwise1 == true ))
    this.stage_PerformanceTest_addCase(
      "ShuffleNetV2_bPointwise1_true",
      Stage_TestParams.Base.Pool.get_or_create_by( 4 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2,
        blockCountRequested, true,
        3, 3, nSqueezeExcitationChannelCountDivisor,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      ) );

    // Test Case 5: (ShuffleNetV2_byPointwise21, ( bPointwise1 == true ))
    this.stage_PerformanceTest_addCase(
      "ShuffleNetV2_byPointwise21_bPointwise1_true",
      Stage_TestParams.Base.Pool.get_or_create_by( 5 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21,
        blockCountRequested, true,
        3, 3, nSqueezeExcitationChannelCountDivisor,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      ) );

    // Test Case 6: (ShuffleNetV2_byMobileNetV1, ( bPointwise1 == true ))
    this.stage_PerformanceTest_addCase(
      "ShuffleNetV2_byMobileNetV1_bPointwise1_true",
      Stage_TestParams.Base.Pool.get_or_create_by( 6 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1,
        blockCountRequested, true,
        3, 3, nSqueezeExcitationChannelCountDivisor,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      ) );

    // Test Case 7: (ShuffleNetV2_byMobileNetV1_padValid, ( bPointwise1 == true ))
    this.stage_PerformanceTest_addCase(
      "ShuffleNetV2_byMobileNetV1_padValid_bPointwise1_true",
      Stage_TestParams.Base.Pool.get_or_create_by( 7 ).set_byParamsScattered(
        this.height, this.width, this.depth,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID,
        blockCountRequested, true,
        3, 3, nSqueezeExcitationChannelCountDivisor,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        bKeepInputTensor, bTableLog
      ) );
  }

  /** Release testCase.stage and .inputTensor3d, but keep testCase. */
  stage_PerformanceTest_release_stage() {
    if ( this.testCaseMap ) {
      for ( let testCase of this.testCaseMap.values() ) {

        // Note: Do NOT release the tensor3d because it is owned and manged
        //       by ImageSourceBag.
        testCase.inputTensor3d = null;

        if ( testCase.stage ) {
          testCase.stage.disposeResources_and_recycleToPool();
          testCase.stage = null;
        }
      }
    }
  }

  /** */
  stage_PerformanceTest_release() {
    if ( this.testCaseMap ) {
      for ( let testCase of this.testCaseMap.values() ) {
        testCase.disposeResources_and_recycleToPool();
      }
      this.testCaseMap.clear();
    }

    this.testPerformance_imageSourceBag?.disposeResources_and_recycleToPool();
    this.testPerformance_imageSourceBag = null;
  }

  /** Test apply by Xxx */
  testStage_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );

    // First time test this case. Release all other test cases' stage
    // (so that there will be enough memory). Create the specified stage.
    if ( !testCase.stage ) {
      this.stage_PerformanceTest_release_stage();
      testCase.prepare();
    }

    let stage = testCase.stage;
    let outputTensor3d = stage.apply( testCase.inputTensor3d );
    tf.dispose( outputTensor3d );
  }

  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {
    try {
      // After correctness testing done, create all Stage for performance
      // testing.
      this.stage_PerformanceTest_init();
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
  globalThis.testSet_108x192x4 = new HeightWidthDepth(
    108, 192, depth ); // height, width, depth

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
