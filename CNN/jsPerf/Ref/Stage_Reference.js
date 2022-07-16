export { Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TensorTools from "../../util/TensorTools.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as BoundsArraySet_Asserter from "../../util/BoundsArraySet_Asserter.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as Pool_Asserter from "../../util/Pool_Asserter.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ImageSourceBag from "./ImageSourceBag.js"; 
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as Block_Reference from "./Block_Reference.js"; 
import * as Stage_TestParams from "./Stage_TestParams.js"; 
import * as Stage from "../../Conv/Stage.js";

/**
 * Reference computation of class Stage.Base.
 */
class Base extends Recyclable.Root {

  /**
   * Used as default Stage_Reference.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage_Reference.Base.Pool", Base, Base.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.Block_Reference = Block_Reference.Base.Pool.get_or_create_by();
    this.asserter_Equal = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.4, 0.005 );

    // For reducing memory allocation.
    this.imageInArray = Recyclable.Array.Pool.get_or_create_by( 2 );  // imageInArray[ 0 ] is input0, imageInArray[ 1 ] is input1.
    this.imageOutArray = Recyclable.Array.Pool.get_or_create_by( 2 );  // imageOutArray[ 0 ] is output0, imageOutArray[ 1 ] is output1.
  }

  /** @override */
  disposeResources() {
    this.imageOutArray?.disposeResources_and_recycleToPool();
    this.imageOutArray = null;

    this.imageInArray?.disposeResources_and_recycleToPool();
    this.imageInArray = null;

    this.asserter_Equal?.disposeResources_and_recycleToPool();
    this.asserter_Equal = null;

    this.Block_Reference?.disposeResources_and_recycleToPool();
    this.Block_Reference = null;

    super.disposeResources();
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

    let {
      sourceHeight, sourceWidth, sourceChannelCount,
    } = testParams.out;

    this.testCorrectness_imageIn = imageSourceBag.getImage_by( sourceHeight, sourceWidth, sourceChannelCount );

    Pool_Asserter.assert_Pool_issuedCount_same_after_as_before( "Stage_Reference.Base.testCorrectness_internal()",
      Base.testCorrectness_internal, this, imageSourceBag, testParams );

    this.testCorrectness_imageIn = null;
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
  static testCorrectness_internal( imageSourceBag, testParams ) {
    this.testParams = testParams;

    this.testCorrectness_imageOutReference = this.calcResult( this.testCorrectness_imageIn );

    Pool_Asserter.assert_Pool_issuedCount_same_after_as_before( "Stage_Reference.Base.stage_create_apply_internal()",
      Base.stage_create_apply_internal, this, imageSourceBag );

    { // Release output reference images.
      if ( this.testCorrectness_imageOutReference != this.testCorrectness_imageIn ) { // Do not release image from ImageSourceBag.
        this.testCorrectness_imageOutReference.disposeResources_and_recycleToPool();
      }
      this.testCorrectness_imageOutReference = null;
    }
  }

  /**
   * @param {Stage_Reference.Base} this
   *   The referenece object to do the calculate.
   *
   */
  static stage_create_apply_internal( imageSourceBag ) {
    let testParams = this.testParams;

    let {
      sourceHeight, sourceWidth, sourceChannelCount,
      bKeepInputTensor,

      outputHeight,
      outputWidth,

    } = testParams.out;

    let outputChannelCount = sourceChannelCount * 2; // In current Stage's design, the output channel always is twice as input.

    let inputTensor3d = imageSourceBag.getTensor3d_by( sourceHeight, sourceWidth, sourceChannelCount );

    let inputTensorDestroyCount; // How many input tensors will be destroyed by Stage.apply().
    if ( bKeepInputTensor ) {
      inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

    } else {
      inputTensor3d = inputTensor3d.clone(); // Clone for being destroyed. 
      inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
    }

    let tensorNumDifference_apply_before_after;
    let outputTensor3d;

    let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of block create/dispose.
    {
      let stage = Base.Stage_create( testParams );

      Base.AssertTwoEqualValues( "outputHeight", stage.outputHeight, outputHeight, stage );
      Base.AssertTwoEqualValues( "outputWidth", stage.outputWidth, outputWidth, stage );
      Base.AssertTwoEqualValues( "outputChannelCount", stage.outputChannelCount, outputChannelCount, stage );

      Base.AssertTwoEqualValues( "blockCount", stage.blockCount, testParams.blockArray.length, stage );

      // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
      // tensor count (i.e. inputTensorDestroyCount).
      let stage_outputTensorCount = 1;
      tensorNumDifference_apply_before_after = stage_outputTensorCount - inputTensorDestroyCount;

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of Stage.apply.
      outputTensor3d = stage.apply( inputTensor3d );
      let memoryInfo_apply_after = tf.memory();

      if ( memoryInfo_apply_after.numTensors != ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) )
        throw Error( `Stage.apply() memory leak. `
          + `result tensor count (${memoryInfo_apply_after.numTensors}) `
          + `should be (${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${stage}` );

      if ( !inputTensor3d )
        throw Error( `Stage inputTensor3d should not be null. ${stage}` ); // But may be disposed.

      if ( !outputTensor3d )
        throw Error( `Stage outputTensor3d should not be null. ${stage}` );

      { // Test output channel count.
        const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
        let outputTensorChannelCount = 0;

        if ( outputTensor3d && ( outputTensor3d.shape.length > CHANNEL_AXIS_ID ) )
          outputTensorChannelCount = outputTensor3d.shape[ CHANNEL_AXIS_ID ];

        // The real channel count of the output tensor should be the same as predicted output channel count.
        Base.AssertTwoEqualValues( "outChannels", stage.outputChannelCount, outputTensorChannelCount, stage );
      }

      // Test correctness of Stage BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( stage, this.testCorrectness_imageOutReference, stage );

      // Test correctness of Stage.apply.
      this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d, this.testCorrectness_imageOutReference, stage );

      stage.disposeResources_and_recycleToPool();
      stage = null;
    }
    let memoryInfo_afterDispose = tf.memory();

    if ( memoryInfo_afterDispose.numTensors != ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) )
      throw Error(  `Stage create/dispose memory leak. `
        + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
        + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
        + `${stage}` );

    tf.dispose( outputTensor3d );
  }

  /**
   * Check the Stage's output's BoundsArraySet.
   *
   * @param {Stage.Base} stage                    The stage to be checked.
   * @param {NumberImage.Base} imageOutReference  Refernece output Image data of the Stage_Reference's calcResult().
   */
  assert_imageOut_BoundsArraySet( stage, imageOutReference, parametersDescription ) {
    BoundsArraySet_Asserter.assert_ScaleBoundsArray( this.asserter_Equal,
      stage.output0.scaleBoundsArray, imageOutReference.boundsArraySet.output0,
      "output0", "output0_Ref", `Stage`, parametersDescription );
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

    this.asserter_Equal.assert_Tensor_NumberArray(
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

    let stage = Stage.Base.Pool.get_or_create_by();

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    // Initialize successfully or failed.
    let extractedParams = Stage.Params.Pool.get_or_create_by(
      testParams.in.sourceHeight, testParams.in.sourceWidth, testParams.in.sourceChannelCount,
      testParams.in.nConvStageTypeId,
      testParams.in.blockCountRequested,
      testParams.in.bPointwise1,
      testParams.in.depthwiseFilterHeight, testParams.in.depthwiseFilterWidth,
      testParams.in.bPointwise2BiasAtStageEnd,
      testParams.in.nSqueezeExcitationChannelCountDivisor,
      testParams.in.nActivationId,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = stage.init( progress, testParams.in.inputWeightArray, testParams.in.weightElementOffsetBegin, extractedParams,
      inputScaleBoundsArray0 );

    if ( stage.bInitOk != bInitOk )
      throw Error( `Stage validation state (${stage.bInitOk}) mismatches initer's result (${bInitOk}). ${stage}` );

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    if ( false == bInitOk )
      throw Error(  `Failed to initialize stage object. ${stage}` );

    if ( 100 != progress.valuePercentage )
      throw Error( 
        `Progress (${progress.valuePercentage}) should be 100 when initializing block object successfully. ${stage}`);

    if ( stage.weightElementOffsetEnd != testParams.in.inputWeightArray.byteLength ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    let asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by( `Stage`, stage, stage );

    Base.AssertTwoEqualValues( "parsing beginning position",
      stage.weightElementOffsetBegin, testParams.in.weightElementOffsetBegin, stage );

    Base.AssertTwoEqualValues( "parsing ending position",
      stage.weightElementOffsetEnd, testParams.in.inputWeightArray.byteLength, stage );

    // parameters.
    asserter.propertyValue( "sourceHeight", testParams.out.sourceHeight );
    asserter.propertyValue( "sourceWidth", testParams.out.sourceWidth );
    asserter.propertyValue( "sourceChannelCount", testParams.out.sourceChannelCount );
    asserter.propertyValue( "nConvStageTypeId", testParams.out.nConvStageTypeId );
    asserter.propertyValue( "blockCountRequested", testParams.out.blockCountRequested );
    asserter.propertyValue( "bPointwise1", testParams.out.bPointwise1 );
    asserter.propertyValue( "depthwiseFilterHeight", testParams.out.depthwiseFilterHeight );
    asserter.propertyValue( "depthwiseFilterWidth", testParams.out.depthwiseFilterWidth );
    asserter.propertyValue( "bPointwise2ActivatedAtStageEnd", testParams.out.bPointwise2ActivatedAtStageEnd );
    asserter.propertyValue( "nSqueezeExcitationChannelCountDivisor", testParams.out.nSqueezeExcitationChannelCountDivisor );
    asserter.propertyValue( "nActivationId", testParams.out.nActivationId );

    // Referred parameters.
    asserter.propertyValue( "outputHeight", testParams.out.outputHeight );
    asserter.propertyValue( "outputWidth", testParams.out.outputWidth );

    // Other parameters.
    asserter.propertyValue( "bKeepInputTensor", testParams.out.bKeepInputTensor );

    Base.AssertParameters_Stage_blocks( stage, stage ); // Test every block's parameters.

    {
      let tensorWeightCountTotal = 0;
      let tensorWeightCountExtracted = 0;

      for ( let i = 0; i < stage.blockArray.length; ++i ) {
        let block = stage.blockArray[ i ];
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

    asserter.disposeResources_and_recycleToPool();
    asserter = null;

    return stage;
  }

  /** */
  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    if ( value1 != value2 )
      throw Error(  `Stage ${valueName} (${value1}) should be (${value2}). ${parametersDescription}` );
  }

  /** */
  static Assert_nConvStageTypeId_Unknown( prefixMsg, nConvStageTypeId, postfixMsg ) {
    let strUnknownConvStageTypeId = `${prefixMsg} unknown nConvStageTypeId ( ${nConvStageTypeId} ) value. ${postfixMsg}`;
    throw Error( strUnknownConvStageTypeId );
  }

  /**
   * Test every block's parameters.
   *
   * @param {Stage.Base[]|Stage_TestParams.Base[]} stageParams
   *   The stage to be checked. It parameters will be checked.
   *
   */
  static AssertParameters_Stage_blocks( stageParams, parametersDescription ) {
    let blockParamsArray = stageParams.blockArray; // No matter Stage.Base or Stage_TestParams.Base

    if ( stageParams instanceof Stage_TestParams.Base ) {
      stageParams = stageParams.out;
    } else { // Stage.Base
    }

    let blockCountRequested = stageParams.blockCountRequested;
    let nConvStageTypeId = stageParams.nConvStageTypeId;

    let single_Block0Input0ChannelCount = stageParams.sourceChannelCount;        // Single of block0's input0 channel count.
    let double_Block0Input0ChannelCount = stageParams.sourceChannelCount * 2;    // Double of block0's input0 channel count.
    let quadruple_Block0Input0ChannelCount = stageParams.sourceChannelCount * 4; // Quadruple of block0's input0 channel count.

    let blockCount = blockParamsArray.length;

    if ( blockCount <= 0 )
      throw Error( `Stage blockCount (${blockCount}) should be larger than 0. ${parametersDescription}` );

    if ( blockCount < 2 )
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

      let asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by( `Stage.${blockName}`, blockParams, parametersDescription );

      // inputHeight0, inputWidth0
      if ( 0 == blockIndex ) { // block0
        asserter.propertyValue( "input0_height", stageParams.sourceHeight );
        asserter.propertyValue( "input0_width", stageParams.sourceWidth );
      } else { // block1, 2, 3, ...
        asserter.propertyValue( "input0_height", stageParams.outputHeight );
        asserter.propertyValue( "input0_width", stageParams.outputWidth );
      }

      // input0_channelCount
      if ( 0 == blockIndex ) { // block0
        asserter.propertyValue( "input0_channelCount", single_Block0Input0ChannelCount );
      } else { // block1, 2, 3, ...
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "input0_channelCount", double_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            asserter.propertyValue( "input0_channelCount", single_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "input0_channelCount", double_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }
      }

      // nConvBlockTypeId
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stageParams.bPointwise1 == false ) {
              asserter.propertyValue( "nConvBlockTypeId",
                ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2 );
            } else {
              asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD );
            }
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }

      } else if ( ( blockCount - 1 ) > blockIndex ) { // block1, 2, 3, ..., ( blockCount - 2 )
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }

      } else { // blockLast ( blockCount - 1 )
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }
      }

      // pointwise1ChannelCount
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageTypeId ) {
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
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", single_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
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

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
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
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", single_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }
      }

      //!!! (2022/07/15 Remarked) pointwise1Bias and pointwise1ActivationId are determined by Block.Params (and be tested there).
      //asserter.propertyValue( "pointwise1Bias", true );
      //asserter.propertyValue( "pointwise1ActivationId", stageParams.nActivationId );

      asserter.propertyValue( "depthwiseFilterHeight", stageParams.depthwiseFilterHeight );
      asserter.propertyValue( "depthwiseFilterWidth", stageParams.depthwiseFilterWidth );

      // depthwise_AvgMax_Or_ChannelMultiplier
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageTypeId ) {
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
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            else
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }

      } else { // block1, 2, 3, ...
//!!! ...unfinished... (2022/07/15) depthwise_AvgMax_Or_ChannelMultiplier

        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            if ( stageParams.bPointwise1 == false )
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            else
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }
      }

      // depthwiseStridesPad
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
            asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
            asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }
      }

      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageTypeId ) ) {
        asserter.propertyValue( "bDepthwiseBias", true );
        asserter.propertyValue( "depthwiseActivationId", stageParams.nActivationId );
      } else {
        asserter.propertyValue( "bDepthwiseBias", false );
        asserter.propertyValue( "depthwiseActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
      }

      // pointwise21ChannelCount
      { // block0, 1, 2, 3, ...
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "pointwise21ChannelCount", double_Block0Input0ChannelCount );
            asserter.propertyValue( "pointwise22ChannelCount", 0 );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            asserter.propertyValue( "pointwise21ChannelCount", single_Block0Input0ChannelCount );
            asserter.propertyValue( "pointwise22ChannelCount", single_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }
      }

      asserter.propertyValue( "bPointwise21Bias", true );

      // pointwise21ActivationId
      if ( ( blockCount - 1 ) > blockIndex ) { // block0, 1, 2, 3, ..., ( blockCount - 2 )
        if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageTypeId ) ) {
          asserter.propertyValue( "pointwise21ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
        } else {
          asserter.propertyValue( "pointwise21ActivationId", stageParams.nActivationId );
        }
      } else { // blockLast
        if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageTypeId ) ) {
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
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "bOutput1Requested", false );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            asserter.propertyValue( "bOutput1Requested", true );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }

      } else { // blockLast
        asserter.propertyValue( "bOutput1Requested", false );
      }

