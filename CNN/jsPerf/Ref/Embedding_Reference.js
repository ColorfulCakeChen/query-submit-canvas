export { Embedding_Reference_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TensorTools from "../../util/TensorTools.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as BoundsArraySet_Asserter from "../../util/BoundsArraySet_Asserter.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ImageSourceBag from "./ImageSourceBag.js"; 
import * as Embedding_TestParams from "./Embedding_TestParams.js"; 
import * as Embedding from "../../Conv/Embedding.js";

/**
 * Reference computation of class Embedding.Base.
 */
class Embedding_Reference_Base extends Recyclable.Root {

  /**
   * Used as default Embedding_Reference.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding_Reference.Base.Pool",
    Embedding_Reference_Base, Embedding_Reference_Base.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    Embedding_Reference_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Embedding_Reference_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.asserter_Equal = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.4, 0.005 );
  }

  /** @override */
  disposeResources() {
    this.asserter_Equal?.disposeResources_and_recycleToPool();
    this.asserter_Equal = null;

    super.disposeResources();
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {Embedding_TestParams.Base} testParams
   *   The test parameters. It is the value of Embedding_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  testCorrectness( imageSourceBag, testParams ) {

    let {
      input_height, input_width, input_channelCount,
    } = testParams.out;

    this.testCorrectness_imageIn = imageSourceBag.getImage_by( input_height, input_width, input_channelCount );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before( "Embedding_Reference.Base.testCorrectness_internal()",
      Embedding_Reference_Base.testCorrectness_internal, this, imageSourceBag, testParams );

    this.testCorrectness_imageIn = null;
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {Embedding_TestParams.Base} testParams
   *   The test parameters. It is the value of Embedding_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  static testCorrectness_internal( imageSourceBag, testParams ) {
    this.testParams = testParams;

    this.testCorrectness_imageOutReference = this.calcResult( this.testCorrectness_imageIn );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before(
      "Embedding_Reference.Base.embedding_create_apply_internal( AddGatherReshape )",
      Embedding_Reference_Base.embedding_create_apply_internal, this,
      Embedding.AddGatherReshape, imageSourceBag, testParams );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before(
      "Embedding_Reference.Base.embedding_create_apply_internal( SplitGatherConcat )",
      Embedding_Reference_Base.embedding_create_apply_internal, this,
      Embedding.SplitGatherConcat, imageSourceBag, testParams );

    { // Release output reference images.
      if ( this.testCorrectness_imageOutReference != this.testCorrectness_imageIn ) { // Do not release image from ImageSourceBag.
        this.testCorrectness_imageOutReference.disposeResources_and_recycleToPool();
      }
      this.testCorrectness_imageOutReference = null;
    }
  }

  /**
   * @param {Embedding_Reference.Base} this
   *   The referenece object to do the calculate.
   *
   * @param {Class} EmbeddingClass
   *   Either Embedding.AddGatherReshape or Embedding.SplitGatherConcat.
   *
   */
  static embedding_create_apply_internal( EmbeddingClass, imageSourceBag, testParams ) {

    let {
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor,
    } = testParams.out;

    let inputTensor3d_fromBag = imageSourceBag.getTensor3d_by( input_height, input_width, input_channelCount );

    let inputTensor3d;
    let inputTensorDestroyCount; // How many input tensors will be destroyed by Embedding.apply().
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
      let embedding = Embedding_Reference_Base.Embedding_create(
        EmbeddingClass, testParams, this.testCorrectness_imageIn.boundsArraySet.output0 );

      // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
      // tensor count (i.e. inputTensorDestroyCount).
      let embedding_outputTensorCount = 1;
      tensorNumDifference_apply_before_after = embedding_outputTensorCount - inputTensorDestroyCount;

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of Embedding.apply.
      outputTensor3d = embedding.apply( inputTensor3d );
      let memoryInfo_apply_after = tf.memory();

      if ( memoryInfo_apply_after.numTensors != ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) )
        throw Error( `Embedding.apply() memory leak. `
          + `result tensor count (${memoryInfo_apply_after.numTensors}) `
          + `should be (${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${embedding}` );

      if ( !inputTensor3d )
        throw Error( `Embedding inputTensor3d should not be null. ${embedding}` ); // But may be disposed.

      if ( !outputTensor3d )
        throw Error( `Embedding outputTensor3d should not be null. ${embedding}` );

      { // Test output channel count.
        const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
        let outputTensorChannelCount = 0;

        if ( outputTensor3d && ( outputTensor3d.shape.length > CHANNEL_AXIS_ID ) )
          outputTensorChannelCount = outputTensor3d.shape[ CHANNEL_AXIS_ID ];

        // The real channel count of the output tensor should be the same as predicted output channel count.
        Embedding_Reference_Base.AssertTwoEqualValues( "outputChannelCount", embedding.output_channelCount, outputTensorChannelCount, embedding );
      }

      // Test correctness of Embedding BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( embedding, this.testCorrectness_imageOutReference, embedding );

      // Test correctness of Embedding.apply.
      this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d, this.testCorrectness_imageOutReference, embedding );

      embedding.disposeResources_and_recycleToPool();
      embedding = null;
    }
    let memoryInfo_afterDispose = tf.memory();

    if ( memoryInfo_afterDispose.numTensors != ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) )
      throw Error(  `Embedding create/dispose memory leak. `
        + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
        + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
        + `${embedding}` );

    tf.dispose( outputTensor3d );
  }

  /**
   * Check the Embedding's output's BoundsArraySet.
   *
   * @param {Embedding.Base} embedding            The embedding to be checked.
   * @param {NumberImage.Base} imageOutReference  Refernece output Image data of the Embedding_Reference's calcResult().
   */
  assert_imageOut_BoundsArraySet( embedding, imageOutReference, parametersDescription ) {
    BoundsArraySet_Asserter.assert_ScaleBoundsArray( this.asserter_Equal,
      // embedding.output0.scaleBoundsArray, imageOutReference.boundsArraySet.output0,
      embedding.boundsArraySet.output0, imageOutReference.boundsArraySet.output0,
      "output0", "output0_Ref", "Embedding", parametersDescription );
  }

  /**
   * Check the Embedding's output according to input (for correctness testing).
   *
   * @param {tf.tensor3d} outputTensor            The output tensor of the Embedding's apply().
   * @param {NumberImage.Base} imageOutReference  Refernece output Image data of the Embedding_Reference's calcResult().
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
      "Embedding", "outputTensor", "outputRef", parametersDescription
    );
  }

  /**
   * @param {Class} EmbeddingClass
   *   Either Embedding.AddGatherReshape or Embedding.SplitGatherConcat.
   *
   * @param {Embedding_TestParams.Base} testParams
   *   The test parameters. It is the value of Embedding_TestParams.Base.ParamsGenerator()'s result.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Embedding value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {Embedding.Base} The created Embedding object.
   */
  static Embedding_create( EmbeddingClass, testParams, inputScaleBoundsArray0 ) {

    let embedding = EmbeddingClass.Pool.get_or_create_by();

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
  
    // Initialize successfully or failed.
    let extractedParams = Embedding.Params.Pool.get_or_create_by(
      testParams.in.input_height, testParams.in.input_width, testParams.in.input_channelCount,
      testParams.in.channelMultiplier, testParams.in.vocabularyCountPerInputChannel,
      testParams.in.bEmbedVocabularyId,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = embedding.init( progress,
      testParams.in_weights.weightArray, testParams.in_weights.weightElementOffsetBegin,
      extractedParams,
      inputScaleBoundsArray0 );

    if ( embedding.bInitOk != bInitOk )
      throw Error( `Embedding validation state (${embedding.bInitOk}) mismatches initer's result (${bInitOk}). ${embedding}` );

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    if ( false == bInitOk )
      throw Error( `Failed to initialize embedding object. ${embedding}` );

    if ( 100 != progress.valuePercentage )
      throw Error(
        `Progress (${progress.valuePercentage}) should be 100 when initializing block object successfully. ${embedding}`);

    progress.disposeResources_and_recycleToPool();
    progress = null;

    // if ( embedding.weightElementOffsetEnd != testParams.in_weights.weightArray.length ) { //!!! For Debug. (parsing ending position)
    //   debugger;
    // }

    let embedding_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by( "Embedding", embedding, embedding );

    Embedding_Reference_Base.AssertTwoEqualValues( "parsing beginning position",
      embedding.weightElementOffsetBegin, testParams.in_weights.weightElementOffsetBegin, embedding );

    Embedding_Reference_Base.AssertTwoEqualValues( "parsing ending position",
      embedding.weightElementOffsetEnd, testParams.in_weights.weightArray.length, embedding );

    // parameters.
    embedding_asserter.propertyValue( "input_height", testParams.out.input_height );
    embedding_asserter.propertyValue( "input_width", testParams.out.input_width );
    embedding_asserter.propertyValue( "input_channelCount", testParams.out.input_channelCount );
    embedding_asserter.propertyValue( "channelMultiplier", testParams.out.channelMultiplier );
    embedding_asserter.propertyValue( "vocabularyCountPerInputChannel", testParams.out.vocabularyCountPerInputChannel );
    embedding_asserter.propertyValue( "bEmbedVocabularyId", testParams.out.bEmbedVocabularyId );

    // Inferenced parameters.
    let { output_height, output_width, output_channelCount } = testParams.out.inferencedParams;

    embedding_asserter.propertyValue( "output_height", output_height );
    embedding_asserter.propertyValue( "output_width", output_width );
    embedding_asserter.propertyValue( "output_channelCount", output_channelCount );

    // Other parameters.
    embedding_asserter.propertyValue( "bKeepInputTensor", testParams.out.bKeepInputTensor );

    {
      let tensorWeightCountTotal = 0;
      let tensorWeightCountExtracted = 0;

      if ( testParams.out.bEmbedVocabularyId ) {
        tensorWeightCountExtracted = testParams.out.input_channelCount * ( testParams.out.channelMultiplier - 1 );
      } else {
        tensorWeightCountExtracted = testParams.out.input_channelCount * testParams.out.channelMultiplier;
      }

      embedding_asserter.propertyValue( "tensorWeightCountTotal", tensorWeightCountTotal );
      embedding_asserter.propertyValue( "tensorWeightCountExtracted", tensorWeightCountExtracted );
    }

    embedding_asserter.disposeResources_and_recycleToPool();
    embedding_asserter = null;

    return embedding;
  }

  /** */
  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    if ( value1 != value2 )
      throw Error( `Embedding ${valueName} (${value1}) should be (${value2}). ${parametersDescription}` );
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
    let testParamsOut = this.testParams.out;

    let { output_height, output_width, output_channelCount } = testParamsOut.inferencedParams;

    let imageOut;
    {
      let preFilledValue = undefined;
      let preFilledBounds = undefined;
      let input1_ScaleBoundsArray = null;
      imageOut = NumberImage_Base.Pool.get_or_create_by(
        output_height, output_width, output_channelCount, preFilledValue,
        imageIn.boundsArraySet.output0, input1_ScaleBoundsArray, BoundsArraySet.InputsOutputs, preFilledBounds
      );
    }

//!!! ...unfinished... (2022/07/26)
    let inElementIndex = 0;
    let outElementIndex = 0;

    for ( let y = 0; y < testParamsOut.input_height; ++y ) {
      for ( let x = 0; x < testParamsOut.input_width; ++x ) {

        let outChannelIndex = 0;
        for ( let inChannelIndex = 0; inChannelIndex < testParamsOut.input_channelCount; ++inChannelIndex ) {
          let vocabularyTable = testParams.in.paramsNumberArrayObject[ inChannelIndex ];
          let vocabularyId = imageIn.dataArray[ inElementIndex ];
          let vocabularyChannelIndex = vocabularyId * testParamsOut.channelMultiplier;

          for ( let outChannelSub = 0; outChannelSub < testParamsOut.channelMultiplier; ++outChannelSub ) {


            imageOut.dataArray[ outElementIndex ] = vocabularyTable[ vocabularyChannelIndex ];
            

//!!! ...unfinished... (2022/07/26)


            ++vocabularyChannelIndex;
            ++outElementIndex;
            ++outChannelIndex;
          }

          ++inElementIndex;
        }
      }
    }

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
