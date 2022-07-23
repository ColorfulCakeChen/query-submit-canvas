export { Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TensorTools from "../../util/TensorTools.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as BoundsArraySet_Asserter from "../../util/BoundsArraySet_Asserter.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ImageSourceBag from "./ImageSourceBag.js"; 
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as Block_Reference from "./Block_Reference.js"; 
import * as Stage_TestParams from "./Stage_TestParams.js"; 
import * as Block from "../../Conv/Block.js";
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

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before( "Stage_Reference.Base.testCorrectness_internal()",
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

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before( "Stage_Reference.Base.stage_create_apply_internal()",
      Base.stage_create_apply_internal, this, imageSourceBag, testParams );

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
  static stage_create_apply_internal( imageSourceBag, testParams ) {

    let {
      sourceHeight, sourceWidth, sourceChannelCount,
      nConvStageTypeId,
      bPointwise2ActivatedAtStageEnd,
      bKeepInputTensor,
    } = testParams.out;

    let inputTensor3d_fromBag = imageSourceBag.getTensor3d_by( sourceHeight, sourceWidth, sourceChannelCount );

    let inputTensor3d;
    let inputTensorDestroyCount; // How many input tensors will be destroyed by Stage.apply().
    if ( bKeepInputTensor ) {
      inputTensor3d = inputTensor3d_fromBag; // The same one because it will not be destroyed. 
      inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

    } else {
      inputTensor3d = inputTensor3d_fromBag.clone(); // Clone for being destroyed. 
      inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
    }

    let tensorNumDifference_apply_before_after;
    let outputTensor3d;

    let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of block create/dispose.
    {
      let stage = Base.Stage_create( testParams, this.testCorrectness_imageIn.boundsArraySet.output0 );

      let { outputHeight, outputWidth } = testParams.out.inferencedParams;
      let outputChannelCount = sourceChannelCount * 2; // In current Stage's design, the output channel always is twice as input.
  
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
        Base.AssertTwoEqualValues( "outputChannelCount", stage.outputChannelCount, outputTensorChannelCount, stage );
      }

      // Test correctness of Stage BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( stage, this.testCorrectness_imageOutReference, stage );

      // Test correctness of Stage.apply.
      this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d, this.testCorrectness_imageOutReference, stage );

      // Compare result of ShuffleNetV2 and ShuffleNetV2_byMobileNetV1.
      Base.stage_compare_ShuffleNetV2_and_ShuffleNetV2_byMobileNetV1.call( this,
        testParams, this.testCorrectness_imageIn.boundsArraySet.output0,
        inputTensor3d_fromBag, outputTensor3d );

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
   * @param {Stage_TestParams.Base} testParams   The stage's testing parameters.
   * @param {tf.tensor} inputTensor3d_fromBag    The input tensor from imageSourceBag.
   * @param {tf.tensor} outputTensor3d_original  The output tensor (from original stage) to be compared.
   */
  static stage_compare_ShuffleNetV2_and_ShuffleNetV2_byMobileNetV1(
    testParams, inputScaleBoundsArray0,
    inputTensor3d_fromBag, outputTensor3d_original ) {

    if ( bPointwise2ActivatedAtStageEnd == false )
      return; // In this case, ShuffleNetV2 and ShuffleNetV2_byMobileNetV1 are different because activation escaping scale.

    if (   ( nConvStageTypeId != ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2 )
        || ( nConvStageTypeId != ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 ) )
      return; // Only compare ShuffleNetV2 and ShuffleNetV2_byMobileNetV1.

    let {
      nConvStageTypeId,
      bKeepInputTensor,
    } = testParams.out;
 
    // Determine which ConvStageType will be generate.
    let nConvStageTypeId_original = nConvStageTypeId;
    let nConvStageTypeId_toBeCompared;
    switch ( nConvStageTypeId ) {
      case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2:
        nConvStageTypeId_toBeCompared = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1;
        break;
      case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1:
        nConvStageTypeId_toBeCompared = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2;
        break;
    }

    let nConvStageTypeId_original_name = ValueDesc.ConvStageType.Singleton.getName_byId( nConvStageTypeId_original );
    let nConvStageTypeId_toBeCompared_name = ValueDesc.ConvStageType.Singleton.getName_byId( nConvStageTypeId_toBeCompared );

    // Modify nConvStageTypeId.
    let nConvStageTypeId_weightsElementIndex;
    {
      if ( testParams.in.nConvStageTypeId == null ) { // i.e. Needs parameter nConvStageTypeId is inside .inputWeightArray.
        nConvStageTypeId_weightsElementIndex = testParams.weightsElementIndex_find_byName(
          Base.paramsNameOrderArray_Basic, this.in.paramsNumberArrayObject, this.in.weightElementOffsetBegin,
          Stage.Params.nConvStageTypeId.paramName );

        this.in.inputWeightArray[ nConvStageTypeId_weightsElementIndex ] = nConvStageTypeId_toBeCompared;

        // It seems not necessary to re-compose .inputWeightArray because all blocks' parameters are generated directly
        // by Stage_BlockParamsCreator (i.e. not in the .inputWeightArray).

//!!! (2022/07/23 Remarked) seems not necessary to re-generate filters and biases array
//         testParams.modifyParamValue( Stage.Params.nConvStageTypeId, nConvStageTypeId_toBeCompared );
//
// //!!! ...unfinished... (2022/07/22) How to re-generate with the same filters and biases array?
//         testParams.set_byParamsNumberArrayMap_ParamsOut( testParams.in.weightElementOffsetBegin );

      } else {
        testParams.in.nConvStageTypeId = nConvStageTypeId_toBeCompared;
      }
    }

    let stage_toBeCompared = Stage.Base.Pool.get_or_create_by();

    // Initialize successfully or failed.
    let extractedParams = Stage.Params.Pool.get_or_create_by(
      testParams.in.sourceHeight, testParams.in.sourceWidth, testParams.in.sourceChannelCount,
      testParams.in.nConvStageTypeId,
      testParams.in.blockCountRequested,
      testParams.in.bPointwise1,
      testParams.in.depthwiseFilterHeight, testParams.in.depthwiseFilterWidth,
      testParams.in.bPointwise2ActivatedAtStageEnd,
      testParams.in.nSqueezeExcitationChannelCountDivisor,
      testParams.in.nActivationId,
      testParams.in.bKeepInputTensor
    );

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
    let bInitOk = stage_toBeCompared.init( progress, testParams.in.inputWeightArray, testParams.in.weightElementOffsetBegin, extractedParams,
      inputScaleBoundsArray0 );

    if ( false == bInitOk )
      throw Error( `Failed to initialize stage object. ${stage_toBeCompared}` );

    if ( 100 != progress.valuePercentage )
      throw Error(
        `Progress (${progress.valuePercentage}) should be 100 when initializing block object successfully. ${stage}`);

    progress.disposeResources_and_recycleToPool();
    progress = null;

    // Prepare input tensor.
    let inputTensor3d;
    if ( bKeepInputTensor ) {
      inputTensor3d = inputTensor3d_fromBag; // The same one because it will not be destroyed. 
    } else {
      inputTensor3d = inputTensor3d_fromBag.clone(); // Clone for being destroyed. 
    }

    let outputTensor3d = stage_toBeCompared.apply( inputTensor3d );

    {
      // Test correctness of Stage BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( stage_toBeCompared, this.testCorrectness_imageOutReference, stage_toBeCompared );

      //!!! (2022/07/23 Remarked) Compare to outputTensor3d_original directly.
      //// Test correctness of Stage.apply.
      //this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d, this.testCorrectness_imageOutReference, stage );

      // Compare to outputTensor3d_original.
      let output_original = outputTensor3d_original.dataSync();
      this.asserter_Equal.assert_Tensor_NumberArray(
        outputTensor3d, output_original,
        "Stage_toBeCompared",
        nConvStageTypeId_toBeCompared_name,
        nConvStageTypeId_original_name,
        stage_toBeCompared
      );
    }

    tf.dispose( outputTensor3d );
    outputTensor3d = null;

    stage_toBeCompared.disposeResources_and_recycleToPool();
    stage_toBeCompared = null;

    // Restore nConvStageTypeId.
    {
      if ( testParams.in.nConvStageTypeId == null ) {
        // Do nothing. It seems not necessary to re-compose .inputWeightArray because it will not be used again.

//!!! (2022/07/23 Remarked) seems not necessary to restore.
//         testParams.modifyParamValue_pop(); // Restore param.
//         //!!! (2022/07/22 Remarked) No need to re-compose .inputWeightArray because it will not be used again.
//         //testParams.set_byParamsNumberArrayMap_ParamsOut( testParams.in.weightElementOffsetBegin );

      } else {
        testParams.in.nConvStageTypeId = nConvStageTypeId_original;
      }
    }  
  
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
      testParams.in.bPointwise2ActivatedAtStageEnd,
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
      throw Error( `Failed to initialize stage object. ${stage}` );

    if ( 100 != progress.valuePercentage )
      throw Error(
        `Progress (${progress.valuePercentage}) should be 100 when initializing block object successfully. ${stage}`);

    progress.disposeResources_and_recycleToPool();
    progress = null;

    if ( stage.weightElementOffsetEnd != testParams.in.inputWeightArray.length ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    let stage_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by( `Stage`, stage, stage );

    Base.AssertTwoEqualValues( "parsing beginning position",
      stage.weightElementOffsetBegin, testParams.in.weightElementOffsetBegin, stage );

    Base.AssertTwoEqualValues( "parsing ending position",
      stage.weightElementOffsetEnd, testParams.in.inputWeightArray.length, stage );

    // parameters.
    stage_asserter.propertyValue( "sourceHeight", testParams.out.sourceHeight );
    stage_asserter.propertyValue( "sourceWidth", testParams.out.sourceWidth );
    stage_asserter.propertyValue( "sourceChannelCount", testParams.out.sourceChannelCount );
    stage_asserter.propertyValue( "nConvStageTypeId", testParams.out.nConvStageTypeId );
    stage_asserter.propertyValue( "blockCountRequested", testParams.out.blockCountRequested );
    stage_asserter.propertyValue( "bPointwise1", testParams.out.bPointwise1 );
    stage_asserter.propertyValue( "depthwiseFilterHeight", testParams.out.depthwiseFilterHeight );
    stage_asserter.propertyValue( "depthwiseFilterWidth", testParams.out.depthwiseFilterWidth );
    stage_asserter.propertyValue( "bPointwise2ActivatedAtStageEnd", testParams.out.bPointwise2ActivatedAtStageEnd );
    stage_asserter.propertyValue( "nSqueezeExcitationChannelCountDivisor", testParams.out.nSqueezeExcitationChannelCountDivisor );
    stage_asserter.propertyValue( "nActivationId", testParams.out.nActivationId );

    // Referred parameters.
    stage_asserter.propertyValue( "outputHeight", testParams.out.inferencedParams.outputHeight );
    stage_asserter.propertyValue( "outputWidth", testParams.out.inferencedParams.outputWidth );

    // Other parameters.
    stage_asserter.propertyValue( "bKeepInputTensor", testParams.out.bKeepInputTensor );

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

      stage_asserter.propertyValue( "tensorWeightCountTotal", tensorWeightCountTotal );
      stage_asserter.propertyValue( "tensorWeightCountExtracted", tensorWeightCountExtracted );
    }

    stage_asserter.disposeResources_and_recycleToPool();
    stage_asserter = null;

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
   * @param {Stage.Base[]|Stage_TestParams.Base[]} stage_or_stageTestParams
   *   The stage to be checked. It parameters will be checked.
   *
   */
  static AssertParameters_Stage_blocks( stage_or_stageTestParams, parametersDescription ) {
    let blockArray_or_blockTestParamsArray = stage_or_stageTestParams.blockArray; // No matter Stage.Base or Stage_TestParams.Base

    let stage_or_stageTestParamsOut;
    if ( stage_or_stageTestParams instanceof Stage_TestParams.Base ) {
      stage_or_stageTestParamsOut = stage_or_stageTestParams.out;
    } else { // Stage.Base
      stage_or_stageTestParamsOut = stage_or_stageTestParams;
    }

    let blockCountRequested = stage_or_stageTestParamsOut.blockCountRequested;
    let nConvStageTypeId = stage_or_stageTestParamsOut.nConvStageTypeId;

    let single_Block0Input0ChannelCount = stage_or_stageTestParamsOut.sourceChannelCount;        // Single of block0's input0 channel count.
    let double_Block0Input0ChannelCount = stage_or_stageTestParamsOut.sourceChannelCount * 2;    // Double of block0's input0 channel count.
    let quadruple_Block0Input0ChannelCount = stage_or_stageTestParamsOut.sourceChannelCount * 4; // Quadruple of block0's input0 channel count.

    let blockCount = blockArray_or_blockTestParamsArray.length;

    if ( blockCount <= 0 )
      throw Error( `Stage blockCount (${blockCount}) should be larger than 0. ${parametersDescription}` );

    if ( blockCount < 2 )
      throw Error( `Stage blockCount (${blockCount}) should be >= 2. ${parametersDescription}` );

    let blockName, block_or_blockTestParamsOut, pointwise1ChannelCount;
    for ( let blockIndex = 0; blockIndex < blockCount; ++blockIndex ) {
      blockName = `block${blockIndex}`;

      {
        let block_or_blockTestParams = blockArray_or_blockTestParamsArray[ blockIndex ];
        if ( block_or_blockTestParams instanceof Block_TestParams.Base ) {
          block_or_blockTestParamsOut = block_or_blockTestParams.out;
        } else { // Block.Base
          block_or_blockTestParamsOut = block_or_blockTestParams;
        }
      }

      let block_or_blockTestParamsOut_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by(
        `Stage.${blockName}`, block_or_blockTestParamsOut, parametersDescription );

      // inputHeight0, inputWidth0
      {
        if ( 0 == blockIndex ) { // block0
          block_or_blockTestParamsOut_asserter.propertyValue( "input0_height", stage_or_stageTestParamsOut.sourceHeight );
          block_or_blockTestParamsOut_asserter.propertyValue( "input0_width", stage_or_stageTestParamsOut.sourceWidth );
        }

        if ( stage_or_stageTestParamsOut instanceof Stage_TestParams.Out ) {
          block_or_blockTestParamsOut_asserter.propertyValue( "input0_height", stage_or_stageTestParamsOut.inferencedParams.inputHeightArray[ blockIndex ] );
          block_or_blockTestParamsOut_asserter.propertyValue( "input0_width", stage_or_stageTestParamsOut.inferencedParams.inputWidthArray[ blockIndex ] );
        } else { // Stage.Base
          // Note: Stage.Base does not have information to verify every block's input height/width.
        }
      }

      // input0_channelCount
      if ( 0 == blockIndex ) { // block0
        block_or_blockTestParamsOut_asserter.propertyValue( "input0_channelCount", single_Block0Input0ChannelCount );
      } else { // block1, 2, 3, ...
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            block_or_blockTestParamsOut_asserter.propertyValue( "input0_channelCount", double_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            block_or_blockTestParamsOut_asserter.propertyValue( "input0_channelCount", single_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            block_or_blockTestParamsOut_asserter.propertyValue( "input0_channelCount", double_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }
      }

      // nConvBlockTypeId
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false ) {
              block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId",
                ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2 );
            } else {
              block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD );
            }
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }

      } else if ( ( blockCount - 1 ) > blockIndex ) { // block1, 2, 3, ..., ( blockCount - 2 )
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }

      } else { // blockLast ( blockCount - 1 )
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            block_or_blockTestParamsOut_asserter.propertyValue( "nConvBlockTypeId", ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }
      }

      // pointwise1ChannelCount
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", quadruple_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", single_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false ) {
              if ( block_or_blockTestParamsOut instanceof Block_TestParams.Out ) {
                block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", 0 ); // Zero in parameters.
              } else { // Block.Base
                block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount ); // Double in reality internally.
              }
            } else {
              if ( block_or_blockTestParamsOut instanceof Block_TestParams.Out ) {
                block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", single_Block0Input0ChannelCount ); // Single in parameters.
              } else { // Block.Base
                block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount ); // Double in reality internally.
              }
            }
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", double_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", quadruple_Block0Input0ChannelCount );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ChannelCount", single_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }
      }

      //!!! (2022/07/15 Remarked) pointwise1Bias and pointwise1ActivationId are determined by Block.Params (and be tested there).
      //block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1Bias", true );
      //block_or_blockTestParamsOut_asserter.propertyValue( "pointwise1ActivationId", stage_or_stageTestParamsOut.nActivationId );

      // depthwiseFilterHeight and depthwiseFilterWidth
      {
        if ( stage_or_stageTestParamsOut instanceof Stage_TestParams.Out ) {
          block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseFilterHeight_real", stage_or_stageTestParamsOut.inferencedParams.depthwiseFilterHeightArray[ blockIndex ] );
          block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseFilterWidth_real", stage_or_stageTestParamsOut.inferencedParams.depthwiseFilterWidthArray[ blockIndex ] );
        } else { // Stage.Base
          // Note: Stage.Base does not have information to verify every block's depthwise filter height/width.
        }
      }

      // depthwise_AvgMax_Or_ChannelMultiplier
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 4 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            if ( stage_or_stageTestParamsOut.bPointwise1 == false )
              block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            else
              block_or_blockTestParamsOut_asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }
      }

      // depthwiseStridesPad
      if ( 0 == blockIndex ) { // block0
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
            block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }

      } else { // block1, 2, 3, ...
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
            block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseStridesPad", ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }
      }

      // depthwiseActivationId
      {
        if ( ValueDesc.ConvStageType.isMobileNetV2( stage_or_stageTestParamsOut.nConvStageTypeId ) ) {
          //!!! (2022/07/16 Remarked) depthwiseBias is determined by Block.Params (and be tested there).
          //block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseBias", true );
          block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseActivationId", stage_or_stageTestParamsOut.nActivationId );

        } else {
          //!!! (2022/07/16 Remarked) depthwiseBias is determined by Block.Params (and be tested there).
          //block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseBias", false );
          block_or_blockTestParamsOut_asserter.propertyValue( "depthwiseActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
        }
      }

      //!!! (2022/07/16 Remarked) pointwise20Bias is determined by Block.Params (and be tested there).
      //block_or_blockTestParamsOut_asserter.propertyValue( "pointwise20Bias", true );

      // pointwise20ActivationId
      if ( ( blockCount - 1 ) > blockIndex ) { // block0, 1, 2, 3, ..., ( blockCount - 2 )
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            block_or_blockTestParamsOut_asserter.propertyValue( "pointwise20ActivationId", stage_or_stageTestParamsOut.nActivationId );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            block_or_blockTestParamsOut_asserter.propertyValue( "pointwise20ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }

      } else { // blockLast
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            if ( stage_or_stageTestParamsOut.bPointwise2ActivatedAtStageEnd == false ) {
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise20ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
            } else {
              block_or_blockTestParamsOut_asserter.propertyValue( "pointwise20ActivationId", stage_or_stageTestParamsOut.nActivationId );
            }
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            block_or_blockTestParamsOut_asserter.propertyValue( "pointwise20ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }
      }

      // squeeze-and-excitation
      {
        block_or_blockTestParamsOut_asserter.propertyValue( "nSqueezeExcitationChannelCountDivisor", stage_or_stageTestParamsOut.nSqueezeExcitationChannelCountDivisor );

        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            block_or_blockTestParamsOut_asserter.propertyValue( "bSqueezeExcitationPrefix", false );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
            block_or_blockTestParamsOut_asserter.propertyValue( "bSqueezeExcitationPrefix", true );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }
      }

      // output height and width
      {
        if ( stage_or_stageTestParamsOut instanceof Stage_TestParams.Out ) {
          block_or_blockTestParamsOut_asserter.propertyValue( "output_height", stage_or_stageTestParamsOut.inferencedParams.outputHeightArray[ blockIndex ] );
          block_or_blockTestParamsOut_asserter.propertyValue( "output_width", stage_or_stageTestParamsOut.inferencedParams.outputWidthArray[ blockIndex ] );
  
          if ( ( blockCount - 1 ) == blockIndex ) { // blockLast
            block_or_blockTestParamsOut_asserter.propertyValue( "output_height", stage_or_stageTestParamsOut.inferencedParams.outputHeight );
            block_or_blockTestParamsOut_asserter.propertyValue( "output_width", stage_or_stageTestParamsOut.inferencedParams.outputWidth );
          }
  
        } else { // Stage.Base
          // Note: Stage.Base does not have information to verify every block's input height/width.
        }
      }

      // output0_channelCount, output1_channelCount
      if ( ( blockCount - 1 ) > blockIndex ) { // block0, 1, 2, 3, ..., ( blockCount - 2 )
        switch ( nConvStageTypeId ) {
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
            block_or_blockTestParamsOut_asserter.propertyValue( "output0_channelCount", double_Block0Input0ChannelCount );
            block_or_blockTestParamsOut_asserter.propertyValue( "output1_channelCount", 0 );
            break;

          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (7)
            block_or_blockTestParamsOut_asserter.propertyValue( "output0_channelCount", single_Block0Input0ChannelCount );
            block_or_blockTestParamsOut_asserter.propertyValue( "output1_channelCount", single_Block0Input0ChannelCount );
            break;

          default:
            Base.Assert_nConvStageTypeId_Unknown(
              "Stage_Reference.Base.AssertParameters_Stage_blocks():", nConvStageTypeId, block_or_blockTestParamsOut_asserter.contextDescription );
            break;
        }

      } else { // blockLast
        block_or_blockTestParamsOut_asserter.propertyValue( "output0_channelCount", double_Block0Input0ChannelCount );
        block_or_blockTestParamsOut_asserter.propertyValue( "output1_channelCount", 0 );
      }

      // .addInput0ToPointwise20, .addInput0ToPointwise21
      if ( block_or_blockTestParamsOut instanceof Block.Base ) {

        // addInput0ToPointwise20
        if ( ValueDesc.ConvStageType.isMobileNetV2( stage_or_stageTestParamsOut.nConvStageTypeId ) ) {
          if ( 0 == blockIndex ) // block0
            block_or_blockTestParamsOut_asserter.propertyValue( "bAddInputToOutput0", false );
          else // block1, 2, 3, ... (Only MobileNetV2_Xxx's non-block0 has add-input-to-output.)
            block_or_blockTestParamsOut_asserter.propertyValue( "bAddInputToOutput0", true );
        } else {
          block_or_blockTestParamsOut_asserter.propertyValue( "bAddInputToOutput0", false );
        }

        // addInput0ToPointwise21
        block_or_blockTestParamsOut_asserter.propertyValue( "bAddInputToOutput1", false ); // None of any neural network has add-input-to-output1.
      }

      // bKeepInputTensor
      if ( 0 == blockIndex ) {
        block_or_blockTestParamsOut_asserter.propertyValue( "bKeepInputTensor", stage_or_stageTestParamsOut.bKeepInputTensor );
      } else {
        block_or_blockTestParamsOut_asserter.propertyValue( "bKeepInputTensor", false );
      }

      block_or_blockTestParamsOut_asserter.disposeResources_and_recycleToPool();
      block_or_blockTestParamsOut_asserter = null;
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

}
