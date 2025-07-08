export { NeuralNet_Reference_Base as Base };

import * as HierarchicalNameable from "../../util/HierarchicalNameable.js";
import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NameNumberArrayObject from "../../util/NameNumberArrayObject.js";
import * as TableLogger from "../../util/TableLogger.js";
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
import * as Block_Reference from "./Block_Reference.js"; 
import * as NeuralNet_TestParams from "./NeuralNet_TestParams.js"; 
// import * as Embedding from "../../Conv/Stage.js";
// import * as Stage from "../../Conv/Stage.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";

/**
 * Reference computation of class NeuralNet.Base.
 */
class NeuralNet_Reference_Base
  extends HierarchicalNameable.SeparatorSlash_Root {

  /**
   * Used as default NeuralNet_Reference.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet_Reference.Base.Pool",
    NeuralNet_Reference_Base );

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
    this.Embedding_Reference = Embedding_Reference.Base.Pool.get_or_create_by(
      this, "Embedding_Reference" );

    this.Stage_Reference = Stage_Reference.Base.Pool.get_or_create_by(
      this, "Stage_Reference" );

    this.Block_Reference = Block_Reference.Base.Pool.get_or_create_by(
      this, "Block_Reference" );

//!!! (2023/04/15)
// For clamped and integerized output, acceptable delta should be smaller.
//    this.asserter_Equal
    this.asserter_Equal
      = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.001, 0.0001 );
      // = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.01, 0.005 );

    // For reducing memory allocation.

    // imageInArray[ 0 ] is input0, imageInArray[ 1 ] is input1.
    this.imageInArray = Recyclable.Array.Pool.get_or_create_by( 2 );

    // imageOutArray[ 0 ] is output0, imageOutArray[ 1 ] is output1.
    this.imageOutArray = Recyclable.Array.Pool.get_or_create_by( 2 );
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

    this.Stage_Reference?.disposeResources_and_recycleToPool();
    this.Stage_Reference = null;

    this.Embedding_Reference?.disposeResources_and_recycleToPool();
    this.Embedding_Reference = null;

    super.disposeResources();
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {NeuralNet_TestParams.Base} testParams
   *   The test parameters. It is the value of
   * NeuralNet_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  testCorrectness( imageSourceBag, testParams ) {

    const {
      inferencedParams: { input_height, input_width, input_channelCount },
    } = testParams.out;

    this.testCorrectness_imageIn = imageSourceBag.getImage_by(
      input_height, input_width, input_channelCount );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before(
      "NeuralNet_Reference.Base.testCorrectness_internal()",
      NeuralNet_Reference_Base.testCorrectness_internal,
      this, imageSourceBag, testParams );

    this.testCorrectness_imageIn = null;
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {NeuralNet_TestParams.Base} testParams
   *   The test parameters. It is the value of
   * NeuralNet_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  static testCorrectness_internal( imageSourceBag, testParams ) {
    this.testParams = testParams;

    const bTableLog = testParams.out.bTableLog;
    if ( bTableLog ) {
      const groupLabel = `testParams.id == ${testParams.id}`;
      console.groupCollapsed( groupLabel );

      console.groupCollapsed( "imageIn" );
      {
        const imageIn_imageHeaderPrefix = "imageIn";
        const imageIn_strSubheader = undefined;
        this.testCorrectness_imageIn.TableLog_header_body(
          imageIn_imageHeaderPrefix, imageIn_strSubheader );
      }
      console.groupEnd(); // imageIn
    }

    this.testCorrectness_imageOutReference
      = this.calcResult( this.testCorrectness_imageIn );

    Pool.Asserter.assert_Pool_issuedCount_same_after_as_before(
      "NeuralNet_Reference.Base.neuralNet_create_apply_internal()",
      NeuralNet_Reference_Base.neuralNet_create_apply_internal,
      this, imageSourceBag, testParams );

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
   * @param {NeuralNet_Reference.Base} this
   *   The referenece object to do the calculate.
   *
   */
  static neuralNet_create_apply_internal( imageSourceBag, testParams ) {
    const parentNameable = null;
    const neuralNetName = "neuralNet_Base";

    const {
      inferencedParams: { input_height, input_width, input_channelCount },
      bKeepInputTensor, bTableLog,
    } = testParams.out;

    let inputTensor3d_fromBag = imageSourceBag.getTensor3d_by(
      input_height, input_width, input_channelCount );

    let inputTensor3d;

    // How many input tensors will be destroyed by NeuralNet.apply().
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

    // Test memory leakage of stage create/dispose.
    let memoryInfo_beforeCreate = tf.memory();
    {
      let neuralNet = NeuralNet_Reference_Base.NeuralNet_create(
        parentNameable, neuralNetName,
        testParams );

      // Table log the input tensor if requested.
      const bTableLog = neuralNet.bTableLog;
      if ( bTableLog ) {
        const imageIn_BoundsArraySet
          = this.testCorrectness_imageIn.boundsArraySet;
        const imageIn_ScaleBoundsArray = imageIn_BoundsArraySet.output0;

        console.groupCollapsed( "tensorIn" );
        {
          const tensorIn_imageHeaderPrefix = "tensorIn";
          const tensorIn_strSubheader = undefined;
          TableLogger.Base.Singleton.log_tensor3d_along_depth(
            tensorIn_imageHeaderPrefix, tensorIn_strSubheader,
            inputTensor3d,
            imageIn_ScaleBoundsArray );
        }
        console.groupEnd(); // tensorIn
      }

      // The difference tensor count will be the generated tensor count (i.e.
      // outputTensorCount) minus destroyed input tensor count (i.e.
      // inputTensorDestroyCount).
      let neuralNet_outputTensorCount = 1;
      tensorNumDifference_apply_before_after
        = neuralNet_outputTensorCount - inputTensorDestroyCount;

      // Test memory leakage of NeuralNet.apply.
      let memoryInfo_apply_before = tf.memory();
      {
        outputTensor3d = neuralNet.apply( inputTensor3d );

        if ( 100 != neuralNet.progressApply.valuePercentage )
          throw Error( `NeuralNet_Reference_Base`
            + `.neuralNet_create_apply_internal(): `
            + `Progress ( ${neuralNet.progressApply.valuePercentage} ) `
            + `should be 100 `
            + `after neuralNet.apply(). ${neuralNet}`);
      }
      let memoryInfo_apply_after = tf.memory();

      const numTensors_expected
        = memoryInfo_apply_before.numTensors
            + tensorNumDifference_apply_before_after;

      if ( memoryInfo_apply_after.numTensors != numTensors_expected )
        throw Error( `NeuralNet.apply() memory leak. `
          + `result tensor count ( ${memoryInfo_apply_after.numTensors} ) `
          + `should be ( ${numTensors_expected} ) `
          + `${neuralNet}` );

      if ( !inputTensor3d )
        throw Error( `NeuralNet inputTensor3d should not be null. `
          + `${neuralNet}` ); // But may be disposed.

      if ( !outputTensor3d )
        throw Error( `NeuralNet outputTensor3d should not be null. `
          + `${neuralNet}` );

      { // Test output channel count.

        // Axis id 2 is depth (i.e. channel) dimension.
        const CHANNEL_AXIS_ID = 2;

        let outputTensorChannelCount = 0;

        if (   ( outputTensor3d )
            && ( outputTensor3d.shape.length > CHANNEL_AXIS_ID ) )
          outputTensorChannelCount = outputTensor3d.shape[ CHANNEL_AXIS_ID ];

        // The real channel count of the output tensor should be the same as
        // predicted output channel count.
        NeuralNet_Reference_Base.AssertTwoEqualValues( "output_channelCount",
          neuralNet.output_channelCount, outputTensorChannelCount,
          neuralNet );
      }

      // Test correctness of NeuralNet BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( neuralNet,
        this.testCorrectness_imageOutReference, neuralNet );

      // Test correctness of NeuralNet.apply.
      this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d,
        this.testCorrectness_imageOutReference, neuralNet );

      // Check pixel values whether inside bounds.
      BoundsArraySet_Asserter.assert_Tensor3d_byBoundsArray(
        outputTensor3d,
        neuralNet.output_scaleBoundsArray.boundsArray );

      // Compare result of ShuffleNetV2 and ShuffleNetV2_byMobileNetV1.
      NeuralNet_Reference_Base
        .neuralNet_compare_ShuffleNetV2_and_ShuffleNetV2_byMobileNetV1
        .call( this,
          parentNameable, neuralNetName,
          testParams,
          inputTensor3d_fromBag, outputTensor3d );

      neuralNet.disposeResources_and_recycleToPool();
      neuralNet = null;
    }
    let memoryInfo_afterDispose = tf.memory();

    const numTensors_expected
      = memoryInfo_beforeCreate.numTensors
          + tensorNumDifference_apply_before_after;

    if ( memoryInfo_afterDispose.numTensors != numTensors_expected )
      throw Error( `NeuralNet create/dispose memory leak. `
        + `result tensor count ( ${memoryInfo_afterDispose.numTensors} ) `
        + `should be ( ${numTensors_expected} ) `
        + `${neuralNet}` );

    tf.dispose( outputTensor3d );
  }

  /**
   * @param {NeuralNet_TestParams.Base} testParams
   *   The neuralNet's testing parameters.
   *
   * @param {tf.tensor} inputTensor3d_fromBag
   *   The input tensor from imageSourceBag.
   *
   * @param {tf.tensor} outputTensor3d_original
   *   The output tensor (from original neuralNet) to be compared.
   */
  static neuralNet_compare_ShuffleNetV2_and_ShuffleNetV2_byMobileNetV1(
    parentNameable, neuralNetName,
    testParams,
    inputTensor3d_fromBag, outputTensor3d_original ) {

    let {
      nConvStageTypeId,
      bKeepInputTensor,
    } = testParams.out;

    if (   ( nConvStageTypeId
               != ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2 )
        && ( nConvStageTypeId
               != ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 ) )
      return; // Only compare ShuffleNetV2 and ShuffleNetV2_byMobileNetV1.

    // Determine which ConvStageType will be generated.
    let nConvStageTypeId_original = nConvStageTypeId;
    let nConvStageTypeId_toBeCompared;
    switch ( nConvStageTypeId ) {
      case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2:
        nConvStageTypeId_toBeCompared
          = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1;
        break;
      case ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1:
        nConvStageTypeId_toBeCompared
          = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2;
        break;
    }

    let nConvStageTypeId_original_name
      = ValueDesc.ConvStageType.Singleton.getName_byId(
          nConvStageTypeId_original );

    let nConvStageTypeId_toBeCompared_name
      = ValueDesc.ConvStageType.Singleton.getName_byId(
          nConvStageTypeId_toBeCompared );

    // Modify nConvStageTypeId.
    let nConvStageTypeId_weightElementIndex;
    {
      // i.e. Needs parameter nConvStageTypeId is inside .inputWeightArray.
      if ( testParams.in.nConvStageTypeId == null ) {
        nConvStageTypeId_weightElementIndex
          = NameNumberArrayObject.weightArray_weightElementOffsetBegin
              .weightElementIndex_find_byName(
                NeuralNet_TestParams.Base.paramsNameOrderArray_Basic,
                testParams.in.paramsNumberArrayObject,
                testParams.in_weights.weightElementOffsetBegin,
                NeuralNet.Params.nConvStageTypeId.paramName );

        testParams.in_weights.weightArray[ nConvStageTypeId_weightElementIndex ]
          = nConvStageTypeId_toBeCompared;

        // It seems not necessary to re-compose .inputWeightArray because all
        // stages' parameters are generated directly by
        // NeuralNet_StageParamsCreator (i.e. not in the .inputWeightArray).

      } else {
        testParams.in.nConvStageTypeId = nConvStageTypeId_toBeCompared;
      }
    }

    let neuralNet_toBeCompared = NeuralNet.Base.Pool.get_or_create_by(
      parentNameable, neuralNetName
    );

    // Initialize successfully or failed.
    let extractedParams = NeuralNet.Params.Pool.get_or_create_by(
      testParams.in.explicit_input_height,
      testParams.in.explicit_input_width,
      testParams.in.explicit_input_channelCount,
      testParams.in.has_implicit_input,
      testParams.in.vocabularyChannelCount,
      testParams.in.vocabularyCountPerInputChannel,
      testParams.in.nConvStageTypeId,
      testParams.in.blockCountTotalRequested,
      testParams.in.output_channelCount,
      testParams.in.output_asInputValueRange,
      testParams.in.bKeepInputTensor,
      testParams.in.bTableLog
    );

    let progressInit = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
    let bInitOk = neuralNet_toBeCompared.init( progressInit,
      testParams.in_weights.weightArray,
      testParams.in_weights.weightElementOffsetBegin,
      extractedParams
    );

    if ( false == bInitOk )
      throw Error( `Failed to initialize neuralNet object. `
        + `${neuralNet_toBeCompared}` );

    if ( 100 != progressInit.valuePercentage )
      throw Error( `NeuralNet_Reference_Base.`
        + `neuralNet_compare_ShuffleNetV2_and_ShuffleNetV2_byMobileNetV1(): `
        + `Progress (${progressInit.valuePercentage}) should be 100 `
        + `when initializing NeuralNet object successfully. `
        + `${neuralNet_toBeCompared}` );

    progressInit.disposeResources_and_recycleToPool();
    progressInit = null;

    // Prepare input tensor.
    let inputTensor3d;
    if ( bKeepInputTensor ) {
      // The same one because it will not be destroyed. 
      inputTensor3d = inputTensor3d_fromBag;
    } else {
      // Clone for being destroyed.
      inputTensor3d = inputTensor3d_fromBag.clone();
    }

    let outputTensor3d;
    {
      outputTensor3d = neuralNet_toBeCompared.apply( inputTensor3d );
  
      if ( 100 != neuralNet_toBeCompared.progressApply.valuePercentage )
        throw Error( `NeuralNet_Reference_Base`
          + `.neuralNet_compare_ShuffleNetV2_and_ShuffleNetV2_byMobileNetV1(): `
          + `Progress `
          + `( ${neuralNet_toBeCompared.progressApply.valuePercentage} ) `
          + `should be 100 `
          + `after neuralNet.apply(). ${neuralNet_toBeCompared}`);
    }

    {
      // Test correctness of NeuralNet BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( neuralNet_toBeCompared,
        this.testCorrectness_imageOutReference, neuralNet_toBeCompared );

      //!!! (2022/07/23 Remarked) Compare to outputTensor3d_original directly.
      //// Test correctness of NeuralNet.apply.
      //this.assert_imageOut_Tensors_byNumberArrays( outputTensor3d,
      //  this.testCorrectness_imageOutReference, neuralNet );

      // Check pixel values whether inside bounds.
      BoundsArraySet_Asserter.assert_Tensor3d_byBoundsArray(
        outputTensor3d,
        neuralNet_toBeCompared.output_scaleBoundsArray.boundsArray );

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
        // Do nothing. It seems not necessary to re-compose .inputWeightArray
        // because it will not be used again.
      } else {
        testParams.in.nConvStageTypeId = nConvStageTypeId_original;
      }
    }  
  
  }

  /**
   * Check the NeuralNet's output's BoundsArraySet.
   *
   * @param {NeuralNet.Base} neuralNet
   *   The neuralNet to be checked.
   *
   * @param {NumberImage.Base} imageOutReference
   *   Refernece output Image data of the NeuralNet_Reference's calcResult().
   */
  assert_imageOut_BoundsArraySet(
    neuralNet, imageOutReference, parametersDescription ) {

    BoundsArraySet_Asserter.assert_ScaleBoundsArray( this.asserter_Equal,
      neuralNet.output_scaleBoundsArray,
      imageOutReference.boundsArraySet.output0,
      "output0", "output0_Ref", "NeuralNet", parametersDescription );
  }

  /**
   * Check the NeuralNet's output according to input (for correctness testing).
   *
   * @param {tf.tensor3d} outputTensor
   *   The output tensor of the NeuralNet's apply().
   *
   * @param {NumberImage.Base} imageOutReference
   *   Refernece output Image data of the NeuralNet_Reference's calcResult().
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
      "NeuralNet", "outputTensor", "outputRef", parametersDescription
    );

    // Check outputTensor.dtype is "float32" or "int32".
    if ( this.testParams.out.output_asInputValueRange ) {
      if ( outputTensor.dtype !== "int32" )
        throw Error( `NeuralNet_Reference_Base.`
          + `assert_imageOut_Tensors_byNumberArrays(): `
          + `outputTensor.dtype ( ${outputTensor.dtype} ) `
          + `should be "int32" when testParams.out.output_asInputValueRange `
          + `( ${this.testParams.out.output_asInputValueRange} ) is true.`
        );
    } else {
      if ( outputTensor.dtype !== "float32" )
        throw Error( `NeuralNet_Reference_Base.`
          + `assert_imageOut_Tensors_byNumberArrays(): `
          + `outputTensor.dtype ( ${outputTensor.dtype} ) `
          + `should be "int32" when testParams.out.output_asInputValueRange `
          + `( ${this.testParams.out.output_asInputValueRange} ) is false.`
        );
    }
  }

  /**
   * @param {NeuralNet_TestParams.Base} testParams
   *   The test parameters. It is the value of
   * NeuralNet_TestParams.Base.ParamsGenerator()'s result.
   *
   * @return {NeuralNet.Base}
   *   The created NeuralNet object.
   */
  static NeuralNet_create(
    parentNameable, neuralNetName,
    testParams ) {

    let neuralNet = NeuralNet.Base.Pool.get_or_create_by(
      parentNameable, neuralNetName );

    let progressInit = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    // Initialize successfully or failed.
    let extractedParams = NeuralNet.Params.Pool.get_or_create_by(
      testParams.in.explicit_input_height,
      testParams.in.explicit_input_width,
      testParams.in.explicit_input_channelCount,
      testParams.in.has_implicit_input,
      testParams.in.vocabularyChannelCount,
      testParams.in.vocabularyCountPerInputChannel,
      testParams.in.nConvStageTypeId,
      testParams.in.blockCountTotalRequested,
      testParams.in.output_channelCount,
      testParams.in.output_asInputValueRange,
      testParams.in.bKeepInputTensor,
      testParams.in.bTableLog
    );

    let bInitOk = neuralNet.init( progressInit,
      testParams.in_weights.weightArray,
      testParams.in_weights.weightElementOffsetBegin,
      extractedParams
    );

    if ( neuralNet.bInitOk != bInitOk )
      throw Error( `NeuralNet validation state (${neuralNet.bInitOk}) `
        + `mismatches initer's result (${bInitOk}). ${neuralNet}` );

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    if ( false == bInitOk )
      throw Error( `Failed to initialize neuralNet object. ${neuralNet}` );

    if ( 100 != progressInit.valuePercentage )
      throw Error( `NeuralNet_Reference_Base.NeuralNet_create(): `
        + `Progress (${progressInit.valuePercentage}) should be 100 `
        + `when initializing NeuralNet object successfully. ${neuralNet}`);
  
    progressInit.disposeResources_and_recycleToPool();
    progressInit = null;

    //!!! For Debug. (parsing ending position)
    if ( neuralNet.weightElementOffsetEnd
           != testParams.in_weights.weightArray.length ) {
      debugger;
    }

    let neuralNet_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by(
      "NeuralNet", neuralNet, neuralNet );

    NeuralNet_Reference_Base.AssertTwoEqualValues( "parsing beginning position",
      neuralNet.weightElementOffsetBegin,
      testParams.in_weights.weightElementOffsetBegin, neuralNet );

    NeuralNet_Reference_Base.AssertTwoEqualValues( "parsing ending position",
      neuralNet.weightElementOffsetEnd,
      testParams.in_weights.weightArray.length, neuralNet );

    // parameters.
    neuralNet_asserter.propertyValue( "explicit_input_height",
      testParams.out.explicit_input_height );
    neuralNet_asserter.propertyValue( "explicit_input_width",
      testParams.out.explicit_input_width );
    neuralNet_asserter.propertyValue( "explicit_input_channelCount",
      testParams.out.explicit_input_channelCount );
    neuralNet_asserter.propertyValue( "has_implicit_input",
      testParams.out.has_implicit_input );
    neuralNet_asserter.propertyValue( "vocabularyChannelCount",
      testParams.out.vocabularyChannelCount );
    neuralNet_asserter.propertyValue( "vocabularyCountPerInputChannel",
      testParams.out.vocabularyCountPerInputChannel );
    neuralNet_asserter.propertyValue( "nConvStageTypeId",
      testParams.out.nConvStageTypeId );
    neuralNet_asserter.propertyValue( "blockCountTotalRequested",
      testParams.out.blockCountTotalRequested );
    neuralNet_asserter.propertyValue( "nActivationId",
      testParams.out.nActivationId );
    neuralNet_asserter.propertyValue( "output_channelCount",
      testParams.out.output_channelCount );
    neuralNet_asserter.propertyValue( "output_asInputValueRange",
      testParams.out.output_asInputValueRange );

    // Inferenced parameters.
    const {
      implicit_input_height, implicit_input_width, implicit_input_channelCount,
      input_height, input_width, input_channelCount,
      feedbackShape,
  
      stageCount, blockCountPerStage, blockCountTotal,
      stageLast_output_height,
      stageLast_output_width,
      stageLast_output_channelCount,
      output_height, output_width,
    } = testParams.out.inferencedParams;

    neuralNet_asserter.propertyValue( "implicit_input_height",
      implicit_input_height );
    neuralNet_asserter.propertyValue( "implicit_input_width",
      implicit_input_width );
    neuralNet_asserter.propertyValue( "implicit_input_channelCount",
      implicit_input_channelCount );

    neuralNet_asserter.propertyValue( "input_height",
      input_height );
    neuralNet_asserter.propertyValue( "input_width",
      input_width );
    neuralNet_asserter.propertyValue( "input_channelCount",
      input_channelCount );

    if ( neuralNet.has_implicit_input )
      neuralNet_asserter.propertyValueNE( "feedbackShape", null );
    else // Both null.
      neuralNet_asserter.propertyValue( "feedbackShape", feedbackShape );

    neuralNet_asserter.propertyValue( "stageCount",
      stageCount );
    neuralNet_asserter.propertyValue( "stageCount",
      testParams.stageArray.length );

    neuralNet_asserter.propertyValue( "blockCountPerStage",
      blockCountPerStage );
    neuralNet_asserter.propertyValue( "blockCountTotal",
      blockCountTotal );
    neuralNet_asserter.propertyValueGE( "blockCountTotal",
      testParams.out.blockCountTotalRequested );

    neuralNet_asserter.propertyValue( "stageLast_output_height",
      stageLast_output_height );
    neuralNet_asserter.propertyValue( "stageLast_output_width",
      stageLast_output_width );
    neuralNet_asserter.propertyValue( "stageLast_output_channelCount",
      stageLast_output_channelCount );
    neuralNet_asserter.propertyValueGE( "stageLast_output_channelCount",
      testParams.out.output_channelCount );

    // (2022/08/18 Remarked) Because at least ( stageCount == 1 ), it is
    // possible that the stageLast_output_channelCount is larger than twice of
    // output_channelCount.
    //
    //neuralNet_asserter.propertyValueLE( "stageLast_output_channelCount",
    //  testParams.out.output_channelCount * 2 );

    neuralNet_asserter.propertyValue( "output_height", output_height );
    neuralNet_asserter.propertyValue( "output_height", 1 );
    neuralNet_asserter.propertyValue( "output_width", output_width );
    neuralNet_asserter.propertyValue( "output_width", 1 );

    // Every stage will double channel count.
    let embedding_output_channelCount
      = input_channelCount * testParams.out.vocabularyChannelCount;
    neuralNet_asserter.propertyValue( "stageLast_output_channelCount",
      embedding_output_channelCount * ( 2 ** stageCount ) );

    // Other parameters.
    neuralNet_asserter.propertyValue( "bKeepInputTensor",
      testParams.out.bKeepInputTensor );

    neuralNet_asserter.propertyValue( "bTableLog",
      testParams.out.bTableLog );

    NeuralNet_Reference_Base.AssertParameters_NeuralNet_embedding(
      neuralNet, neuralNet ); // Test embedding 's parameters.
    NeuralNet_Reference_Base.AssertParameters_NeuralNet_stages(
      neuralNet, neuralNet ); // Test every stage's parameters.

    {
      let tensorWeightCountTotal = 0;
      let tensorWeightCountExtracted = 0;

      if ( neuralNet.embedding ) {
        tensorWeightCountTotal
          += neuralNet.embedding.tensorWeightCountTotal;
        tensorWeightCountExtracted
          += neuralNet.embedding.tensorWeightCountExtracted;
      }

      for ( let i = 0; i < neuralNet.stageArray.length; ++i ) {
        let stage = neuralNet.stageArray[ i ];
        tensorWeightCountTotal += stage.tensorWeightCountTotal;
        tensorWeightCountExtracted += stage.tensorWeightCountExtracted;
      }

      tensorWeightCountTotal
        += neuralNet.blockFinal.tensorWeightCountTotal;
      tensorWeightCountExtracted
        += neuralNet.blockFinal.tensorWeightCountExtracted;

      neuralNet_asserter.propertyValue( "tensorWeightCountTotal",
        tensorWeightCountTotal );
      neuralNet_asserter.propertyValue( "tensorWeightCountExtracted",
        tensorWeightCountExtracted );
    }

    neuralNet_asserter.disposeResources_and_recycleToPool();
    neuralNet_asserter = null;

    return neuralNet;
  }

  /** */
  static AssertTwoEqualValues(
    valueName, value1, value2, parametersDescription ) {

    if ( value1 != value2 )
      throw Error( `NeuralNet ${valueName} (${value1}) should be (${value2}). `
        + `${parametersDescription}` );
  }

  /** */
  static Assert_nConvStageTypeId_Unknown(
    prefixMsg, nConvStageTypeId, postfixMsg ) {

    let strUnknownConvStageTypeId
      = `${prefixMsg} unknown nConvStageTypeId ( ${nConvStageTypeId} ) value. `
        + `${postfixMsg}`;
    throw Error( strUnknownConvStageTypeId );
  }

  /**
   * Test neural network's embedding parameters.
   *
   * @param {NeuralNet.Base} neuralNet
   *   The neuralNet to be checked. It parameters will be checked.
   *
   */
  static AssertParameters_NeuralNet_embedding(
    neuralNet, parametersDescription ) {
0
    let embedding = neuralNet.embedding;

    let embedding_asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by(
      "NeuralNet.embedding", embedding, parametersDescription );

    embedding_asserter.propertyValue( "channelMultiplier",
      neuralNet.vocabularyChannelCount );
    embedding_asserter.propertyValue( "vocabularyCountPerInputChannel",
      neuralNet.vocabularyCountPerInputChannel );
    embedding_asserter.propertyValue( "bKeepInputTensor",
      neuralNet.bKeepInputTensor );
    embedding_asserter.propertyValue( "bTableLog",
      neuralNet.bTableLog );

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

    let stageCount = stageArray.length;

    if ( stageCount <= 0 )
      throw Error( `NeuralNet stageCount (${stageCount}) should be `
        + `larger than 0. ${parametersDescription}` );

    if ( stageCount < 1 )
      throw Error( `NeuralNet stageCount (${stageCount}) should be `
        + `>= 1. ${parametersDescription}` );

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
          stage_asserter.propertyValue( "input_height",
            neuralNet.input_height );
          stage_asserter.propertyValue( "input_width",
            neuralNet.input_width );
        }

        // Note: NeuralNet.Base does not have information to verify every
        //       stage's input height/width.
      }

      // input_channelCount
      if ( 0 == stageIndex ) { // stage0
        stage_asserter.propertyValue( "input_channelCount",
          neuralNet.input_channelCount * neuralNet.vocabularyChannelCount );

      } else { // stage1, 2, 3, ...
        stage_asserter.propertyValue( "input_channelCount",
          stagePrevious.output_channelCount );
      }

      // nConvStageTypeId
      stage_asserter.propertyValue( "nConvStageTypeId",
        neuralNet.nConvStageTypeId );

      // output_channelCount
      { // Every stage double its input channel count.
        stage_asserter.propertyValue( "output_channelCount",
          stage.input_channelCount * 2 );
      }

      // bKeepInputTensor
      //
      // In NeuralNet, only the embedding layer use specified bKeepInputTensor
      // flag. All stages use ( bKeepInputTensor == false ).
      stage_asserter.propertyValue( "bKeepInputTensor", false );

      stage_asserter.propertyValue( "bTableLog", neuralNet.bTableLog );

      stage_asserter.disposeResources_and_recycleToPool();
      stage_asserter = null;
    }
  }

  /**
   * According to imageIn and this.testParams.in.paramsNumberArrayObject,
   * calculate imageOut.
   *
   * @param {NumberImage.Base} imageIn
   *   The image to be tested.
   *
   * @return {NumberImage.Base} Return output image.
   */
  calcResult( imageIn ) {
    const testParams = this.testParams;

    const bTableLog = testParams.out.bTableLog;
    if ( bTableLog ) {
      const nConvStageTypeNameWithInt
        = ValueDesc.ConvStageType.Singleton.getNameWithInt_byId(
            testParams.out.nConvStageTypeId );

      const neuralNetName = this.nameString_get();
      console.groupCollapsed(
        `${neuralNetName} ( ConvStageType = ${nConvStageTypeNameWithInt} )` );
    }

    let imageOut;
    let imageToBeProccessed = imageIn;

    // 1. Calculate embedding.
    let embeddingRef = this.Embedding_Reference;
    embeddingRef.testParams = testParams.embedding;
    imageOut = embeddingRef.calcResult( imageToBeProccessed );

    // 2. Calculate every stages in sequence.
    let stageRef = this.Stage_Reference;
    for ( let stageIndex = 0;
      stageIndex < testParams.stageArray.length; ++stageIndex ) {

      imageToBeProccessed = imageOut;

      const stageRefName = `Stage_Reference_${stageIndex}`;
      stageRef.name_set( stageRefName ); // Rename stageRef.

      stageRef.testParams = testParams.stageArray[ stageIndex ];
      imageOut = stageRef.calcResult( imageToBeProccessed );

      { // Release intermediate input images.
        if ( imageToBeProccessed ) {
          if ( imageToBeProccessed != imageIn ) {
            imageToBeProccessed.disposeResources_and_recycleToPool();

          // Do not release image from ImageSourceBag.
          }
          imageToBeProccessed = null;
        }
      }
    }

    // 3. Calculate blockFinal.
    {
      imageToBeProccessed = imageOut;

      let blockRef = this.Block_Reference;
      blockRef.testParams = testParams.blockFinal;

      this.imageInArray[ 0 ] = imageToBeProccessed;
      this.imageInArray[ 1 ] = null;

      const blockRefName = `Block_Reference_Final`;
      blockRef.name_set( blockRefName ); // Rename blockRef.

      blockRef.calcResult( this.imageInArray, this.imageOutArray );

      { // Release intermediate input images.
        if ( this.imageInArray[ 0 ] ) {
          if ( this.imageInArray[ 0 ] != imageIn ) {
            this.imageInArray[ 0 ].disposeResources_and_recycleToPool();

          // Do not release image from ImageSourceBag.
          }
          this.imageInArray[ 0 ] = null;
        }

        if ( this.imageInArray[ 1 ] ) {
          this.imageInArray[ 1 ].disposeResources_and_recycleToPool();
          this.imageInArray[ 1 ] = null;
        }
      }

      // The blockFinal should have only input0.
      imageOut = this.imageOutArray[ 0 ];

      // Avoid dangling tensors.
      this.imageInArray[ 0 ] = null;
      this.imageInArray[ 1 ] = null;
      this.imageOutArray[ 0 ] = null;
      this.imageOutArray[ 1 ] = null;
    }

    // 4. Clamp and integerize output.
    if ( testParams.out.output_asInputValueRange ) {
      const lowerBound = 0;
      const upperBound = ( testParams.out.vocabularyCountPerInputChannel - 1 );
      imageOut.modify_byClamp_toInt(
        lowerBound, upperBound,
        bTableLog,
        testParams.out, "output_clamp_int" );
    }

    if ( bTableLog )
      console.groupEnd();  // groupLabel "NeuralNet_Reference"

    return imageOut;
  }

}