//!!! ...unfinished... (2022/07/15) 
      // squeeze-and-excitation
      {
        asserter.propertyValue( "nSqueezeExcitationChannelCountDivisor", stageParams.nSqueezeExcitationChannelCountDivisor );
        asserter.propertyValue( "squeezeExcitationActivationId", stageParams.nActivationId );

        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            asserter.propertyValue( "bSqueezeExcitationPrefix", false );
            break;

          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "bSqueezeExcitationPrefix", true );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }
      }

//!!! ...unfinished... (2022/07/15) 
      // output height and width
      {
        if ( blockParams instanceof Block_TestParams.Base ) {

          if ( blockParams.bDepthwiseRequestedAndNeeded ) {
            Base.AssertTwoEqualValues( `.${asserter.objectName}.outputHeight`,
              blockParams.inferencedParams.depthwisePadInfo.outputHeight, stageParams.outputHeight , asserter.contextDescription );

            Base.AssertTwoEqualValues( `.${asserter.objectName}.outputWidth`,
              blockParams.inferencedParams.depthwisePadInfo.outputWidth, stageParams.outputWidth , asserter.contextDescription );

          } else {
            asserter.propertyValue( "input0_height", stageParams.outputHeight );
            asserter.propertyValue( "input0_width", stageParams.outputWidth );
          }

        } else { // Block.Base
          asserter.propertyValue( "outputHeight", stageParams.outputHeight );
          asserter.propertyValue( "outputWidth", stageParams.outputWidth );
        }
      }

      // outChannels0, outChannels1
      if ( ( blockCount - 1 ) > blockIndex ) { // block0, 1, 2, 3, ..., ( blockCount - 2 )
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            asserter.propertyValue( "outChannels0", double_Block0Input0ChannelCount );
            asserter.propertyValue( "outChannels1", 0 );
            break;

          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            asserter.propertyValue( "outChannels0", single_Block0Input0ChannelCount );
            asserter.propertyValue( "outChannels1", single_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, asserter.contextDescription );
            break;
        }

      } else { // blockLast
        asserter.propertyValue( "outChannels0", double_Block0Input0ChannelCount );
        asserter.propertyValue( "outChannels1", 0 );
      }

      // .addInput0ToPointwise21, .addInput0ToPointwise22
      if ( blockParams instanceof Block.Base ) {

        // addInput0ToPointwise21
        if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageTypeId ) ) {
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

      asserter.disposeResources_and_recycleToPool();
      asserter = null;
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

    // Note: Do not generate parameters description string in advance every time.
    //       Just generate them only if necessary by .toString() for reducing memory re-allocation.
    testParams.out.toString = Base.TestParams_Out_toString; // For Creating description for debug easily.

//!!! (2022/07/15 Remarked) seems not used.
//     let channelShuffler_concatenatedShape;
//     let channelShuffler_outputGroupCount = 2; // In ShuffleNetV2, channel shuffler always has 2 convolution group.
//
//     // In ShuffleNetV2, channel shuffler always has half ( height, width ) and twice channel count of original input0.
//     channelShuffler_concatenatedShape = [ testParams.out.outputHeight, testParams.out.outputWidth, imageIn.depth * 2 ];

    Base.AssertParameters_Stage_blocks( testParams, testParams.out ); // Test every block's parameters.

    // Calculate every blocks in sequence.

    let blockRef = this.Block_Reference;

    this.imageOutArray[ 0 ] = imageIn;
    this.imageOutArray[ 1 ] = null;

    for ( let blockIndex = 0; blockIndex < testParams.blockArray.length; ++blockIndex ) {
      this.imageInArray[ 0 ] = this.imageOutArray[ 0 ];
      this.imageInArray[ 1 ] = this.imageOutArray[ 1 ];

      blockRef.testParams = testParams.blockArray[ blockIndex ];
      blockRef.calcResult( this.imageInArray, this.imageOutArray );

      // So that it can debug whether memory leak.
      {
        blockRef.testParams.Depthwise_PassThrough_FiltersArray_BiasesArray_Bag.disposeResources();
        blockRef.testParams.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag.disposeResources();
      }

      { // Release input image.
        if ( this.imageInArray[ 0 ] ) {
          if ( this.imageInArray[ 0 ] != imageIn ) { // Do not release image from ImageSourceBag.
            this.imageInArray[ 0 ].disposeResources_and_recycleToPool();
          }
          this.imageInArray[ 0 ] = null;
        }

        if ( this.imageInArray[ 1 ] ) {
          this.imageInArray[ 1 ].disposeResources_and_recycleToPool();
          this.imageInArray[ 1 ] = null;
        }
      }
    }

    let imageOut = this.imageOutArray[ 0 ]; // The blockLast should have only input0.

    // Avoid dangling tensors.
    this.imageInArray[ 0 ] = null;
    this.imageInArray[ 1 ] = null;
    this.imageOutArray[ 0 ] = null;
    this.imageOutArray[ 1 ] = null;

    return imageOut;
  }


  /**
   * @param {Stage_TestParams.out} this
   *   The testParams.outfor creating description.
   *
   * @return {string}
   *   The description of this.
   */
  static TestParams_Out_toString() {

    let paramsOutDescription =

        `sourceHeight=${this.sourceHeight}, sourceWidth=${this.sourceWidth}, `
      + `sourceChannelCount=${this.sourceChannelCount}, `
      + `blockCountRequested=${this.blockCountRequested}, `
      + `bPointwise1=${this.bPointwise1}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, depthwiseFilterWidth=${this.depthwiseFilterWidth}, `

      + `nActivationIdName=${ValueDesc.ActivationFunction.Singleton.getStringOf( this.nActivationId )}`
        + `(${this.nActivationId}), `

      + `bPointwise2BiasAtStageEnd=${this.bPointwise2BiasAtStageEnd}, `

      + `nConvStageTypeId=${ValueDesc.ConvStageType.Singleton.getStringOf( this.nConvStageTypeId )}`
        + `(${this.nConvStageTypeId}), `

      + `outputHeight=${this.outputHeight}, outputWidth=${this.outputWidth}, `
//        + `outputChannelCount=${???.outputChannelCount}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;

    return paramsOutDescription;
  }

}
