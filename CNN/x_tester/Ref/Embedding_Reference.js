export { Embedding_Reference_Base as Base };

import * as HierarchicalNameable from "../../util/HierarchicalNameable.js";
import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as TensorTools from "../../util/TensorTools.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as BoundsArraySet_Asserter from "../../util/BoundsArraySet_Asserter.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as TableLogger from "../../util/TableLogger.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ActivationEscaping from "../../ConvActivationEscaping.js";
import * as BoundsArraySet from "../../Conv/BoundsArraySet.js";
import * as Embedding from "../../Conv/Embedding.js";
import * as ImageSourceBag from "./ImageSourceBag.js"; 
import * as NumberImage from "./NumberImage.js"; 
import * as Embedding_TestParams from "./Embedding_TestParams.js"; 

/**
 * Reference computation of class Embedding.Base.
 */
class Embedding_Reference_Base
  extends HierarchicalNameable.SeparatorSlash_Root {

  /**
   * Used as default Embedding_Reference.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding_Reference.Base.Pool",
    Embedding_Reference_Base );

  /**
   *
   */
  constructor( parentNameable, name ) {
    super( parentNameable, name );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor( parentNameable, name ) {
    super.setAsConstructor( parentNameable, name );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    this.asserter_Equal
      = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.01, 0.005 );
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
   *   The test parameters. It is the value of
   * Embedding_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  testCorrectness( imageSourceBag, testParams ) {

    let {
      input_height, input_width, input_channelCount,
    } = testParams.out;

    this.testCorrectness_imageIn = imageSourceBag.getImage_by(
      input_height, input_width, input_channelCount );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before(
      "Embedding_Reference.Base.testCorrectness_internal()",
      Embedding_Reference_Base.testCorrectness_internal,
      this,
      imageSourceBag, testParams );

    this.testCorrectness_imageIn = null;
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {Embedding_TestParams.Base} testParams
   *   The test parameters. It is the value of
   * Embedding_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  static testCorrectness_internal( imageSourceBag, testParams ) {
    this.testParams = testParams;

    const bTableLog = testParams.out.bTableLog;
    if ( bTableLog ) {
      const groupLabel = `testParams.id == ${testParams.id}`;
      console.groupCollapsed( groupLabel );

      {
        const imageIn0_imageHeaderPrefix = "imageIn";
        const imageIn0_strSubheader = undefined;
        this.testCorrectness_imageIn.TableLog_header_body(
          imageIn0_imageHeaderPrefix, imageIn0_strSubheader );
      }
    }

    this.testCorrectness_imageOutReference = this.calcResult(
      this.testCorrectness_imageIn );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before(
      "Embedding_Reference.Base.embedding_create_apply_internal( AddGatherReshape )",
      Embedding_Reference_Base.embedding_create_apply_internal,
      this,
      Embedding.AddGatherReshape, imageSourceBag, testParams );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before(
      "Embedding_Reference.Base.embedding_create_apply_internal( SplitReshapeGatherConcat )",
      Embedding_Reference_Base.embedding_create_apply_internal, this,
      Embedding.SplitReshapeGatherConcat, imageSourceBag, testParams );

    { // Release output reference images.

      if ( this.testCorrectness_imageOutReference
             != this.testCorrectness_imageIn ) {
        this.testCorrectness_imageOutReference
          .disposeResources_and_recycleToPool();

      // Do not release image from ImageSourceBag.
      }
      this.testCorrectness_imageOutReference = null;
    }

    if ( bTableLog )
      console.groupEnd();  // groupLabel "testParams.id"
  }

  /**
   * @param {Embedding_Reference.Base} this
   *   The referenece object to do the calculate.
   *
   * @param {Class} EmbeddingClass
   *   Either Embedding.AddGatherReshape or Embedding.SplitReshapeGatherConcat.
   *
   */
  static embedding_create_apply_internal(
    EmbeddingClass, imageSourceBag, testParams ) {

    const {
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor, bTableLog,
    } = testParams.out;

    let inputTensor3d_fromBag = imageSourceBag.getTensor3d_by(
      input_height, input_width, input_channelCount );

    let inputTensor3d;

    // How many input tensors will be destroyed by Embedding.apply().
    let inputTensorDestroyCount;

    if ( bKeepInputTensor ) {

      // The same one because it will not be destroyed. 
      inputTensor3d = inputTensor3d_fromBag;

      // Since keep-input, no input tensors will be destroyed.
      inputTensorDestroyCount = 0;

    } else {

      // Clone for being destroyed. 
      inputTensor3d = inputTensor3d_fromBag.clone();

      // Since no keep-input, the input tensor destroyed count will be the same
      // as input tensor count.
      inputTensorDestroyCount = 1;
    }

    let tensorNumDifference_apply_before_after;
    let outputTensor3d;

    // Test memory leakage of block create/dispose.
    let memoryInfo_beforeCreate = tf.memory();
    {
      let embedding = Embedding_Reference_Base.Embedding_create(
        EmbeddingClass, testParams );

      // Table log the input tensors if requested.
      const bTableLog = embedding.bTableLog;
      if ( bTableLog ) {
        const imageIn_BoundsArraySet
          = this.testCorrectness_imageIn.boundsArraySet;

        const imageIn_ScaleBoundsArray = imageIn_BoundsArraySet.output0;

        const tensorIn0_imageHeaderPrefix = "tensorIn";
        const tensorIn0_strSubheader = undefined;
        TableLogger.Base.Singleton.log_tensor3d_along_depth(
          tensorIn0_imageHeaderPrefix, tensorIn0_strSubheader,
          inputTensor3d,
          this.testCorrectness_imageIn,
          imageIn_ScaleBoundsArray );
      }

      // The difference tensor count will be the generated tensor count (i.e.
      // outputTensorCount) minus destroyed input tensor count (i.e.
      // inputTensorDestroyCount).
      let embedding_outputTensorCount = 1;
      tensorNumDifference_apply_before_after
        = embedding_outputTensorCount - inputTensorDestroyCount;

      // Test memory leakage of Embedding.apply.
      let memoryInfo_apply_before = tf.memory();
      outputTensor3d = embedding.apply( inputTensor3d );
      let memoryInfo_apply_after = tf.memory();

      if ( memoryInfo_apply_after.numTensors
             != ( memoryInfo_apply_before.numTensors
                    + tensorNumDifference_apply_before_after ) )
        throw Error( `Embedding.apply() memory leak. `
          + `result tensor count ( ${memoryInfo_apply_after.numTensors} ) `
          + `should be ( `
          + `${ ( memoryInfo_apply_before.numTensors
                    + tensorNumDifference_apply_before_after ) } `
          + ` ). ${embedding}` );

      if ( !inputTensor3d )
        throw Error( `Embedding inputTensor3d should not be null. `
          + `${embedding}` ); // But may be disposed.

      if ( !outputTensor3d )
        throw Error( `Embedding outputTensor3d should not be null. `
          + `${embedding}` );

      { // Test output channel count.

        // Axis id 2 is depth (i.e. channel) dimension.
        const CHANNEL_AXIS_ID = 2;

        let outputTensorChannelCount = 0;

        if (   ( outputTensor3d )
            && ( outputTensor3d.shape.length > CHANNEL_AXIS_ID ) )
          outputTensorChannelCount
            = outputTensor3d.shape[ CHANNEL_AXIS_ID ];

        // The real channel count of the output tensor should be the same as
        // predicted output channel count.
        Embedding_Reference_Base.AssertTwoEqualValues( "outputChannelCount",
          embedding.output_channelCount, outputTensorChannelCount, embedding );
      }

      // Test correctness of Embedding BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( embedding,
        this.testCorrectness_imageOutReference, embedding );

      // Test correctness of Embedding.apply.
      this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d,
        this.testCorrectness_imageOutReference, embedding );

      embedding.disposeResources_and_recycleToPool();
      embedding = null;
    }
    let memoryInfo_afterDispose = tf.memory();

    if ( memoryInfo_afterDispose.numTensors
           != ( memoryInfo_beforeCreate.numTensors
                  + tensorNumDifference_apply_before_after ) )
      throw Error(  `Embedding create/dispose memory leak. `
        + `result tensor count ( ${memoryInfo_afterDispose.numTensors} ) `
        + `should be ( `
        + `${ ( memoryInfo_beforeCreate.numTensors
                  + tensorNumDifference_apply_before_after ) } `
        + `). ${embedding}` );

    tf.dispose( outputTensor3d );
  }

  /**
   * Check the Embedding's output's BoundsArraySet.
   *
   * @param {Embedding.Base} embedding
   *   The embedding to be checked.
   *
   * @param {NumberImage.Base} imageOutReference
   *   Refernece output Image data of the Embedding_Reference's calcResult().
   */
  assert_imageOut_BoundsArraySet(
    embedding, imageOutReference, parametersDescription ) {

    BoundsArraySet_Asserter.assert_ScaleBoundsArray( this.asserter_Equal,
      embedding.output_scaleBoundsArray,
      imageOutReference.boundsArraySet.output0,
      "output0", "output0_Ref", "Embedding", parametersDescription );
  }

  /**
   * Check the Embedding's output according to input (for correctness testing).
   *
   * @param {tf.tensor3d} outputTensor
   *   The output tensor of the Embedding's apply().
   *
   * @param {NumberImage.Base} imageOutReference
   *   Refernece output Image data of the Embedding_Reference's calcResult().
   */
  assert_imageOut_Tensors_byNumberArrays(
    outputTensor, imageOutReference, parametersDescription ) {

    let outputArrayRef;

    if ( imageOutReference ) {
      // Get referenced result (as number array).
      outputArrayRef = imageOutReference.dataArray;
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
   *   Either Embedding.AddGatherReshape or Embedding.SplitReshapeGatherConcat.
   *
   * @param {Embedding_TestParams.Base} testParams
   *   The test parameters. It is the value of
   * Embedding_TestParams.Base.ParamsGenerator()'s result.
   *
   * @return {Embedding.Base}
   *   The created Embedding object.
   */
  static Embedding_create( EmbeddingClass, testParams ) {

    let embedding = EmbeddingClass.Pool.get_or_create_by(
      null,                // parentNameable
      EmbeddingClass.name, // Embedding Name
    );

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    // Initialize successfully or failed.
    let extractedParams = Embedding.Params.Pool.get_or_create_by(
      testParams.in.input_height,
      testParams.in.input_width,
      testParams.in.input_channelCount,
      testParams.in.channelMultiplier,
      testParams.in.vocabularyCountPerInputChannel,
      testParams.in.bEmbedVocabularyId,
      testParams.in.bKeepInputTensor,
      testParams.in.bTableLog,
    );

    let bInitOk = embedding.init( progress,
      testParams.in_weights.weightArray,
      testParams.in_weights.weightElementOffsetBegin,
      extractedParams
    );

    if ( embedding.bInitOk != bInitOk )
      throw Error( `Embedding validation state ( ${embedding.bInitOk} ) `
        + `mismatches initer's result ( ${bInitOk} ). ${embedding}` );

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    if ( false == bInitOk )
      throw Error( `Failed to initialize embedding object. ${embedding}` );

    if ( 100 != progress.valuePercentage )
      throw Error( `Progress (${progress.valuePercentage}) should be 100 `
        + `when initializing block object successfully. ${embedding}`);

    progress.disposeResources_and_recycleToPool();
    progress = null;

    //!!! For Debug. (parsing ending position)
    // if ( embedding.weightElementOffsetEnd
    //        != testParams.in_weights.weightArray.length ) {
    //   debugger;
    // }

    let embedding_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by(
      "Embedding", embedding, embedding );

    Embedding_Reference_Base.AssertTwoEqualValues( "parsing beginning position",
      embedding.weightElementOffsetBegin,
      testParams.in_weights.weightElementOffsetBegin, embedding );

    Embedding_Reference_Base.AssertTwoEqualValues( "parsing ending position",
      embedding.weightElementOffsetEnd,
      testParams.in_weights.weightArray.length, embedding );

    // parameters.
    embedding_asserter.propertyValue( "input_height",
      testParams.out.input_height );
    embedding_asserter.propertyValue( "input_width",
      testParams.out.input_width );
    embedding_asserter.propertyValue( "input_channelCount",
      testParams.out.input_channelCount );
    embedding_asserter.propertyValue( "channelMultiplier",
      testParams.out.channelMultiplier );
    embedding_asserter.propertyValue( "vocabularyCountPerInputChannel",
      testParams.out.vocabularyCountPerInputChannel );
    embedding_asserter.propertyValue( "bEmbedVocabularyId",
      testParams.out.bEmbedVocabularyId );

    // Inferenced parameters.
    let { output_height, output_width, output_channelCount
    } = testParams.out.inferencedParams;

    embedding_asserter.propertyValue( "output_height",
      output_height );
    embedding_asserter.propertyValue( "output_width",
      output_width );
    embedding_asserter.propertyValue( "output_channelCount",
      output_channelCount );

    // Other parameters.
    embedding_asserter.propertyValue( "bKeepInputTensor",
      testParams.out.bKeepInputTensor );

    embedding_asserter.propertyValue( "bTableLog",
      testParams.out.bTableLog );

    {
      let tensorWeightCountTotal = 0;
      let tensorWeightCountExtracted = 0;

      if ( testParams.out.bEmbedVocabularyId ) {
        tensorWeightCountExtracted
          = testParams.out.input_channelCount
              * ( testParams.out.channelMultiplier - 1 )
              * testParams.out.vocabularyCountPerInputChannel;
      } else {
        tensorWeightCountExtracted
          = testParams.out.input_channelCount
              * testParams.out.channelMultiplier
              * testParams.out.vocabularyCountPerInputChannel;
      }

      //!!! (2022/07/27 Remarked) Because embedding may use some extra
      // tensors, the tensorWeightCountTotal may not the same as
      // tensorWeightCountExtracted.
      //
      // tensorWeightCountTotal = tensorWeightCountExtracted;
      // embedding_asserter.propertyValue( "tensorWeightCountTotal",
      //   tensorWeightCountTotal );

      embedding_asserter.propertyValue( "tensorWeightCountExtracted",
        tensorWeightCountExtracted );
      embedding_asserter.propertyValueLE( "tensorWeightCountExtracted",
        embedding.tensorWeightCountTotal );
    }

    embedding_asserter.disposeResources_and_recycleToPool();
    embedding_asserter = null;

    return embedding;
  }

  /** */
  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    if ( value1 != value2 )
      throw Error( `Embedding ${valueName} (${value1}) should be (${value2}). `
        + `${parametersDescription}` );
  }


  /**
   * According to imageIn and this.testParams.in.paramsNumberArrayObject,
   * calculate imageOut.
   *
   * @param {NumberImage.Base} imageIn
   *   The image to be tested.
   *
   * @return {NumberImage.Base}
   *   Return output image.
   */
  calcResult( imageIn ) {
    const testParams = this.testParams;
    const testParamsOut = this.testParams.out;

    const {
      input_height, input_width, input_channelCount,
      channelMultiplier,
      bEmbedVocabularyId,
      bTableLog,
    } = testParamsOut;

    const { output_height, output_width, output_channelCount
    } = testParamsOut.inferencedParams;

    let imageOut;
    {
      let preFilledValue = undefined;
      let preFilledBounds = undefined;
      let input1_ScaleBoundsArray = null;
      imageOut = NumberImage.Base.Pool.get_or_create_by(
        output_height, output_width, output_channelCount, preFilledValue,
        imageIn.boundsArraySet.output0, input1_ScaleBoundsArray,
        BoundsArraySet.InputsOutputs, preFilledBounds
      );

      imageOut.boundsArraySet.output0.set_all_byBoundsArray(
        testParams.out_boundsArray );
    }

    let tableChannelCountPerInputChannel;
    let outChannelSubBegin;
    if ( bEmbedVocabularyId ) {
      tableChannelCountPerInputChannel = ( channelMultiplier - 1 );
      outChannelSubBegin = 1;
    } else {
      tableChannelCountPerInputChannel = channelMultiplier;
      outChannelSubBegin = 0;
    }

    let inElementIndex = 0;
    let outElementIndex = 0;

    for ( let y = 0; y < input_height; ++y ) {
      for ( let x = 0; x < input_width; ++x ) {

        //let outChannel = 0;
        for ( let inChannel = 0; inChannel < input_channelCount; ++inChannel ) {
          let vocabularyTable
            = testParams.in.paramsNumberArrayObject[ inChannel ];

          let vocabularyId
            = imageIn.dataArray[ inElementIndex ]; // should be an integer.

          let vocabularyElementIndex
            = vocabularyId * tableChannelCountPerInputChannel;

          if ( bEmbedVocabularyId ) {
            imageOut.dataArray[ outElementIndex ] = vocabularyId;
            ++outElementIndex;
            //++outChannel;
          }

          for ( let outChannelSub = outChannelSubBegin;
            outChannelSub < channelMultiplier; ++outChannelSub ) {

            imageOut.dataArray[ outElementIndex ]
              = vocabularyTable[ vocabularyElementIndex ];

            ++vocabularyElementIndex;
            ++outElementIndex;
            //++outChannel;
          }

          ++inElementIndex;
        }
      }
    }

    if ( bTableLog ) {
      console.group( `Embedding_Reference` );

      let headerPrefix = this.nameString_recursively_get();

      const extraName = `channelMultiplier_${channelMultiplier}`;
      headerPrefix = this.nameJoinSeparator_join( headerPrefix, extraName );

      imageOut.TableLog_header_body( headerPrefix );

      console.groupEnd();  // groupLabel "Embedding_Reference"
    }

    return imageOut;
  }

}
