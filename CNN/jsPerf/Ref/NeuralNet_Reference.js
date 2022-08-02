export { NeuralNet_Reference_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NameNumberArrayObject from "../../util/NameNumberArrayObject.js";
import * as TensorTools from "../../util/TensorTools.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as BoundsArraySet_Asserter from "../../util/BoundsArraySet_Asserter.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ImageSourceBag from "./ImageSourceBag.js"; 
// import * as Embedding_TestParams from "./Embedding_TestParams.js"; 
import * as Embedding_Reference from "./Embedding_Reference.js"; 
// import * as Stage_TestParams from "./Stage_TestParams.js"; 
import * as Stage_Reference from "./Stage_Reference.js"; 
import * as NeuralNet_TestParams from "./NeuralNet_TestParams.js"; 
// import * as Embedding from "../../Conv/Stage.js";
// import * as Stage from "../../Conv/Stage.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";

/**
 * Reference computation of class NeuralNet.Base.
 */
class NeuralNet_Reference_Base extends Recyclable.Root {

  /**
   * Used as default NeuralNet_Reference.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet_Reference.Base.Pool",
    NeuralNet_Reference_Base, NeuralNet_Reference_Base.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    NeuralNet_Reference_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    NeuralNet_Reference_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.Embedding_Reference = Embedding_Reference.Base.Pool.get_or_create_by();
    this.Stage_Reference = Stage_Reference.Base.Pool.get_or_create_by();
    this.asserter_Equal = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.4, 0.005 );
  }

  /** @override */
  disposeResources() {
    this.asserter_Equal?.disposeResources_and_recycleToPool();
    this.asserter_Equal = null;

    this.Stage_Reference?.disposeResources_and_recycleToPool();
    this.Stage_Reference = null;

    super.disposeResources();
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {NeuralNet_TestParams.Base} testParams
   *   The test parameters. It is the value of NeuralNet_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  testCorrectness( imageSourceBag, testParams ) {

    let {
      input_height, input_width, input_channelCount,
    } = testParams.out;

    this.testCorrectness_imageIn = imageSourceBag.getImage_by( input_height, input_width, input_channelCount );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before( "NeuralNet_Reference.Base.testCorrectness_internal()",
      NeuralNet_Reference_Base.testCorrectness_internal, this, imageSourceBag, testParams );

    this.testCorrectness_imageIn = null;
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {NeuralNet_TestParams.Base} testParams
   *   The test parameters. It is the value of NeuralNet_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  static testCorrectness_internal( imageSourceBag, testParams ) {
    this.testParams = testParams;

    this.testCorrectness_imageOutReference = this.calcResult( this.testCorrectness_imageIn );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before( "NeuralNet_Reference.Base.neuralNet_create_apply_internal()",
      NeuralNet_Reference_Base.neuralNet_create_apply_internal, this, imageSourceBag, testParams );

    { // Release output reference images.
      if ( this.testCorrectness_imageOutReference != this.testCorrectness_imageIn ) { // Do not release image from ImageSourceBag.
        this.testCorrectness_imageOutReference.disposeResources_and_recycleToPool();
      }
      this.testCorrectness_imageOutReference = null;
    }
  }

  /**
   * @param {NeuralNet_Reference.Base} this
   *   The referenece object to do the calculate.
   *
   */
  static neuralNet_create_apply_internal( imageSourceBag, testParams ) {

    let {
      input_height, input_width, input_channelCount,
      bKeepInputTensor,
    } = testParams.out;

    let inputTensor3d_fromBag = imageSourceBag.getTensor3d_by( input_height, input_width, input_channelCount );

    let inputTensor3d;
    let inputTensorDestroyCount; // How many input tensors will be destroyed by NeuralNet.apply().
    if ( bKeepInputTensor ) {
      inputTensor3d = inputTensor3d_fromBag; // The same one because it will not be destroyed. 
      inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

    } else {
      inputTensor3d = inputTensor3d_fromBag.clone(); // Clone for being destroyed. 
      inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
    }

    let tensorNumDifference_apply_before_after;
    let outputTensor3d;

    let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of stage create/dispose.
    {
      let neuralNet = NeuralNet_Reference_Base.NeuralNet_create( testParams, this.testCorrectness_imageIn.boundsArraySet.output0 );

      // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
      // tensor count (i.e. inputTensorDestroyCount).
      let neuralNet_outputTensorCount = 1;
      tensorNumDifference_apply_before_after = neuralNet_outputTensorCount - inputTensorDestroyCount;

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of NeuralNet.apply.
      outputTensor3d = neuralNet.apply( inputTensor3d );
      let memoryInfo_apply_after = tf.memory();

      if ( memoryInfo_apply_after.numTensors != ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) )
        throw Error( `NeuralNet.apply() memory leak. `
          + `result tensor count (${memoryInfo_apply_after.numTensors}) `
          + `should be (${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${neuralNet}` );

      if ( !inputTensor3d )
        throw Error( `NeuralNet inputTensor3d should not be null. ${neuralNet}` ); // But may be disposed.

      if ( !outputTensor3d )
        throw Error( `NeuralNet outputTensor3d should not be null. ${neuralNet}` );

      { // Test output channel count.
        const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
        let outputTensorChannelCount = 0;

        if ( outputTensor3d && ( outputTensor3d.shape.length > CHANNEL_AXIS_ID ) )
          outputTensorChannelCount = outputTensor3d.shape[ CHANNEL_AXIS_ID ];

        // The real channel count of the output tensor should be the same as predicted output channel count.
        NeuralNet_Reference_Base.AssertTwoEqualValues( "output_channelCount", neuralNet.output_channelCount, outputTensorChannelCount, neuralNet );
      }

      // Test correctness of NeuralNet BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( neuralNet, this.testCorrectness_imageOutReference, neuralNet );

      // Test correctness of NeuralNet.apply.
      this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d, this.testCorrectness_imageOutReference, neuralNet );

      // Compare result of ShuffleNetV2 and ShuffleNetV2_byMobileNetV1.
      NeuralNet_Reference_Base.neuralNet_compare_ShuffleNetV2_and_ShuffleNetV2_byMobileNetV1.call( this,
        testParams, this.testCorrectness_imageIn.boundsArraySet.output0,
        inputTensor3d_fromBag, outputTensor3d );

      neuralNet.disposeResources_and_recycleToPool();
      neuralNet = null;
    }
    let memoryInfo_afterDispose = tf.memory();

    if ( memoryInfo_afterDispose.numTensors != ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) )
      throw Error(  `NeuralNet create/dispose memory leak. `
        + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
        + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
        + `${neuralNet}` );

    tf.dispose( outputTensor3d );
  }

  /**
   * @param {NeuralNet_TestParams.Base} testParams   The neuralNet's testing parameters.
   * @param {tf.tensor} inputTensor3d_fromBag    The input tensor from imageSourceBag.
   * @param {tf.tensor} outputTensor3d_original  The output tensor (from original neuralNet) to be compared.
   */
  static neuralNet_compare_ShuffleNetV2_and_ShuffleNetV2_byMobileNetV1(
    testParams, inputScaleBoundsArray0,
    inputTensor3d_fromBag, outputTensor3d_original ) {

    let {
      nConvStageTypeId,
      bKeepInputTensor,
    } = testParams.out;

    if (   ( nConvStageTypeId != ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2 )
        && ( nConvStageTypeId != ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 ) )
      return; // Only compare ShuffleNetV2 and ShuffleNetV2_byMobileNetV1.

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
    let nConvStageTypeId_weightElementIndex;
    {
      if ( testParams.in.nConvStageTypeId == null ) { // i.e. Needs parameter nConvStageTypeId is inside .inputWeightArray.
        nConvStageTypeId_weightElementIndex
          = NameNumberArrayObject.weightArray_weightElementOffsetBegin.weightElementIndex_find_byName(
              NeuralNet_TestParams.Base.paramsNameOrderArray_Basic,
              testParams.in.paramsNumberArrayObject, testParams.in_weights.weightElementOffsetBegin,
              NeuralNet.Params.nConvStageTypeId.paramName );

        testParams.in_weights.weightArray[ nConvStageTypeId_weightElementIndex ] = nConvStageTypeId_toBeCompared;

        // It seems not necessary to re-compose .inputWeightArray because all stages' parameters are generated directly
        // by NeuralNet_StageParamsCreator (i.e. not in the .inputWeightArray).

      } else {
        testParams.in.nConvStageTypeId = nConvStageTypeId_toBeCompared;
      }
    }

    let neuralNet_toBeCompared = NeuralNet.Base.Pool.get_or_create_by();

    // Initialize successfully or failed.
    let extractedParams = NeuralNet.Params.Pool.get_or_create_by(
      testParams.in.input_height, testParams.in.input_width, testParams.in.input_channelCount,
      testParams.in.vocabularyChannelCount, testParams.in.vocabularyCountPerInputChannel,
      testParams.in.nConvStageTypeId, testParams.in.stageCountRequested,
      testParams.in.blockCountRequested,
      testParams.in.bKeepInputTensor
    );

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
    let bInitOk = neuralNet_toBeCompared.init( progress,
      testParams.in_weights.weightArray, testParams.in_weights.weightElementOffsetBegin,
      extractedParams,
      inputScaleBoundsArray0 );

    if ( false == bInitOk )
      throw Error( `Failed to initialize neuralNet object. ${neuralNet_toBeCompared}` );

    if ( 100 != progress.valuePercentage )
      throw Error(
        `Progress (${progress.valuePercentage}) should be 100 when initializing stage object successfully. ${neuralNet}`);

    progress.disposeResources_and_recycleToPool();
    progress = null;

    // Prepare input tensor.
    let inputTensor3d;
    if ( bKeepInputTensor ) {
      inputTensor3d = inputTensor3d_fromBag; // The same one because it will not be destroyed. 
    } else {
      inputTensor3d = inputTensor3d_fromBag.clone(); // Clone for being destroyed. 
    }

    let outputTensor3d = neuralNet_toBeCompared.apply( inputTensor3d );

    {
      // Test correctness of NeuralNet BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( neuralNet_toBeCompared, this.testCorrectness_imageOutReference, neuralNet_toBeCompared );

      //!!! (2022/07/23 Remarked) Compare to outputTensor3d_original directly.
      //// Test correctness of NeuralNet.apply.
      //this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d, this.testCorrectness_imageOutReference, neuralNet );

      // Compare to outputTensor3d_original.
      let output_original = outputTensor3d_original.dataSync();
      this.asserter_Equal.assert_Tensor_NumberArray(
        outputTensor3d, output_original,
        "NeuralNet_toBeCompared",
        nConvStageTypeId_toBeCompared_name,
        nConvStageTypeId_original_name,
        neuralNet_toBeCompared
      );
    }

    tf.dispose( outputTensor3d );
    outputTensor3d = null;

    neuralNet_toBeCompared.disposeResources_and_recycleToPool();
    neuralNet_toBeCompared = null;

    // Restore nConvStageTypeId.
    {
      if ( testParams.in.nConvStageTypeId == null ) {
        // Do nothing. It seems not necessary to re-compose .inputWeightArray because it will not be used again.
      } else {
        testParams.in.nConvStageTypeId = nConvStageTypeId_original;
      }
    }  
  
  }

  /**
   * Check the NeuralNet's output's BoundsArraySet.
   *
   * @param {NeuralNet.Base} neuralNet            The neuralNet to be checked.
   * @param {NumberImage.Base} imageOutReference  Refernece output Image data of the NeuralNet_Reference's calcResult().
   */
  assert_imageOut_BoundsArraySet( neuralNet, imageOutReference, parametersDescription ) {
    BoundsArraySet_Asserter.assert_ScaleBoundsArray( this.asserter_Equal,
      neuralNet.output0.scaleBoundsArray, imageOutReference.boundsArraySet.output0,
      "output0", "output0_Ref", "NeuralNet", parametersDescription );
  }

  /**
   * Check the NeuralNet's output according to input (for correctness testing).
   *
   * @param {tf.tensor3d} outputTensor            The output tensor of the NeuralNet's apply().
   * @param {NumberImage.Base} imageOutReference  Refernece output Image data of the NeuralNet_Reference's calcResult().
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
      "NeuralNet", "outputTensor", "outputRef", parametersDescription
    );
  }

  /**
   * @param {NeuralNet_TestParams.Base} testParams
   *   The test parameters. It is the value of NeuralNet_TestParams.Base.ParamsGenerator()'s result.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous NeuralNet value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {NeuralNet.Base} The created NeuralNet object.
   */
  static NeuralNet_create( testParams, inputScaleBoundsArray0 ) {

    let neuralNet = NeuralNet.Base.Pool.get_or_create_by();

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    // Initialize successfully or failed.
    let extractedParams = NeuralNet.Params.Pool.get_or_create_by(
      testParams.in.input_height, testParams.in.input_width, testParams.in.input_channelCount,
      testParams.in.vocabularyChannelCount, testParams.in.vocabularyCountPerInputChannel,
      testParams.in.nConvStageTypeId, testParams.in.stageCountRequested,
      testParams.in.blockCountRequested,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = neuralNet.init( progress,
      testParams.in_weights.weightArray, testParams.in_weights.weightElementOffsetBegin,
      extractedParams,
      inputScaleBoundsArray0 );

    if ( neuralNet.bInitOk != bInitOk )
      throw Error( `NeuralNet validation state (${neuralNet.bInitOk}) mismatches initer's result (${bInitOk}). ${neuralNet}` );

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    if ( false == bInitOk )
      throw Error( `Failed to initialize neuralNet object. ${neuralNet}` );

    if ( 100 != progress.valuePercentage )
      throw Error(
        `Progress (${progress.valuePercentage}) should be 100 when initializing stage object successfully. ${neuralNet}`);

    progress.disposeResources_and_recycleToPool();
    progress = null;

    if ( neuralNet.weightElementOffsetEnd != testParams.in_weights.weightArray.length ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    let neuralNet_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by( "NeuralNet", neuralNet, neuralNet );

    NeuralNet_Reference_Base.AssertTwoEqualValues( "parsing beginning position",
      neuralNet.weightElementOffsetBegin, testParams.in_weights.weightElementOffsetBegin, neuralNet );

    NeuralNet_Reference_Base.AssertTwoEqualValues( "parsing ending position",
      neuralNet.weightElementOffsetEnd, testParams.in_weights.weightArray.length, neuralNet );

    // parameters.
    neuralNet_asserter.propertyValue( "input_height", testParams.out.input_height );
    neuralNet_asserter.propertyValue( "input_width", testParams.out.input_width );
    neuralNet_asserter.propertyValue( "input_channelCount", testParams.out.input_channelCount );
    neuralNet_asserter.propertyValue( "vocabularyChannelCount", testParams.out.vocabularyChannelCount );
    neuralNet_asserter.propertyValue( "vocabularyCountPerInputChannel", testParams.out.vocabularyCountPerInputChannel );
    neuralNet_asserter.propertyValue( "nConvStageTypeId", testParams.out.nConvStageTypeId );
    neuralNet_asserter.propertyValue( "stageCountRequested", testParams.out.stageCountRequested );
    neuralNet_asserter.propertyValue( "blockCountRequested", testParams.out.blockCountRequested );
    neuralNet_asserter.propertyValue( "nActivationId", testParams.out.nActivationId );

    // Inferenced parameters.
    let { stageCount, output_height, output_width, output_channelCount }
      = testParams.out.inferencedParams;

    neuralNet_asserter.propertyValue( "stageCount", stageCount );
    neuralNet_asserter.propertyValue( "stageCount", testParams.stageArray.length );
    neuralNet_asserter.propertyValue( "output_height", output_height );
    neuralNet_asserter.propertyValue( "output_width", output_width );
    neuralNet_asserter.propertyValue( "output_channelCount", output_channelCount );

    // Every stage will double channel count.
    let embedding_output_channelCount = testParams.out.input_channelCount * testParams.out.vocabularyChannelCount;
    neuralNet_asserter.propertyValue( "output_channelCount",
      embedding_output_channelCount * ( 2 ** stageCount ) );

    // Other parameters.
    neuralNet_asserter.propertyValue( "bKeepInputTensor", testParams.out.bKeepInputTensor );

    NeuralNet_Reference_Base.AssertParameters_NeuralNet_embedding( neuralNet, neuralNet ); // Test embedding 's parameters.
    NeuralNet_Reference_Base.AssertParameters_NeuralNet_stages( neuralNet, neuralNet ); // Test every stage's parameters.

    {
      let tensorWeightCountTotal = 0;
      let tensorWeightCountExtracted = 0;

      if ( neuralNet.embedding ) {
        tensorWeightCountTotal += neuralNet.embedding.tensorWeightCountTotal;
        tensorWeightCountExtracted += neuralNet.embedding.tensorWeightCountExtracted;
      }

      for ( let i = 0; i < neuralNet.stageArray.length; ++i ) {
        let stage = neuralNet.stageArray[ i ];
        tensorWeightCountTotal += stage.tensorWeightCountTotal;
        tensorWeightCountExtracted += stage.tensorWeightCountExtracted;
      }

      neuralNet_asserter.propertyValue( "tensorWeightCountTotal", tensorWeightCountTotal );
      neuralNet_asserter.propertyValue( "tensorWeightCountExtracted", tensorWeightCountExtracted );
    }

    neuralNet_asserter.disposeResources_and_recycleToPool();
    neuralNet_asserter = null;

    return neuralNet;
  }

  /** */
  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    if ( value1 != value2 )
      throw Error( `NeuralNet ${valueName} (${value1}) should be (${value2}). ${parametersDescription}` );
  }

  /** */
  static Assert_nConvStageTypeId_Unknown( prefixMsg, nConvStageTypeId, postfixMsg ) {
    let strUnknownConvStageTypeId = `${prefixMsg} unknown nConvStageTypeId ( ${nConvStageTypeId} ) value. ${postfixMsg}`;
    throw Error( strUnknownConvStageTypeId );
  }

  /**
   * Test neural network's embedding parameters.
   *
   * @param {NeuralNet.Base} neuralNet
   *   The neuralNet to be checked. It parameters will be checked.
   *
   */
  static AssertParameters_NeuralNet_embedding( neuralNet, parametersDescription ) {
    let embedding = neuralNet.embedding;

    let embedding_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by(
      "`NeuralNet.embedding", embedding, parametersDescription );

    embedding_asserter.propertyValue( "channelMultiplier", neuralNet.vocabularyChannelCount );
    embedding_asserter.propertyValue( "vocabularyCountPerInputChannel", neuralNet.vocabularyCountPerInputChannel );
    embedding_asserter.propertyValue( "bKeepInputTensor", neuralNet.bKeepInputTensor );

    embedding_asserter.disposeResources_and_recycleToPool();
    embedding_asserter = null;
  }

  /**
   * Test every stage's parameters.
   *
   * @param {NeuralNet.Base} neuralNet
   *   The neuralNet to be checked. It parameters will be checked.
   *
   */
  static AssertParameters_NeuralNet_stages( neuralNet, parametersDescription ) {
    let stageArray = neuralNet.stageArray;

    // let stageCountRequested = neuralNet.stageCountRequested;
    // let nConvStageTypeId = neuralNet.nConvStageTypeId;

    let stageCount = stageArray.length;

    if ( stageCount <= 0 )
      throw Error( `NeuralNet stageCount (${stageCount}) should be larger than 0. ${parametersDescription}` );

    if ( stageCount < 1 )
      throw Error( `NeuralNet stageCount (${stageCount}) should be >= 1. ${parametersDescription}` );

    let stageName, stage, stagePrevious;
    for ( let stageIndex = 0; stageIndex < stageCount; ++stageIndex ) {
      stageName = `stage${stageIndex}`;
      stage = stageArray[ stageIndex ];

      if ( 0 == stageIndex ) { // stage0
        stagePrevious = undefined;
      } else { // stage1, 2, 3, ...
        stagePrevious = stageArray[ stageIndex - 1 ];
      }

      let stage_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by(
        `NeuralNet.${stageName}`, stage, parametersDescription );

      // input0_height, input0_width
      {
        if ( 0 == stageIndex ) { // stage0
          stage_asserter.propertyValue( "input_height", neuralNet.input_height );
          stage_asserter.propertyValue( "input_width", neuralNet.input_width );
        }

        // Note: NeuralNet.Base does not have information to verify every stage's input height/width.
      }

      // input0_channelCount
      if ( 0 == stageIndex ) { // stage0
        stage_asserter.propertyValue( "input_channelCount",
          neuralNet.input_channelCount * neuralNet.vocabularyChannelCount );

      } else { // stage1, 2, 3, ...
        stage_asserter.propertyValue( "input_channelCount", stagePrevious.output_channel * 2 ); // Every stage double previous channel count.
      }

      // nConvStageTypeId
      stage_asserter.propertyValue( "nConvStageTypeId", neuralNet.nConvStageTypeId );

      // bPointwise2ActivatedAtStageEnd
      if ( ( stageCount - 1 ) > stageIndex ) { // stage0, 1, 2, 3, ..., ( stageCount - 2 )
        stage_asserter.propertyValue( "bPointwise2ActivatedAtStageEnd", true );

      } else { // stageLast ( stageCount - 1 )
        // The final stage's output should not have activation function.
        stage_asserter.propertyValue( "bPointwise2ActivatedAtStageEnd", false );
      }

      // output_channelCount
      {
        stage_asserter.propertyValue( "input_channelCount", stage.input_channel * 2 ); // Every stage double its input channel count.
      }

      // bKeepInputTensor
      //
      // In NeuralNet, only the embedding layer use specified bKeepInputTensor flag.
      // All stages use ( bKeepInputTensor == false ).
      stage_asserter.propertyValue( "bKeepInputTensor", false );

      stage_asserter.disposeResources_and_recycleToPool();
      stage_asserter = null;
    }
  }

  /** According to imageIn and this.testParams.in.paramsNumberArrayObject, calculate imageOut.
   *
   * @param {NumberImage.Base} imageIn
   *   The image to be tested.
   *
   * @return {NumberImage.Base} Return output image.
   */
  calcResult( imageIn ) {
    let testParams = this.testParams;

    let imageOut;
    let imageToBeProccessed = imageIn;

    // Calculate embedding.
    let embeddingRef = this.Embedding_Reference;
    embeddingRef.testParams = testParams.embedding;
    imageOut = embeddingRef.calcResult( imageToBeProccessed );

    // Calculate every stages in sequence.
    let stageRef = this.Stage_Reference;
    for ( let stageIndex = 0; stageIndex < testParams.stageArray.length; ++stageIndex ) {
      imageToBeProccessed = imageOut;

      stageRef.testParams = testParams.stageArray[ stageIndex ];
      imageOut = stageRef.calcResult( imageToBeProccessed );

      { // Release intermediate input images.
        if ( imageToBeProccessed ) {
          if ( imageToBeProccessed != imageIn ) { // Do not release image from ImageSourceBag.
            imageToBeProccessed.disposeResources_and_recycleToPool();
          }
          imageToBeProccessed = null;
        }
      }
    }

    return imageOut;
  }

}
