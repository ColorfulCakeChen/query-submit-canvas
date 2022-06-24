export { Base };

import * as TensorTools from "../../util/TensorTools.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ImageSourceBag from "./ImageSourceBag.js"; 
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as Block_Reference from "./Block_Reference.js"; 
import * as Stage_TestParams from "./Stage_TestParams.js"; 
import * as Stage from "../../Conv/Stage.js";
import * as BoundsArraySet_Asserter from "./BoundsArraySet_Asserter.js";

/**
 * Reference computation of class Stage.Base.
 */
class Base {

  constructor() {
    this.Block_Reference = new Block_Reference.Base();
    this.asserter_Equal = new TensorTools.Asserter_Equal( 0.4, 0.001 );

    // For reducing memory allocation.
    this.imageInArray = new Array( 2 );  // imageInArray[ 0 ] is input0, imageInArray[ 1 ] is input1.
    this.arrayTemp_forInterleave_asGrouptTwo = [];
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {Stage_TestParams.Base} testParams
   *   The test parameters. It is the value of Stage_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  testCorrectness( imageSourceBag, testParams ) {
    this.testParams = testParams;

    try {
      let sourceHeight = this.testParams.out.sourceHeight;
      let sourceWidth = this.testParams.out.sourceWidth;
      let sourceChannelCount = this.testParams.out.sourceChannelCount;
      let blockCountRequested = this.testParams.out.blockCountRequested;
      let bPointwise1 = this.testParams.out.bPointwise1;
      let depthwiseFilterHeight = this.testParams.out.depthwiseFilterHeight;
      let depthwiseFilterWidth = this.testParams.out.depthwiseFilterWidth;
      let nActivationId = this.testParams.out.nActivationId;
      let bPointwise2BiasAtStageEnd = this.testParams.out.bPointwise2BiasAtStageEnd;
      let nConvStageType = this.testParams.out.nConvStageType;
      let bKeepInputTensor = this.testParams.out.bKeepInputTensor;

      let referredParams = {};
      let outputHeight, outputWidth, outputChannelCount;
      {
        Stage.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call( referredParams, sourceHeight, sourceWidth );

        outputHeight = referredParams.outputHeight;
        outputWidth = referredParams.outputWidth;

        outputChannelCount = sourceChannelCount * 2; // In current Stage's design, the output channel always is twice as input.
      }

      let strNote;
      strNote = `( this.testParams.id=${this.testParams.id} )`;

      let imageIn = imageSourceBag.getImage_by( sourceChannelCount );
      let imageOutReference = this.calcResult( imageIn );

      let inputTensor3d = imageSourceBag.getTensor3d_by( sourceChannelCount );

      let inputTensorDestroyCount; // How many input tensors will be destroyed by Stage.apply().
      if ( bKeepInputTensor ) {
        inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

      } else {
        inputTensor3d = inputTensor3d.clone(); // Clone for being destroyed. 
        inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
      }

      let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of block create/dispose.
      let stage = Base.Stage_create( testParams );

      let parametersDescription = stage.parametersDescription;
      strNote = `( this.testParams.id=${this.testParams.id}, ${parametersDescription} )`;

      Base.AssertTwoEqualValues( "outputHeight", stage.outputHeight, outputHeight, strNote );
      Base.AssertTwoEqualValues( "outputWidth", stage.outputWidth, outputWidth, strNote );
      Base.AssertTwoEqualValues( "outputChannelCount", stage.outputChannelCount, outputChannelCount, strNote );

      Base.AssertTwoEqualValues( "blockCount", stage.blockCount, testParams.blocksArray.length, strNote );

      // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
      // tensor count (i.e. inputTensorDestroyCount).
      let stage_outputTensorCount = 1;
      let tensorNumDifference_apply_before_after = stage_outputTensorCount - inputTensorDestroyCount;

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of Stage.apply.
      let outputTensor3d = stage.apply( inputTensor3d );
      let memoryInfo_apply_after = tf.memory();

      if ( memoryInfo_apply_after.numTensors != ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) )
        throw Error( `Stage.apply() memory leak. `
          + `result tensor count (${memoryInfo_apply_after.numTensors}) `
          + `should be (${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      if ( !inputTensor3d )
        throw Error( `Stage inputTensor3d should not be null. ${strNote}` ); // But may be disposed.

      if ( !outputTensor3d )
        throw Error( `Stage outputTensor3d should not be null. ${strNote}` );

      { // Test output channel count.
        const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
        let outputTensorChannelCount = 0;

        if ( outputTensor3d && ( outputTensor3d.shape.length > CHANNEL_AXIS_ID ) )
          outputTensorChannelCount = outputTensor3d.shape[ CHANNEL_AXIS_ID ];

        // The real channel count of the output tensor should be the same as predicted output channel count.
        Base.AssertTwoEqualValues( "outChannels", stage.outputChannelCount, outputTensorChannelCount, strNote );
      }

      // Test correctness of Stage BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( stage.boundsArraySet, imageOutReference, parametersDescription );

      // Test correctness of Stage.apply.
      this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d, imageOutReference, parametersDescription );

      stage.disposeTensors();
      let memoryInfo_afterDispose = tf.memory();

      if ( memoryInfo_afterDispose.numTensors != ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) )
        throw Error(  `Stage create/dispose memory leak. `
          + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
          + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      tf.dispose( outputTensor3d );

    } catch ( e ) {
      let backendName = tf.getBackend();
      let msg = `Stage_Reference.js: testCorrectness(): backendName=${backendName}, `
        + `Stage, (yieldCount == ${testParams.yieldCount}), this.testParams.id == ${testParams.id}`;

      console.log( msg );
      alert( `${msg}\n${e}` );

      throw e;
    }

  }

  /**
   * Check the Stage's output's BoundsArraySet.
   *
   * @param {BoundsArraySet} aBoundsArraySet      The bounds array set of the Stage.
   * @param {NumberImage.Base} imageOutReference  Refernece output Image data of the Stage_Reference's calcResult().
   */
  assert_imageOut_BoundsArraySet( aBoundsArraySet, imageOutReference, parametersDescription ) {
    BoundsArraySet_Asserter.assert_BoundsArraySet_Outputs( this.asserter_Equal,
      aBoundsArraySet, [ imageOutReference ], `Stage`, parametersDescription );
  }

  /**
   * Check the Stage's output according to input (for correctness testing).
   *
   * @param {tf.tensor3d} outputTensor            The output tensor of the Stage's apply().
   * @param {NumberImage.Base} imageOutReference  Refernece output Image data of the Stage_Reference's calcResult().
   */
  assert_imageOut_Tensors_byNumberArrays( outputTensor, imageOutReference, parametersDescription ) {
    let outputArrayRef;

    if ( imageOutReference ) {
      outputArrayRef = imageOutReference.dataArray; // Get referenced result (as number array).
    } else {
      outputArrayRef = null;
    }

    this.asserter_Equal.assert(
      outputTensor, outputArrayRef,
      "Stage", `outputTensor`, `outputRef`, parametersDescription
    );
  }

  /**
   * @param {Stage_TestParams.Base} testParams
   *   The test parameters. It is the value of Stage_TestParams.Base.ParamsGenerator()'s result.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Stage value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {Stage.Base} The created Stage object.
   */
  static Stage_create( testParams, inputScaleBoundsArray0 ) {

    let stage = new Stage.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let extractedParams = new Stage.Params( testParams.in.inputFloat32Array, testParams.in.byteOffsetBegin,
      testParams.in.sourceHeight, testParams.in.sourceWidth, testParams.in.sourceChannelCount,
      testParams.in.blockCountRequested,
      testParams.in.bPointwise1,
      testParams.in.depthwiseFilterHeight, testParams.in.depthwiseFilterWidth,
      testParams.in.nActivationId,
      testParams.in.bPointwise2BiasAtStageEnd,
      testParams.in.nConvStageType,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = stage.init( progress, extractedParams, inputScaleBoundsArray0, this.arrayTemp_forInterleave_asGrouptTwo );

    let parametersDescription = `( ${stage.parametersDescription} )`;

    if ( stage.bInitOk != bInitOk ),
      throw Error( `Stage validation state (${stage.bInitOk}) mismatches initer's result (${bInitOk}). ${parametersDescription}` );

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    if ( false == bInitOk )
      throw Error(  `Failed to initialize stage object. ${parametersDescription}` );

    if ( 100 != progress.valuePercentage )
      throw Error( 
        `Progress (${progress.valuePercentage}) should be 100 when initializing block object successfully. ${parametersDescription}`);

    if ( stage.byteOffsetEnd != testParams.in.inputFloat32Array.byteLength ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    let asserter = new ObjectPropertyAsserter.Base( `Stage`, stage, parametersDescription );

    Base.AssertTwoEqualValues( "parsing beginning position",
      stage.byteOffsetBegin, testParams.in.byteOffsetBegin, parametersDescription );

    Base.AssertTwoEqualValues( "parsing ending position",
      stage.byteOffsetEnd, testParams.in.inputFloat32Array.byteLength, parametersDescription );

    // parameters.
    asserter.propertyValue( "sourceHeight", testParams.out.sourceHeight );
    asserter.propertyValue( "sourceWidth", testParams.out.sourceWidth );
    asserter.propertyValue( "sourceChannelCount", testParams.out.sourceChannelCount );
    asserter.propertyValue( "blockCountRequested", testParams.out.blockCountRequested );

    asserter.propertyValue( "bPointwise1", testParams.out.bPointwise1 );

    asserter.propertyValue( "depthwiseFilterHeight", testParams.out.depthwiseFilterHeight );
    asserter.propertyValue( "depthwiseFilterWidth", testParams.out.depthwiseFilterWidth );

    asserter.propertyValue( "nActivationId", testParams.out.nActivationId );
    asserter.propertyValue( "bPointwise2ActivatedAtStageEnd", testParams.out.bPointwise2ActivatedAtStageEnd );
    asserter.propertyValue( "nConvStageType", testParams.out.nConvStageType );

    // Referred parameters.
    asserter.propertyValue( "outputHeight", testParams.out.outputHeight );
    asserter.propertyValue( "outputWidth", testParams.out.outputWidth );

    // Other parameters.
    asserter.propertyValue( "bKeepInputTensor", testParams.out.bKeepInputTensor );

    Base.AssertParameters_Stage_blocks( stage, parametersDescription ); // Test every block's parameters.

    {
      let tensorWeightCountTotal = 0;
      let tensorWeightCountExtracted = 0;

      for ( let i = 0; i < stage.blocksArray.length; ++i ) {
        let block = stage.blocksArray[ i ];
        tensorWeightCountTotal += block.tensorWeightCountTotal;
        tensorWeightCountExtracted += block.tensorWeightCountExtracted;
      }

      if ( stage.channelShuffler ) {
        tensorWeightCountTotal += stage.channelShuffler.tensorWeightCountTotal;
        tensorWeightCountExtracted += stage.channelShuffler.tensorWeightCountExtracted;
      }

      asserter.propertyValue( "tensorWeightCountTotal", tensorWeightCountTotal );
      asserter.propertyValue( "tensorWeightCountExtracted", tensorWeightCountExtracted );
    }

    return stage;
  }

  /** */
  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    if ( value1 != value2 )
      throw Error(  `Stage ${valueName} (${value1}) should be (${value2}). ${parametersDescription}` );
  }

  /**
   * Test every block's parameters.
   *
   * @param {Stage.Base[]|Stage_TestParams.Base[]} stageParams
   *   The stage to be checked. It parameters will be checked.
   *
   */
  static AssertParameters_Stage_blocks( stageParams, parametersDescription ) {
    let blockParamsArray = stageParams.blocksArray; // No matter Stage.Base or Stage_TestParams.Base

    if ( stageParams instanceof Stage_TestParams.Base ) {
      stageParams = stageParams.out;
    } else { // Stage.Base
    }

    let blockCountRequested = stageParams.blockCountRequested;
    let nConvStageType = stageParams.nConvStageType;

    let single_Block0Input0ChannelCount = stageParams.sourceChannelCount;        // Single of block0's input0 channel count.
    let double_Block0Input0ChannelCount = double_Block0Input0ChannelCount * 2;    // Double of block0's input0 channel count.
    let quadruple_Block0Input0ChannelCount = stageParams.sourceChannelCount * 4; // Quadruple of block0's input0 channel count.

    let blockCount = blockParamsArray.length;

    if ( blockCount <= 0 )
      throw Error( `Stage blockCount (${blockCount}) should be larger than 0. ${parametersDescription}` );

    if ( blockCount < 2 ),
      throw Error( `Stage blockCount (${blockCount}) should be >= 2. ${parametersDescription}` );

    let blockName, blockParams, pointwise1ChannelCount;
    for ( let blockIndex = 0; blockIndex < blockCount; ++blockIndex ) {
      blockName = `block${blockIndex}`;

      {
        blockParams = blockParamsArray[ blockIndex ];
        if ( blockParams instanceof Block_TestParams.Base ) {
          blockParams = blockParams.out;
        } else { // Block.Base
        }
      }

      let asserter = new ObjectPropertyAsserter.Base( `Stage.${blockName}`, blockParams, parametersDescription );

      let strUnknownConvStageType = `Stage_Reference.Base.AssertParameters_Stage_blocks(): `
            `unknown nConvStageType ( ${nConvStageType} ) value. ${asserter.contextDescription}`;

      // inputHeight0, inputWidth0
      if ( 0 == blockIndex ) { // block0
        asserter.propertyValue( "inputHeight0", stageParams.sourceHeight );
        asserter.propertyValue( "inputWidth0", stageParams.sourceWidth );
      } else { // block1, 2, 3, ...
        asserter.propertyValue( "inputHeight0", stageParams.outputHeight );
        asserter.propertyValue( "inputWidth0", stageParams.outputWidth );
      }

      // channelCount0_pointwise1Before
      if ( 0 == blockIndex ) { // block0
        asserter.propertyValue( "channelCount0_pointwise1Before", single_Block0Input0ChannelCount );
      } else { // block1, 2, 3, ...
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "channelCount0_pointwise1Before", double_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            asserter.propertyValue( "channelCount0_pointwise1Before", single_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "channelCount0_pointwise1Before", double_Block0Input0ChannelCount );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }
      }

      // channelCount1_pointwise1Before
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "channelCount1_pointwise1Before", ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            if ( stageParams.bPointwise1 == false ) {
              asserter.propertyValue( "channelCount1_pointwise1Before", ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT );
            } else {
              asserter.propertyValue( "channelCount1_pointwise1Before",
                ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE );
            }
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "channelCount1_pointwise1Before",
              ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
            asserter.propertyValue( "channelCount1_pointwise1Before", ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "channelCount1_pointwise1Before",
              ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
            asserter.propertyValue( "channelCount1_pointwise1Before",
              ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            asserter.propertyValue( "channelCount1_pointwise1Before", single_Block0Input0ChannelCount ); // TWO_INPUTS
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "channelCount1_pointwise1Before",
              ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }
      }

      // pointwise1ChannelCount
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", quadruple_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            if ( stageParams.bPointwise1 == false ) {
              if ( blockParams instanceof Block_TestParams.Base ) {
                asserter.propertyValue( "pointwise1ChannelCount", 0 ); // Zero in parameters.
              } else { // Block.Base
                asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount ); // Double in reality internally.
              }
            } else {
              if ( blockParams instanceof Block_TestParams.Base ) {
                asserter.propertyValue( "pointwise1ChannelCount", single_Block0Input0ChannelCount ); // Single in parameters.
              } else { // Block.Base
                asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount ); // Double in reality internally.
              }
            }
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", quadruple_Block0Input0ChannelCount );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }
      }

      asserter.propertyValue( "bPointwise1Bias", true );
      asserter.propertyValue( "pointwise1ActivationId", stageParams.nActivationId );

      asserter.propertyValue( "depthwiseFilterHeight", stageParams.depthwiseFilterHeight );
      asserter.propertyValue( "depthwiseFilterWidth", stageParams.depthwiseFilterWidth );

      // depthwise_AvgMax_Or_ChannelMultiplier
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            else
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 4 );
            else
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            else
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            else
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }
      }

      // depthwiseStridesPad
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
            asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
            asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }
      }

      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageType ) ) {
        asserter.propertyValue( "bDepthwiseBias", true );
        asserter.propertyValue( "depthwiseActivationId", stageParams.nActivationId );
      } else {
        asserter.propertyValue( "bDepthwiseBias", false );
        asserter.propertyValue( "depthwiseActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
      }

      // pointwise21ChannelCount
      { // block0, 1, 2, 3, ...
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "pointwise21ChannelCount", double_Block0Input0ChannelCount );
            asserter.propertyValue( "pointwise22ChannelCount", 0 );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            asserter.propertyValue( "pointwise21ChannelCount", single_Block0Input0ChannelCount );
            asserter.propertyValue( "pointwise22ChannelCount", single_Block0Input0ChannelCount );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }
      }

      asserter.propertyValue( "bPointwise21Bias", true );

      // pointwise21ActivationId
      if ( ( blockCount - 1 ) > blockIndex ) { // block0, 1, 2, 3, ..., ( blockCount - 2 )
        if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageType ) ) {
          asserter.propertyValue( "pointwise21ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
        } else {
          asserter.propertyValue( "pointwise21ActivationId", stageParams.nActivationId );
        }
      } else { // blockLast
        if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageType ) ) {
          asserter.propertyValue( "pointwise21ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
        } else {
          if ( stageParams.bPointwise2ActivatedAtStageEnd == false ) {
            asserter.propertyValue( "pointwise21ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
          } else {
            asserter.propertyValue( "pointwise21ActivationId", stageParams.nActivationId );
          }
        }
      }

      // bOutput1Requested
      if ( ( blockCount - 1 ) > blockIndex ) { // block0, 1, 2, 3, ..., ( blockCount - 2 )
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "bOutput1Requested", false );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            asserter.propertyValue( "bOutput1Requested", true );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }

      } else { // blockLast
        asserter.propertyValue( "bOutput1Requested", false );
      }

      // outChannels0, outChannels1
      if ( ( blockCount - 1 ) > blockIndex ) { // block0, 1, 2, 3, ..., ( blockCount - 2 )
        switch ( nConvStageType ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "outChannels0", double_Block0Input0ChannelCount );
            asserter.propertyValue( "outChannels1", 0 );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            asserter.propertyValue( "outChannels0", single_Block0Input0ChannelCount );
            asserter.propertyValue( "outChannels1", single_Block0Input0ChannelCount );
            break;

          default: throw Error( strUnknownConvStageType ); break;
        }

      } else { // blockLast
        asserter.propertyValue( "outChannels0", double_Block0Input0ChannelCount );
        asserter.propertyValue( "outChannels1", 0 );
      }

      // .addInput0ToPointwise21, .addInput0ToPointwise22
      if ( blockParams instanceof Block.Base ) {

        // addInput0ToPointwise21
        if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageType ) ) {
          asserter.propertyValueNE( "addInput0ToPointwise21", null ); // Only MobileNetV2_Xxx has add-input-to-output.
        } else {
          asserter.propertyValue( "addInput0ToPointwise21", null );
        }

        // addInput0ToPointwise22
        asserter.propertyValue( "addInput0ToPointwise22", null ); // None of any neural network has add-input-to-output1.
      }

      // bKeepInputTensor
      if ( 0 == blockIndex ) {
        asserter.propertyValue( "bKeepInputTensor", stageParams.bKeepInputTensor );
      } else {
        asserter.propertyValue( "bKeepInputTensor", false );
      }

    }
  }

  /** According to imageIn and this.testParams.in.paramsNumberArrayObject, calculate imageOut.
   *
   * @param {object} imageIn
   *   The image to be tested.
   *
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   *
   * @return {object} Return output image as object { height, widthm depth, dataArray }.
   */
  calcResult( imageIn ) {
    let testParams = this.testParams;

    let channelShuffler_concatenatedShape;
    let channelShuffler_outputGroupCount = 2; // In ShuffleNetV2, channel shuffler always has 2 convolution group.

    {
      let referredParams = {};
      Stage.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call( referredParams,
        testParams.out.sourceHeight, testParams.out.sourceWidth );

      // In ShuffleNetV2, channel shuffler always has half ( height, width ) and twice channel count of original input0.
      channelShuffler_concatenatedShape = [ referredParams.outputHeight, referredParams.outputWidth, imageIn.depth * 2 ];

      // Create description for debug easily.
      this.paramsOutDescription =

          `sourceHeight=${testParams.out.sourceHeight}, sourceWidth=${testParams.out.sourceWidth}, `
        + `sourceChannelCount=${testParams.out.sourceChannelCount}, `
        + `blockCountRequested=${testParams.out.blockCountRequested}, `
        + `bPointwise1=${testParams.out.bPointwise1}, `
        + `depthwiseFilterHeight=${testParams.out.depthwiseFilterHeight}, depthwiseFilterWidth=${testParams.out.depthwiseFilterWidth}, `

        + `nActivationIdName=${ValueDesc.ActivationFunction.Singleton.getStringOf( testParams.out.nActivationId )}`
          + `(${testParams.out.nActivationId}), `

        + `bPointwise2BiasAtStageEnd=${testParams.out.bPointwise2BiasAtStageEnd}, `

        + `nConvStageType=${ValueDesc.ConvStageType.Singleton.getStringOf( testParams.out.nConvStageType )}`
          + `(${testParams.out.nConvStageType}), `

        + `outputHeight=${referredParams.outputHeight}, outputWidth=${referredParams.outputWidth}, `
//        + `outputChannelCount=${???.outputChannelCount}, `
        + `bKeepInputTensor=${testParams.out.bKeepInputTensor}`
      ;
    }

    Base.AssertParameters_Stage_blocks( testParams, this.paramsOutDescription ); // Test every block's parameters.

    // Calculate every blocks in sequence.

    let blockRef = this.Block_Reference;

    this.imageInArray[ 0 ] = imageIn;
    this.imageInArray[ 1 ] = null;

    let imageOutArray = this.imageInArray;
    let blockCount = testParams.blocksArray.length;
    for ( let blockIndex = 0; blockIndex < blockCount; ++blockIndex ) {
      blockRef.testParams = testParams.blocksArray[ blockIndex ];
      imageOutArray = blockRef.calcResult( imageOutArray, channelShuffler_concatenatedShape, channelShuffler_outputGroupCount );
    }

    let imageOut = imageOutArray[ 0 ]; // The blockLast should have only input0.
    return imageOut;
  }

}
